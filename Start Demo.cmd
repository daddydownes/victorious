@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to open this demo. It is already installed on the development computer.
  pause
  exit /b 1
)
node tools\serve-demo.cjs --open
if errorlevel 1 pause
