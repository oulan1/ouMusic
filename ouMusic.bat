@echo off
setlocal enabledelayedexpansion
title ouMusic - 1-Click Launch and Sync
color 0B

echo ==============================================================================
echo                         ouMusic - 1-Click Master
echo ==============================================================================
echo.

set "PY_CMD="
where python >nul 2>&1 && set "PY_CMD=python"
if not defined PY_CMD (
    where py >nul 2>&1 && set "PY_CMD=py -3"
)

if not defined PY_CMD (
    echo [ERROR] Python not found in system PATH!
    echo Please install Python 3 or add it to PATH.
    pause
    exit /b 1
)

echo [1/3] Indexing tracks (*.oump3) and playlists (*.oulist)...
%PY_CMD% "%~dp0index_tracks.py"
if !ERRORLEVEL! NEQ 0 (
    echo [ERROR] Indexing failed!
    pause
    exit /b !ERRORLEVEL!
)

echo.
echo [2/3] Syncing with GitHub (rebase + push)...
cd /d "%~dp0"
git add -A tracks playlists assets artists.txt index.html css js sw.js manifest.json index_tracks.py ouMusic.bat index_tracks.bat start_server.bat sync_to_github.bat publish.bat .github .nojekyll

git pull --rebase origin main >nul 2>&1

git diff --staged --quiet
if !ERRORLEVEL! NEQ 0 (
    echo [INFO] Committing changes...
    git commit -m "sync: 1-click auto update tracks and community playlists"
    echo [INFO] Pushing updates to GitHub Pages...
    git push origin main
    if !ERRORLEVEL! EQU 0 (
        echo [SUCCESS] Updates published to GitHub!
        echo URL: https://oulan1.github.io/ouMusic/
    ) else (
        echo [WARNING] Git push failed. Please check your internet or git credentials.
    )
) else (
    echo [INFO] No new changes to commit, catalog is up to date.
)

echo.
echo [3/3] Starting local web server on http://localhost:8080 ...
echo The browser will open automatically.
echo To stop server, close this window or press Ctrl+C.
echo.

start http://localhost:8080

%PY_CMD% -m http.server 8080 --directory "%~dp0."
if !ERRORLEVEL! NEQ 0 (
    npx serve -l 8080 "%~dp0."
)
pause
