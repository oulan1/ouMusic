@echo off
chcp 65001 >nul
title ouMusic Local Web Server
echo ===================================================
echo           ouMusic Local Server (M-Core)
echo ===================================================
echo.
echo Запуск локального сервера на http://localhost:8080 ...
echo Браузер откроется автоматически.
echo Чтобы остановить сервер, закройте это окно (или Ctrl+C).
echo.

start http://localhost:8080

python -m http.server 8080
if %ERRORLEVEL% NEQ 0 (
    npx serve -l 8080 .
)
pause
