@echo off
REM Optional: serves the site at http://localhost:8000 (double-clicking index.html also works)
cd /d "%~dp0"
start "" http://localhost:8000
python -m http.server 8000
