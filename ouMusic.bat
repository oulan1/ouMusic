@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title ouMusic — 1-Click Launch & Sync
color 0B

echo ==============================================================================
echo                         ouMusic — 1-Click Master
echo ==============================================================================
echo.
echo [1/3] Индексация треков из папки tracks/*.oump3...
python "%~dp0index_tracks.py"
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Не удалось выполнить индексацию треков через Python!
    echo Убедитесь, что Python установлен и доступен в системе.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Синхронизация с GitHub (автоматическая публикация)...
git add -A "%~dp0tracks" "%~dp0artists.txt" "%~dp0index.html" "%~dp0css" "%~dp0js" "%~dp0sw.js" "%~dp0manifest.json" "%~dp0index_tracks.py" "%~dp0ouMusic.bat" "%~dp0index_tracks.bat" "%~dp0start_server.bat" "%~dp0sync_to_github.bat" "%~dp0publish.bat" "%~dp0.github" "%~dp0.nojekyll"

git diff --staged --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Обнаружены изменения в треках/каталоге. Создаем коммит...
    git commit -m "sync: 1-click auto update tracks & catalog"
    echo [INFO] Отправляем обновления на GitHub Pages...
    git push origin main
    if %ERRORLEVEL% EQU 0 (
        echo [УСПЕХ] Обновления отправлены на GitHub! Сайт обновится через 1-2 минуты.
        echo URL: https://oulan1.github.io/ouMusic/
    ) else (
        echo [ПРЕДУПРЕЖДЕНИЕ] Не удалось отправить на GitHub (проверьте интернет-соединение).
    )
) else (
    echo [INFO] Изменений в каталоге нет, всё актуально.
)

echo.
echo [3/3] Запуск локального веб-сервера на http://localhost:8080 ...
echo Браузер откроется автоматически через секунду.
echo Чтобы остановить сервер, закройте это окно или нажмите Ctrl+C.
echo.

start http://localhost:8080

python -m http.server 8080 --directory "%~dp0."
if %ERRORLEVEL% NEQ 0 (
    npx serve -l 8080 "%~dp0."
)
pause
