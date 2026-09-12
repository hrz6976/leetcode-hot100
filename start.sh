#!/bin/bash
cd "$(dirname "$0")" || exit 1
if command -v node >/dev/null 2>&1; then
  exec node tools/start.mjs "$@"
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "请安装 Node.js 18 或更高版本后重试：https://nodejs.org"
  exit 1
fi
echo "当前仅保存到浏览器。安装 Node.js 18+ 可启用本地进度文件和 OpenCode Go。"
PORT=8931
while lsof -nP -i :"$PORT" >/dev/null 2>&1; do
  PORT=$((PORT + 1))
  if [ "$PORT" -gt 8951 ]; then echo "启动端口已被占用。"; exit 1; fi
done
URL="http://127.0.0.1:$PORT"
( sleep 1
  if command -v open >/dev/null 2>&1; then open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"
  fi ) &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
