import { mkdir, open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { validateBackup } from '../js/store.js';

const revisionOf = raw => createHash('sha256').update(raw).digest('hex');
function conflict(status, message) {
  return Object.assign(new Error(message), { status });
}

export function createProgressFile(directory) {
  const file = resolve(directory, 'learning.json');
  const lockPath = resolve(directory, '.write-lock');
  let queue = Promise.resolve();

  async function read() {
    try {
      const raw = await readFile(file, 'utf8');
      const payload = JSON.parse(raw);
      validateBackup(payload);
      return { revision: revisionOf(raw), payload };
    } catch (error) {
      if (error.code === 'ENOENT') return { revision: null, payload: null };
      throw error;
    }
  }

  async function write(payload, revision) {
    await mkdir(directory, { recursive: true });
    let lock;
    try {
      // 跨进程互斥：不同端口启动的服务也不能同时通过版本检查。
      lock = await open(lockPath, 'wx', 0o600);
    } catch (error) {
      if (error.code === 'EEXIST') {
        throw conflict(423, '另一个本地服务正在保存，请稍后重试；若服务异常退出，关闭所有启动窗口后删除 progress/.write-lock。');
      }
      throw error;
    }
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      const current = await read();
      if (revision !== current.revision) {
        throw conflict(409, '进度文件已被其他页面或 Git 更新。请先导出浏览器备份，再刷新并选择要保留的数据。');
      }
      const serialized = JSON.stringify(payload, null, 2) + '\n';
      await writeFile(temporary, serialized, { mode: 0o600 });
      await rename(temporary, file);
      return { revision: revisionOf(serialized) };
    } finally {
      try {
        await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
      } finally {
        try { await lock.close(); } finally { await unlink(lockPath); }
      }
    }
  }

  function save(payload, revision) {
    validateBackup(payload);
    // 同一个服务内先排队，再执行读取、比较和替换。
    const operation = queue.then(() => write(payload, revision));
    queue = operation.catch(() => {});
    return operation;
  }

  return { read, save };
}
