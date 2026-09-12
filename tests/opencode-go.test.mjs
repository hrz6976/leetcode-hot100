import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readOpenCodeGoKey } from '../tools/opencode-go.mjs';
test('仅选择 Go API 凭据，缺失或损坏时允许手动配置', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'hot100-go-auth-'));
  t.after(() => rm(dir, { recursive:true, force:true }));
  const path = join(dir, 'auth.json');
  assert.equal(await readOpenCodeGoKey(path), null);
  await writeFile(path, JSON.stringify({ opencode:{type:'api',key:'another-provider'}, 'opencode-go':{type:'api',key:'go-test'} }));
  assert.equal(await readOpenCodeGoKey(path), 'go-test');
  await writeFile(path, JSON.stringify({ opencode:{type:'api',key:'another-provider'} }));
  assert.equal(await readOpenCodeGoKey(path), null);
  await writeFile(path, '{bad');
  assert.equal(await readOpenCodeGoKey(path), null);
});
