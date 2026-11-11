@echo off
setlocal enabledelayedexpansion
title ouMusic - Index Tracks and Sync
color 0A

echo ==============================================================================
echo                   ouMusic - Index Tracks and Sync
echo ==============================================================================
echo.

set "PY_CMD="
where python >nul 2>&1 && set "PY_CMD=python"
if not defined PY_CMD (
    where py >nul 2>&1 && set "PY_CMD=py -3"
)

if not defined PY_CMD (
    echo [ERROR] Python not found in system PATH!
    pause
    exit /b 1
)

echo [1/2] Indexing tracks (*.oump3) and playlists (*.oulist)...
%PY_CMD% "%~dp0index_tracks.py"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Indexing failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Syncing to GitHub...
cd /d "%~dp0"
git add -A tracks playlists assets artists.txt index.html css js sw.js manifest.json index_tracks.py ouMusic.bat index_tracks.bat start_server.bat sync_to_github.bat publish.bat .github .nojekyll

git pull --rebase origin main >nul 2>&1

git diff --staged --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Committing indexed catalog...
    git commit -m "sync: index tracks and community playlists"
    echo [INFO] Pushing to GitHub Pages...
    git push origin main
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] Catalog synced and published to GitHub!
    ) else (
        echo [WARNING] Git push failed. Please check internet connection.
    )
) else (
    echo [INFO] Catalog is already fully up to date.
)

echo.
echo [DONE] Finished!
pause
