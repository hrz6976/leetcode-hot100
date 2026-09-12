import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createProgressFile } from './progress-file.mjs';
import { readOpenCodeGoKey } from './opencode-go.mjs';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
};
function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}
async function readBody(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 6 * 1024 * 1024) throw Object.assign(new Error('数据超过 6 MiB 限制'), { status: 413 });
    chunks.push(chunk);
  }
  // 必须拼接字节后再解码，中文字符可能被分到两个网络数据块。
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
async function forwardGo(req, res, body, upstreamFetch, getGoKey) {
  const localKey = req.headers.authorization ? null : await getGoKey();
  const authorization = req.headers.authorization || (localKey ? `Bearer ${localKey}` : null);
  if (!authorization || !req.headers['x-opencode-session']) {
    return json(res, 400, { error: '缺少 API Key 或会话编号' });
  }
  const aborter = new AbortController();
  const timeout = setTimeout(() => aborter.abort(), 120000);
  res.on('close', () => aborter.abort());
  try {
    const response = await upstreamFetch('https://opencode.ai/zen/go/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
        'User-Agent': 'hot100-learning-assistant/2.0',
        'x-opencode-session': req.headers['x-opencode-session'],
      },
      body: JSON.stringify(body),
      signal: aborter.signal,
    });
    res.writeHead(response.status, {
      'Content-Type': response.headers.get('content-type') || 'text/event-stream',
      'Cache-Control': 'no-store',
    });
    if (response.body) for await (const chunk of response.body) res.write(chunk);
    res.end();
  } finally {
    clearTimeout(timeout);
  }
}

export function createLocalServer(root, { upstreamFetch = fetch, getGoKey = readOpenCodeGoKey, progressDirectory = resolve(root, 'progress') } = {}) {
  root = resolve(root);
  const token = randomUUID();
  const progress = createProgressFile(progressDirectory);
  return http.createServer(async (req, res) => {
    try {
      const host = req.headers.host;
      if (!/^127\.0\.0\.1:\d+$/.test(host || '')) return json(res, 403, { error: '仅支持本机访问' });
      const origin = `http://${host}`;
      if (req.headers.origin && req.headers.origin !== origin) return json(res, 403, { error: '来源不匹配' });
      const pathname = new URL(req.url, origin).pathname;
      if (pathname === '/api/session' && req.method === 'GET') {
        return json(res, 200, { token, openCodeGoAvailable: Boolean(await getGoKey()) });
      }

      if (pathname.startsWith('/api/')) {
        if (req.headers['x-hot100-token'] !== token) return json(res, 403, { error: '请刷新页面后重试' });
        if (pathname === '/api/progress' && req.method === 'GET') return json(res, 200, await progress.read());
        if (pathname === '/api/progress' && req.method === 'PUT') {
          const body = await readBody(req);
          return json(res, 200, await progress.save(body.payload, body.revision));
        }
        if (pathname === '/api/go/chat/completions' && req.method === 'POST') {
          return await forwardGo(req, res, await readBody(req), upstreamFetch, getGoKey);
        }
        return json(res, 404, { error: '接口不存在' });
      }

      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: '不支持的方法' });
      const relative = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
      if (relative.split('/').some(part => part.startsWith('.')) || /^(progress|conversations|tools)\//.test(relative)) {
        return json(res, 403, { error: '该文件不对网页公开' });
      }
      const path = await realpath(resolve(root, relative));
      const realRoot = await realpath(root);
      if (!path.startsWith(realRoot + sep)) return json(res, 403, { error: '路径无效' });
      const parts = path.slice(realRoot.length + 1).split(sep);
      if (parts.some(part => part.startsWith('.')) || ['progress', 'conversations', 'tools'].includes(parts[0])) {
        return json(res, 403, { error: '该文件不对网页公开' });
      }
      const data = await readFile(path);
      res.writeHead(200, {
        'Content-Type': MIME[extname(path)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      if (res.headersSent) res.destroy(error);
      else json(res, error.status || (error.code === 'ENOENT' ? 404 : 400), { error: error.message });
    }
  });
}
