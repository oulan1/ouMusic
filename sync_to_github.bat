@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title ouMusic Sync and Publish

echo ==============================================================================
echo                      ouMusic -- GitHub Sync and Publish
echo ==============================================================================
echo.
echo [1/4] Indexing tracks directory (tracks/*.oump3)...
python index_tracks.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo OSHIBKA: Python index_tracks.py failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/4] Staging files for Git...
git add -A tracks/ artists.txt index.html css/ js/ sw.js manifest.json index_tracks.py index_tracks.bat start_server.bat sync_to_github.bat publish.bat

git diff --staged --quiet
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [INFO] No changes detected. Catalog is already up to date!
    echo.
    pause
    exit /b 0
)

echo.
echo [3/4] Creating commit...
git commit -m "sync: update tracks and artists catalog [auto]"

echo.
echo [4/4] Pushing to GitHub (origin main)...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo OSHIBKA: Failed to push to GitHub. Check internet connection.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==============================================================================
echo [SUCCESS] Tracks and artists successfully published to GitHub!
echo GitHub Pages will update within 1-2 minutes:
echo https://oulan1.github.io/ouMusic/
echo ==============================================================================
echo.
pause
