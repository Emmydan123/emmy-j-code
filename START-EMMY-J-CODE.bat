@echo off
cd /d "%~dp0"
echo ========================================
echo        EMMY J CODE - LOCAL START
 echo ========================================
where node >nul 2>nul || (echo Node.js is not installed. Install Node.js first.&pause&exit /b 1)
if not exist node_modules (echo Installing dependencies...&call npm install)
echo Setting up/checking MySQL database...
call npm run setup-db
if errorlevel 1 (pause&exit /b 1)
echo Starting Emmy J Code...
start "Emmy J Code" cmd /k "npm start"
timeout /t 3 /nobreak >nul
start "" http://localhost:3000
