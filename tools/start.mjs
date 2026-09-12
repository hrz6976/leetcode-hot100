import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createLocalServer } from './local-server.mjs';
if (Number(process.versions.node.split('.')[0]) < 18) {
  console.error('请升级到 Node.js 18 或更高版本。');
  process.exit(1);
}
const root = fileURLToPath(new URL('..', import.meta.url));
let server;
let port;
for (port = 8931; port <= 8951; port++) {
  server = createLocalServer(root);
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    });
    break;
  } catch (error) {
    if (error.code !== 'EADDRINUSE') throw error;
  }
}
if (port > 8951) throw new Error('8931–8951 端口均被占用，请关闭之前的启动窗口。');
const url = `http://127.0.0.1:${port}`;
console.log(`Hot 100 已启动：${url}`);
console.log('进度自动保存到 progress/learning.json；按 Ctrl+C 停止。');
// 保留旧 Kimi Coding 代理。若已有代理占用该端口，新进程会自行退出。
const proxy = spawn(process.execPath, [fileURLToPath(new URL('./cors-proxy.mjs', import.meta.url))], { stdio: 'ignore' });
const stop = () => {
  proxy.kill();
  server.close(() => process.exit(0));
  server.closeIdleConnections();
  setTimeout(() => process.exit(1), 5000).unref();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', () => proxy.kill());
if (!process.argv.includes('--no-open')) {
  const command = process.platform === 'darwin' ? ['open', url]
    : process.platform === 'win32' ? ['cmd', '/c', 'start', '', url] : ['xdg-open', url];
  const opener = spawn(command[0], command.slice(1), { stdio: 'ignore' });
  opener.on('error', () => console.log(`请在浏览器打开 ${url}`));
  opener.unref();
}
