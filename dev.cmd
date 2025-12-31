@echo on
setlocal
cd /d %~dp0

echo ==== TKFM DEV BOOT ====
echo Repo root: %CD%
echo.

echo Killing ports 5173 and 8888 if stuck...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8888 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>nul

echo.
echo Starting Netlify Dev (8888 -> Vite 5173)...
echo.

call npx netlify dev --port 8888 --debug

echo.
echo ==== Netlify Dev EXITED (ERRORLEVEL=%ERRORLEVEL%) ====
pause
