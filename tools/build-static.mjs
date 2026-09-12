import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('..', import.meta.url));
const out = path.join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
// 白名单：绝不发布进度、凭据、Git 元数据和开发工具。
for (const entry of ['index.html', 'css', 'js', 'knowledge', 'problems', 'vendor', 'LICENSE', 'THIRD-PARTY-NOTICES.md']) {
  await cp(path.join(root, entry), path.join(out, entry), {
    recursive: true,
    filter: source => !source.endsWith('.test.mjs') && !source.endsWith('.DS_Store'),
  });
}
await writeFile(path.join(out, 'js/runtime-mode.js'), 'export const STATIC_SITE = true;\nexport const CLOUD_PROXY = true;\n');
await writeFile(path.join(out, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
console.log('纯静态网站已生成到 dist/（不包含学习进度和凭据）');
