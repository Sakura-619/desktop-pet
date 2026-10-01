@echo off
title Desktop Screen Pet
cd /d "%~dp0"
start "" ".\node_modules\electron\dist\electron.exe" "main.js"
