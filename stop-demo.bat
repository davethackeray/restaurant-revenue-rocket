@echo off
setlocal enabledelayedexpansion

:: Restaurant Revenue Rocket - Demo Stop Script
:: This script safely stops all services and cleans up resources

echo.
echo ========================================
echo Restaurant Revenue Rocket
echo Stopping Demonstration Environment
echo ========================================
echo.

:: Set script directory and change to it
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [1/5] Stopping application services...
echo.

:: Stop Node.js processes (frontend and backend)
echo Stopping Node.js services...
tasklist /FI "IMAGENAME eq node.exe" /FO CSV | find "node.exe" >nul 2>&1
if !errorlevel! equ 0 (
    echo Found Node.js processes. Stopping...
    
    :: Get Node.js processes using our ports
    for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000 "') do (
        taskkill /PID %%a /F >nul 2>&1
        if !errorlevel! equ 0 echo ✓ Stopped process on port 3000
    )
    
    for /f "tokens=5" %%a in ('netstat -ano ^| find ":5000 "') do (
        taskkill /PID %%a /F >nul 2>&1
        if !errorlevel! equ 0 echo ✓ Stopped process on port 5000
    )
    
    :: Stop any remaining node processes with our application name
    wmic process where "name='node.exe' and commandline like '%%restaurant-revenue-rocket%%'" delete >nul 2>&1
    
) else (
    echo No Node.js processes found running.
)

:: Close command windows
echo Closing service windows...
for /f "tokens=2" %%a in ('tasklist /FI "WINDOWTITLE eq Restaurant Revenue Rocket*" /FO CSV ^| find "cmd.exe"') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo [2/5] Stopping Docker containers...
echo.

:: Check if Docker is running
docker info >nul 2>&1
if !errorlevel! neq 0 (
    echo Docker is not running. Skipping container cleanup.
    goto skip_docker
)

:: Stop Docker Compose services
echo Stopping Docker Compose services...
docker-compose -f docker-compose.local.yml down
if !errorlevel! equ 0 (
    echo ✓ Docker services stopped successfully
) else (
    echo ⚠ Some Docker services may not have stopped cleanly
)

:: Stop individual containers if they're still running
echo Checking for remaining containers...
docker ps -q --filter "name=rrr-" >nul 2>&1
if !errorlevel! equ 0 (
    echo Stopping individual containers...
    docker stop rrr-postgres rrr-redis rrr-app rrr-nginx rrr-pgadmin rrr-redis-commander >nul 2>&1
    echo ✓ Individual containers stopped
)

:skip_docker

echo [3/5] Checking port availability...
echo.

:: Verify ports are free
set PORTS_CLEAR=1

netstat -an | find ":3000 " >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚠ Port 3000 still in use
    set PORTS_CLEAR=0
) else (
    echo ✓ Port 3000 available
)

netstat -an | find ":5000 " >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚠ Port 5000 still in use
    set PORTS_CLEAR=0
) else (
    echo ✓ Port 5000 available
)

netstat -an | find ":5432 " >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚠ Port 5432 (PostgreSQL) still in use
    set PORTS_CLEAR=0
) else (
    echo ✓ Port 5432 available
)

netstat -an | find ":6379 " >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚠ Port 6379 (Redis) still in use
    set PORTS_CLEAR=0
) else (
    echo ✓ Port 6379 available
)

if %PORTS_CLEAR% equ 0 (
    echo.
    echo Some ports are still in use. You may need to:
    echo 1. Close any remaining application windows
    echo 2. Restart your computer if processes are stuck
    echo 3. Check Windows Task Manager for remaining processes
)

echo [4/5] Cleaning up temporary files...
echo.

:: Clean temporary files
if exist "data\temp\*" (
    echo Cleaning temporary files...
    del /q "data\temp\*" >nul 2>&1
    echo ✓ Temporary files cleaned
)

:: Clean log files (keep last 5)
if exist "docker\volumes\logs\*.log" (
    echo Cleaning old log files...
    forfiles /p "docker\volumes\logs" /m "*.log" /d -7 /c "cmd /c del @path" >nul 2>&1
    echo ✓ Old log files cleaned
)

:: Optional: Clean Docker volumes
set /p CLEAN_DATA="Clean all demo data and reset to fresh state? (y/N): "
if /i "!CLEAN_DATA!"=="y" (
    echo Cleaning Docker volumes...
    docker-compose -f docker-compose.local.yml down -v >nul 2>&1
    if exist "docker\volumes\postgres-data" rmdir /s /q "docker\volumes\postgres-data" >nul 2>&1
    if exist "docker\volumes\redis-data" rmdir /s /q "docker\volumes\redis-data" >nul 2>&1
    if exist "data\exports\session-reports\*" del /q "data\exports\session-reports\*" >nul 2>&1
    echo ✓ Demo data cleaned (fresh setup required for next start)
)

echo [5/5] Final cleanup and verification...
echo.

:: Check for any remaining processes
echo Checking for remaining processes...
tasklist /FI "IMAGENAME eq node.exe" | find "restaurant-revenue-rocket" >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚠ Some application processes may still be running
) else (
    echo ✓ No application processes running
)

:: Docker containers check
docker ps -q --filter "name=rrr-" >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚠ Some Docker containers may still be running
    echo Run: docker ps
) else (
    echo ✓ No Docker containers running
)

echo.
echo ========================================
echo Shutdown Complete
echo ========================================
echo.
echo Restaurant Revenue Rocket has been stopped.
echo.
echo Service Status:
echo   Application:  Stopped
echo   Database:     Stopped  
echo   Cache:        Stopped
echo   Docker:       Containers stopped
echo.
echo To start again:
echo   run 'start-demo.bat'
echo.
echo For complete cleanup including data:
echo   run 'stop-demo.bat' and choose 'y' when prompted
echo.

:: Display final system status
echo Current port usage:
netstat -an | find ":3000 " >nul 2>&1 && echo   Port 3000: In use || echo   Port 3000: Available
netstat -an | find ":5000 " >nul 2>&1 && echo   Port 5000: In use || echo   Port 5000: Available
netstat -an | find ":5432 " >nul 2>&1 && echo   Port 5432: In use || echo   Port 5432: Available
netstat -an | find ":6379 " >nul 2>&1 && echo   Port 6379: In use || echo   Port 6379: Available

echo.
echo If you experience issues with the next startup:
echo 1. Restart your computer
echo 2. Ensure Docker Desktop is running
echo 3. Run setup-windows.bat again if needed
echo.

pause
