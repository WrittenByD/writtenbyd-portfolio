@echo off
setlocal
cd /d "%~dp0"

echo.
echo WrittenByD Audio Stem Tool - Windows Setup
echo ==========================================
echo.

where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found.
  echo Install Python 3.11 from https://www.python.org/downloads/ and run this file again.
  pause
  exit /b 1
)

where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo FFmpeg was not found in PATH.
  echo Install FFmpeg, add it to PATH, then run this file again.
  echo.
  echo One Windows option:
  echo   winget install --id Gyan.FFmpeg -e
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo Creating Python environment...
  python -m venv .venv
  if errorlevel 1 goto :error
)

echo Installing Python packages...
".venv\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 goto :error
".venv\Scripts\python.exe" -m pip install gradio -r requirements.txt
if errorlevel 1 goto :error

echo.
echo Setup complete.
echo Run run_windows.bat to start the app.
pause
exit /b 0

:error
echo.
echo Setup failed. Review the error above.
pause
exit /b 1
