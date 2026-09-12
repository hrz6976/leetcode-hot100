import { fileURLToPath } from 'node:url';
import { createLocalServer } from './local-server.mjs';
const port = Number(process.argv[2]) || 8931;
createLocalServer(fileURLToPath(new URL('..', import.meta.url))).listen(port, '127.0.0.1', () => {
  console.log(`Hot 100：http://127.0.0.1:${port}（进度自动保存到 progress/learning.json）`);
});
