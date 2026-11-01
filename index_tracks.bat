@echo off
chcp 65001 >nul
title ouMusic Tracks Auto-Indexer
echo Индексация треков в папке tracks...
python index_tracks.py
echo.
echo Готово! Каталог tracks/catalog.json и catalog.js обновлен.
pause
