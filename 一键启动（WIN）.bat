@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 goto NODE

echo 当前仅保存到浏览器。安装 Node.js 18+ 可启用本地进度文件和 OpenCode Go。
where python >nul 2>nul
if %errorlevel%==0 goto PYTHON
where py >nul 2>nul
if %errorlevel%==0 goto PYLAUNCHER
echo 请安装 Node.js：https://nodejs.org
pause
exit /b 1

:NODE
node tools\start.mjs
if errorlevel 1 pause
exit /b

:PYTHON
start "" http://127.0.0.1:8931/
python -m http.server 8931 --bind 127.0.0.1
goto END

:PYLAUNCHER
start "" http://127.0.0.1:8931/
py -m http.server 8931 --bind 127.0.0.1

:END
pause
