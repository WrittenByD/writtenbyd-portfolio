@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo The app has not been set up yet.
  echo Run setup_windows.bat first.
  pause
  exit /b 1
)

".venv\Scripts\python.exe" app.py
pause
