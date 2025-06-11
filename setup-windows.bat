@echo off
setlocal enabledelayedexpansion

:: Restaurant Revenue Rocket - Windows Setup Script
:: This script sets up the complete development environment on Windows

echo.
echo ========================================
echo Restaurant Revenue Rocket Setup
echo ========================================
echo.
echo Setting up your local development environment...
echo.

:: Check if running as administrator
net session >nul 2>&1
if !errorlevel! neq 0 (
    echo WARNING: Running without administrator privileges.
    echo Some features may require elevated permissions.
    echo.
)

:: Set script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [1/10] Checking system requirements...
echo.

:: Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo Windows Version: %VERSION%
if %VERSION% lss 10.0 (
    echo ERROR: Windows 10 or higher required
    pause
    exit /b 1
)

:: Check available memory
for /f "skip=1" %%p in ('wmic os get TotalVisibleMemorySize') do (
    if not "%%p"=="" (
        set /a TOTAL_MEM=%%p/1024
        goto :mem_done
    )
)
:mem_done
echo Total Memory: %TOTAL_MEM% MB
if %TOTAL_MEM% lss 8192 (
    echo WARNING: Less than 8GB RAM detected. Performance may be affected.
    echo.
)

:: Check disk space
for /f "tokens=3" %%a in ('dir /-c "%SCRIPT_DIR%" ^| find "bytes free"') do set FREE_SPACE=%%a
set FREE_SPACE=%FREE_SPACE:,=%
set /a FREE_GB=%FREE_SPACE%/1073741824
echo Free Disk Space: %FREE_GB% GB
if %FREE_GB% lss 10 (
    echo ERROR: Insufficient disk space. At least 10GB required.
    pause
    exit /b 1
)

echo [2/10] Checking Node.js installation...
echo.

:: Check Node.js
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo Node.js not found. Please install Node.js 20.0.0 or higher.
    echo Download from: https://nodejs.org/
    echo.
    set /p CONTINUE="Continue setup without Node.js? (y/N): "
    if /i not "!CONTINUE!"=="y" (
        echo Setup cancelled.
        pause
        exit /b 1
    )
) else (
    for /f %%i in ('node --version') do set NODE_VERSION=%%i
    echo Node.js Version: %NODE_VERSION%
    
    :: Verify Node.js version
    set NODE_MAJOR=%NODE_VERSION:~1,2%
    if %NODE_MAJOR% lss 20 (
        echo WARNING: Node.js version %NODE_VERSION% detected.
        echo Recommended version is 20.0.0 or higher.
        echo.
    )
)

:: Check npm
npm --version >nul 2>&1
if !errorlevel! neq 0 (
    echo npm not found. Please ensure npm is installed with Node.js.
    pause
    exit /b 1
) else (
    for /f %%i in ('npm --version') do set NPM_VERSION=%%i
    echo npm Version: %NPM_VERSION%
)

echo [3/10] Checking Docker Desktop installation...
echo.

:: Check Docker
docker --version >nul 2>&1
if !errorlevel! neq 0 (
    echo Docker not found. Installing Docker Desktop...
    echo.
    
    :: Download and install Docker Desktop
    if not exist "%TEMP%\DockerDesktopInstaller.exe" (
        echo Downloading Docker Desktop...
        powershell -Command "& {Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe' -OutFile '%TEMP%\DockerDesktopInstaller.exe'}"
    )
    
    if exist "%TEMP%\DockerDesktopInstaller.exe" (
        echo Installing Docker Desktop...
        start /wait "%TEMP%\DockerDesktopInstaller.exe" install --quiet
        echo.
        echo Docker Desktop installation completed.
        echo Please start Docker Desktop and return to continue setup.
        echo.
        pause
    ) else (
        echo Failed to download Docker Desktop.
        echo Please manually download and install from: https://docker.com/products/docker-desktop
        echo.
        pause
        exit /b 1
    )
) else (
    for /f %%i in ('docker --version') do set DOCKER_VERSION=%%i
    echo Docker Version: %DOCKER_VERSION%
)

:: Check Docker Compose
docker-compose --version >nul 2>&1
if !errorlevel! neq 0 (
    echo Docker Compose not found. Please ensure Docker Desktop is properly installed.
    pause
    exit /b 1
) else (
    for /f %%i in ('docker-compose --version') do set COMPOSE_VERSION=%%i
    echo Docker Compose Version: %COMPOSE_VERSION%
)

:: Verify Docker is running
docker info >nul 2>&1
if !errorlevel! neq 0 (
    echo Docker Engine is not running. Please start Docker Desktop.
    echo.
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo Waiting for Docker to start...
    :docker_wait
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if !errorlevel! neq 0 goto docker_wait
    
    echo Docker is now running.
)

echo [4/10] Creating directory structure...
echo.

:: Create necessary directories
if not exist "docker\volumes" mkdir "docker\volumes"
if not exist "docker\volumes\postgres-data" mkdir "docker\volumes\postgres-data"
if not exist "docker\volumes\redis-data" mkdir "docker\volumes\redis-data"
if not exist "docker\volumes\pgadmin-data" mkdir "docker\volumes\pgadmin-data"
if not exist "docker\volumes\logs" mkdir "docker\volumes\logs"
if not exist "data\exports" mkdir "data\exports"
if not exist "data\exports\session-reports" mkdir "data\exports\session-reports"
if not exist "data\uploads" mkdir "data\uploads"
if not exist "data\temp" mkdir "data\temp"
if not exist "data\backups" mkdir "data\backups"

echo Directory structure created successfully.

echo [5/10] Setting up environment configuration...
echo.

:: Create .env file from template
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo Environment file created from template.
        echo.
        echo IMPORTANT: Please edit .env file and add your Gemini API key:
        echo   GEMINI_API_KEY=your_api_key_here
        echo.
    ) else (
        echo Creating default .env file...
        (
        echo # Restaurant Revenue Rocket - Local Environment
        echo NODE_ENV=demonstration
        echo PORT=3000
        echo BACKEND_PORT=5000
        echo DATABASE_URL=postgresql://demo_user:demo_pass@localhost:5432/restaurant_rocket
        echo REDIS_URL=redis://localhost:6379
        echo GEMINI_API_KEY=your_gemini_api_key_here
        echo JWT_SECRET=change_this_jwt_secret_in_production
        echo SESSION_SECRET=change_this_session_secret_in_production
        echo LOG_LEVEL=info
        echo DEMO_MODE=true
        echo AI_OFFLINE_MODE=true
        ) > .env
        echo Default .env file created.
    )
)

echo [6/10] Installing application dependencies...
echo.

:: Install root dependencies
echo Installing root dependencies...
call npm install
if !errorlevel! neq 0 (
    echo ERROR: Failed to install root dependencies.
    pause
    exit /b 1
)

:: Install frontend dependencies
if exist "frontend\package.json" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    if !errorlevel! neq 0 (
        echo ERROR: Failed to install frontend dependencies.
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

:: Install backend dependencies
if exist "backend\package.json" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    if !errorlevel! neq 0 (
        echo ERROR: Failed to install backend dependencies.
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

echo Dependencies installed successfully.

echo [7/10] Setting up Docker containers...
echo.

:: Pull required Docker images
echo Pulling Docker images...
docker pull postgres:15-alpine
docker pull redis:7-alpine

:: Start Docker services
echo Starting Docker services...
docker-compose -f docker-compose.local.yml up -d postgres redis
if !errorlevel! neq 0 (
    echo ERROR: Failed to start Docker services.
    pause
    exit /b 1
)

:: Wait for services to be ready
echo Waiting for services to start...
timeout /t 15 /nobreak >nul

:: Check if services are running
docker-compose -f docker-compose.local.yml ps

echo [8/10] Initialising database...
echo.

:: Wait for PostgreSQL to be ready
echo Waiting for PostgreSQL to be ready...
:pg_wait
docker exec rrr-postgres pg_isready -U demo_user -d restaurant_rocket >nul 2>&1
if !errorlevel! neq 0 (
    timeout /t 2 /nobreak >nul
    goto pg_wait
)

echo PostgreSQL is ready.

:: Run database migrations and seed data
if exist "backend\package.json" (
    echo Running database migrations...
    cd backend
    call npm run db:migrate
    if !errorlevel! neq 0 (
        echo WARNING: Database migration failed. You may need to run this manually.
    )
    
    echo Seeding demo data...
    call npm run db:seed
    if !errorlevel! neq 0 (
        echo WARNING: Database seeding failed. You may need to run this manually.
    )
    cd ..
)

echo [9/10] Configuring Windows Firewall...
echo.

:: Configure Windows Firewall rules (if administrator)
net session >nul 2>&1
if !errorlevel! equ 0 (
    echo Adding Windows Firewall rules...
    netsh advfirewall firewall add rule name="Restaurant Revenue Rocket - Frontend" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
    netsh advfirewall firewall add rule name="Restaurant Revenue Rocket - Backend" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
    netsh advfirewall firewall add rule name="Restaurant Revenue Rocket - PostgreSQL" dir=in action=allow protocol=TCP localport=5432 >nul 2>&1
    netsh advfirewall firewall add rule name="Restaurant Revenue Rocket - Redis" dir=in action=allow protocol=TCP localport=6379 >nul 2>&1
    echo Firewall rules added successfully.
) else (
    echo Skipping firewall configuration (requires administrator privileges).
    echo You may need to manually allow applications through Windows Firewall.
)

echo [10/10] Running final verification...
echo.

:: Verify installation
echo Verifying installation...

:: Check Docker containers
set CONTAINER_COUNT=0
for /f %%i in ('docker-compose -f docker-compose.local.yml ps -q') do set /a CONTAINER_COUNT+=1

if %CONTAINER_COUNT% geq 2 (
    echo ✓ Docker containers running
) else (
    echo ✗ Docker containers not running properly
)

:: Check database connection
docker exec rrr-postgres psql -U demo_user -d restaurant_rocket -c "SELECT version();" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✓ Database connection successful
) else (
    echo ✗ Database connection failed
)

:: Check Redis connection
docker exec rrr-redis redis-cli ping >nul 2>&1
if !errorlevel! equ 0 (
    echo ✓ Redis connection successful
) else (
    echo ✗ Redis connection failed
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Restaurant Revenue Rocket has been successfully set up on your Windows machine.
echo.
echo Next steps:
echo 1. Edit .env file and add your Gemini API key
echo 2. Run 'start-demo.bat' to start the application
echo 3. Open http://localhost:3000 in your browser
echo.
echo For troubleshooting, see:
echo - docs\local-setup\troubleshooting.md
echo - docs\local-setup\windows-installation.md
echo.
echo Quick commands:
echo   start-demo.bat    - Start the application
echo   stop-demo.bat     - Stop all services
echo   npm run dev       - Start development mode
echo.

:: Prompt to start immediately
set /p START_NOW="Would you like to start the application now? (y/N): "
if /i "!START_NOW!"=="y" (
    echo.
    echo Starting Restaurant Revenue Rocket...
    call start-demo.bat
) else (
    echo.
    echo Setup completed. Run 'start-demo.bat' when ready to begin.
)

echo.
pause
