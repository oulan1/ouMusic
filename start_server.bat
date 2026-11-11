@echo off
setlocal enabledelayedexpansion
title ouMusic - Local Server
color 0E

set "PY_CMD="
where python >nul 2>&1 && set "PY_CMD=python"
if not defined PY_CMD (
    where py >nul 2>&1 && set "PY_CMD=py -3"
)

echo ==============================================================================
echo                       ouMusic - Local Server
echo ==============================================================================
echo Starting server on http://localhost:8080 ...
start http://localhost:8080

if defined PY_CMD (
    %PY_CMD% -m http.server 8080 --directory "%~dp0."
) else (
    npx serve -l 8080 "%~dp0."
)
pause
