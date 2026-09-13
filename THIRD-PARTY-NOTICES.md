# 第三方组件声明（Third-Party Notices）

本项目自有代码采用 [MIT License](LICENSE)。`vendor/` 目录包含以下第三方组件的构建产物，版权归各自所有者所有，并按其各自许可证再分发。

## Monaco Editor（`vendor/monaco/`）

- 版权所有：Microsoft Corporation
- 许可证：MIT License
- 来源：https://github.com/microsoft/monaco-editor
- 许可证全文：https://github.com/microsoft/vscode/blob/main/LICENSE.txt

MIT 许可要求保留版权与许可声明，相关头部注释已保留在分发文件内。

## Pyodide（`vendor/pyodide/`）

- 版权所有：Pyodide contributors and Mozilla
- 许可证：Mozilla Public License 2.0（MPL-2.0）
- 来源：https://github.com/pyodide/pyodide
- 许可证全文：https://www.mozilla.org/MPL/2.0/

Pyodide 运行时内含 CPython 解释器（Python Software Foundation License）及标准库，
其版权归 Python Software Foundation 所有：https://www.python.org/psf/license/

## AI connector

`vendor/pi-ai.js` is built from `@earendil-works/pi-ai` 0.84.2 (MIT, see `vendor/pi-ai-LICENSE`) and its OpenAI SDK dependency (Apache-2.0, see `vendor/openai-LICENSE`). Source: https://github.com/earendil-works/pi and https://github.com/openai/openai-node . Rebuild with `npm ci && npm run build:ai`.

The connector bundle also includes `partial-json` (MIT, see `vendor/partial-json-LICENSE`).
