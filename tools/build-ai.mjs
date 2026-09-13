import { build } from 'esbuild';
await build({
  stdin: { contents: "export { createProvider } from '@earendil-works/pi-ai'; export { openAICompletionsApi } from '@earendil-works/pi-ai/api/openai-completions.lazy';", resolveDir: process.cwd(), sourcefile: 'pi-ai-entry.js' },
  bundle: true, platform: 'browser', format: 'esm', target: 'es2022', minify: true,
  outfile: 'vendor/pi-ai.js', legalComments: 'linked',
});
