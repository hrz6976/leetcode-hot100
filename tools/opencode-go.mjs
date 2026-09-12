import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

// 只读取 OpenCode Go 这一项。凭据留在服务端，不写入项目或返回浏览器。
export async function readOpenCodeGoKey(authFile = resolve(homedir(), '.local/share/opencode/auth.json')) {
  try {
    const auth = JSON.parse(await readFile(authFile, 'utf8'));
    const credential = auth['opencode-go'];
    return credential?.type === 'api' && typeof credential.key === 'string' && credential.key.trim()
      ? credential.key.trim() : null;
  } catch {
    return null;
  }
}
