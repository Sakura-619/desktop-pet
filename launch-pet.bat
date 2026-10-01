@echo off
title Screen Pet: Cat Adventure
cd /d "%~dp0"
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
