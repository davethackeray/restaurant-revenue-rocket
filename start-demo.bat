@echo off
setlocal enabledelayedexpansion

:: Restaurant Revenue Rocket - Demo Start Script
:: This script starts all services required for client demonstrations

echo.
echo ========================================
echo Restaurant Revenue Rocket
echo Starting Demonstration Environment
echo ========================================
echo.

:: Set script directory and change to it
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Check if .env file exists
if not exist ".env" (
    echo ERROR: Environment file (.env) not found.
    echo Please run setup-windows.bat first or copy .env.example to .env
    echo.
    pause
    exit /b 1
)

:: Load environment variables
for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
    set "%%a=%%b"
)

echo [1/6] Checking system status...
echo.

:: Check if Docker is running
docker info >nul 2>&1
if !errorlevel! neq 0 (
    echo Docker is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo Waiting for Docker to start...
    :docker_wait
    timeout /t 5 /nobreak >nul
    echo Checking Docker status...
    docker info >nul 2>&1
    if !errorlevel! neq 0 goto docker_wait
    
    echo Docker is now running.
    echo.
)

:: Check available ports
echo Checking port availability...
netstat -an | find ":3000 " >nul 2>&1
if !errorlevel! equ 0 (
    echo WARNING: Port 3000 is already in use.
    set /p KILL_PROC="Kill process using port 3000? (y/N): "
    if /i "!KILL_PROC!"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000 "') do (
            taskkill /PID %%a /F >nul 2>&1
        )
        echo Process killed.
    )
)

netstat -an | find ":5000 " >nul 2>&1
if !errorlevel! equ 0 (
    echo WARNING: Port 5000 is already in use.
    set /p KILL_PROC="Kill process using port 5000? (y/N): "
    if /i "!KILL_PROC!"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| find ":5000 "') do (
            taskkill /PID %%a /F >nul 2>&1
        )
        echo Process killed.
    )
)

echo [2/6] Starting Docker services...
echo.

:: Start Docker containers
echo Starting PostgreSQL and Redis containers...
docker-compose -f docker-compose.local.yml up -d postgres redis
if !errorlevel! neq 0 (
    echo ERROR: Failed to start Docker services.
    echo Please check Docker Desktop is running and try again.
    pause
    exit /b 1
)

:: Wait for services to be ready
echo Waiting for services to initialise...
timeout /t 10 /nobreak >nul

echo [3/6] Verifying database connectivity...
echo.

:: Check PostgreSQL readiness
set DB_READY=0
set DB_ATTEMPTS=0
:db_check
set /a DB_ATTEMPTS+=1
if %DB_ATTEMPTS% gtr 30 (
    echo ERROR: Database failed to start after 30 attempts.
    echo Please check Docker logs: docker logs rrr-postgres
    pause
    exit /b 1
)

docker exec rrr-postgres pg_isready -U demo_user -d restaurant_rocket >nul 2>&1
if !errorlevel! equ 0 (
    set DB_READY=1
    echo ✓ PostgreSQL is ready
) else (
    echo Waiting for PostgreSQL... (Attempt %DB_ATTEMPTS%/30)
    timeout /t 2 /nobreak >nul
    goto db_check
)

:: Check Redis readiness
docker exec rrr-redis redis-cli ping >nul 2>&1
if !errorlevel! equ 0 (
    echo ✓ Redis is ready
) else (
    echo WARNING: Redis connection failed
    echo Continuing with reduced functionality...
)

echo [4/6] Checking demo data...
echo.

:: Verify demo data exists
docker exec rrr-postgres psql -U demo_user -d restaurant_rocket -c "SELECT COUNT(*) FROM scenarios;" >nul 2>&1
if !errorlevel! neq 0 (
    echo Demo data not found. Initialising database...
    if exist "backend\package.json" (
        cd backend
        call npm run db:migrate
        call npm run db:seed
        cd ..
    ) else (
        echo WARNING: Backend not found. Demo data may be incomplete.
    )
) else (
    echo ✓ Demo data verified
)

echo [5/6] Starting application services...
echo.

:: Start backend service
if exist "backend\package.json" (
    echo Starting backend service...
    cd backend
    start "Restaurant Revenue Rocket - Backend" cmd /k "npm run start"
    cd ..
    
    :: Wait for backend to start
    echo Waiting for backend to start...
    :backend_wait
    timeout /t 2 /nobreak >nul
    curl -s http://localhost:5000/health >nul 2>&1
    if !errorlevel! neq 0 goto backend_wait
    
    echo ✓ Backend service started
) else (
    echo WARNING: Backend directory not found
)

:: Start frontend service
if exist "frontend\package.json" (
    echo Starting frontend service...
    cd frontend
    start "Restaurant Revenue Rocket - Frontend" cmd /k "npm run preview"
    cd ..
    
    :: Wait for frontend to start
    echo Waiting for frontend to start...
    timeout /t 5 /nobreak >nul
    
    echo ✓ Frontend service started
) else (
    echo WARNING: Frontend directory not found
)

echo [6/6] Final verification and launch...
echo.

:: Wait for services to be fully ready
echo Performing final service checks...
timeout /t 5 /nobreak >nul

:: Check backend health
curl -s http://localhost:5000/health >nul 2>&1
if !errorlevel! equ 0 (
    echo ✓ Backend health check passed
) else (
    echo ⚠ Backend health check failed (service may still be starting)
)

:: Check frontend availability
curl -s http://localhost:3000 >nul 2>&1
if !errorlevel! equ 0 (
    echo ✓ Frontend service available
) else (
    echo ⚠ Frontend service check failed (service may still be starting)
)

:: Display service status
echo.
echo ========================================
echo Service Status
echo ========================================
echo.
docker-compose -f docker-compose.local.yml ps

echo.
echo ========================================
echo Demo Environment Ready!
echo ========================================
echo.
echo Application URLs:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo   Health:   http://localhost:5000/health
echo.
echo Database Administration (optional):
echo   Start: docker-compose -f docker-compose.local.yml --profile admin up -d pgadmin
echo   URL:   http://localhost:8080
echo   User:  admin@restaurantrevenuerocket.com
echo   Pass:  admin123
echo.
echo Demo Commands:
echo   Reset demo:     npm run demo:reset
echo   Load profile:   npm run demo:load-profile [profile-name]
echo   Export session: npm run demo:export-session
echo.
echo Available demo profiles:
echo   - quick-service     (Fast food and QSR)
echo   - fine-dining       (Upscale restaurants)
echo   - fast-casual       (Fast-casual chains)
echo   - multi-location    (Large restaurant groups)
echo.

:: Check if Gemini API key is configured
if "%GEMINI_API_KEY%"=="your_gemini_api_key_here" (
    echo WARNING: Gemini API key not configured!
    echo AI assistant will run in offline mode only.
    echo Edit .env file to add your API key for full functionality.
    echo.
)

:: Open browser automatically
set /p OPEN_BROWSER="Open application in browser? (Y/n): "
if /i not "!OPEN_BROWSER!"=="n" (
    echo Opening browser...
    timeout /t 2 /nobreak >nul
    start http://localhost:3000
)

echo.
echo Restaurant Revenue Rocket is now running!
echo.
echo To stop the demonstration:
echo   - Close this window and run 'stop-demo.bat'
echo   - Or press Ctrl+C to stop services manually
echo.
echo For troubleshooting, check the service windows or run:
echo   docker-compose -f docker-compose.local.yml logs
echo.

:: Keep the script running to show status
:keep_running
timeout /t 30 /nobreak >nul
echo [%time%] Services running... (Press Ctrl+C to stop)
goto keep_running
