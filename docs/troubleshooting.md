docs/local-setup/troubleshooting.md

# Troubleshooting Guide

Comprehensive solutions for common issues encountered when running Restaurant Revenue Rocket on Windows.

## Quick Diagnostic Commands

System Status Check
docker --version && docker-compose --version
node --version && npm --version
docker ps
netstat -an | findstr ":3000 :5000 :5432 :6379"

Application Health Check
curl http://localhost:5000/health
curl http://localhost:3000

Service Logs
docker logs rrr-postgres
docker logs rrr-redis
npm run monitor:resources



## Installation Issues

### Node.js Problems

**Problem:** Node.js installation fails or version conflicts

**Symptoms:**
- `node: command not found`
- Version mismatch errors
- npm permission issues

**Solutions:**

Complete Node.js reinstallation
1. Uninstall existing Node.js
Control Panel > Programs > Uninstall Node.js
2. Clear npm cache and directories
rmdir /s /q "%APPDATA%\npm"
rmdir /s /q "%APPDATA%\npm-cache"

3. Download fresh Node.js installer
https://nodejs.org/ (LTS version)
4. Install with administrator privileges
Right-click installer > "Run as administrator"
5. Verify installation
node --version
npm --version

6. Fix npm permissions (if needed)
npm config set prefix "%APPDATA%\npm"
npm config set cache "%APPDATA%\npm-cache"



**Alternative Solution - Use Node Version Manager:**
Install Node Version Manager for Windows
Download nvm-windows from: https://github.com/coreybutler/nvm-windows
Install specific Node.js version
nvm install 20.10.0
nvm use 20.10.0
nvm alias default 20.10.0



### Docker Desktop Issues

**Problem:** Docker Desktop won't start

**Symptoms:**
- "Docker Desktop starting..." forever
- "Docker Desktop stopped" error
- WSL 2 integration issues

**Solutions:**

Method 1: Restart Docker Service
net stop com.docker.service
net start com.docker.service

Method 2: Reset Docker Desktop
Docker Desktop > Settings > Troubleshoot > Reset to factory defaults
Method 3: WSL 2 Issues
PowerShell as Administrator
wsl --shutdown
wsl --unregister docker-desktop
wsl --unregister docker-desktop-data

Restart Docker Desktop
Method 4: Manual Service Reset
Services.msc > Docker Desktop Service > Restart
Method 5: Complete Reinstallation
Uninstall Docker Desktop
Delete %APPDATA%\Docker
Delete C:\ProgramData\Docker
Reinstall Docker Desktop


**Problem:** Docker containers won't start

**Symptoms:**
- Container exits immediately
- Port binding errors
- Volume mounting issues

**Solutions:**

Check container logs
docker logs rrr-postgres
docker logs rrr-redis

Check port conflicts
netstat -ano | findstr :5432
netstat -ano | findstr :6379

Kill conflicting processes
taskkill /PID [process_id] /F

Reset containers
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d

Check Docker resources
Docker Desktop > Settings > Resources
Increase memory to 6GB+


## Application Startup Issues

### Port Conflicts

**Problem:** Ports 3000, 5000, 5432, or 6379 already in use

**Symptoms:**
- "EADDRINUSE: address already in use"
- Application fails to start
- Connection refused errors

**Solutions:**

Identify processes using ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5432
netstat -ano | findstr :6379

Kill specific processes
taskkill /PID [process_id] /F

Or use PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

Change application ports (if needed)
Edit .env file:
PORT=3001
BACKEND_PORT=5001

Change database ports
Edit docker-compose.local.yml:
ports:

"5433:5432" # PostgreSQL

"6380:6379" # Redis



### Database Connection Issues

**Problem:** Cannot connect to PostgreSQL database

**Symptoms:**
- "connection refused" errors
- "role does not exist" errors
- Database timeout errors

**Solutions:**

Check PostgreSQL container status
docker ps | grep rrr-postgres
docker logs rrr-postgres

Test database connectivity
docker exec rrr-postgres pg_isready -U demo_user

Reset database container
docker stop rrr-postgres
docker rm rrr-postgres
docker volume rm rrr_postgres_data

Restart with fresh data
docker-compose -f docker-compose.local.yml up -d postgres

Reinitialize database
cd backend
npm run db:migrate
npm run db:seed
cd ..

Manual database connection test
docker exec -it rrr-postgres psql -U demo_user -d restaurant_rocket

Should connect without errors


### Redis Connection Issues

**Problem:** Cannot connect to Redis cache

**Symptoms:**
- Redis connection timeout
- Session data not persisting
- Cache miss errors

**Solutions:**

Check Redis container status
docker ps | grep rrr-redis
docker logs rrr-redis

Test Redis connectivity
docker exec rrr-redis redis-cli ping

Should return "PONG"
Reset Redis container
docker stop rrr-redis
docker rm rrr-redis
docker volume rm rrr_redis_data

Restart Redis
docker-compose -f docker-compose.local.yml up -d redis

Test Redis functionality
docker exec rrr-redis redis-cli set test "hello"
docker exec rrr-redis redis-cli get test

Should return "hello"


## Performance Issues

### Slow Application Performance

**Problem:** Application runs slowly or becomes unresponsive

**Symptoms:**
- Long loading times (>10 seconds)
- Scenario transitions delay
- Browser becomes unresponsive

**Solutions:**

Check system resources
Task Manager > Performance tab
Ensure sufficient RAM and CPU available
Optimize Docker resources
Docker Desktop > Settings > Resources
Memory: 6-8GB
CPU: 4 cores
Disk: Enable "Use gRPC FUSE for file sharing"
Clear browser cache
Chrome: Ctrl+Shift+Delete
Edge: Ctrl+Shift+Delete
Restart Docker containers
docker-compose -f docker-compose.local.yml restart

Clear application cache
rm -rf frontend/node_modules/.cache
rm -rf backend/node_modules/.cache

Monitor resource usage
npm run monitor:resources



### High Memory Usage

**Problem:** Application consumes excessive memory

**Symptoms:**
- System becomes slow
- Docker containers restart unexpectedly
- Out of memory errors

**Solutions:**

Check memory usage
docker stats

Task Manager > Processes
Limit container memory
Edit docker-compose.local.yml:
services:
postgres:
deploy:
resources:
limits:
memory: 2G
redis:
deploy:
resources:
limits:
memory: 512M

Optimize PostgreSQL configuration
Edit docker/postgres/postgres.local.conf:
shared_buffers = 128MB
effective_cache_size = 512MB
work_mem = 2MB

Clear unused Docker resources
docker system prune -a
docker volume prune



## AI Assistant Issues

### Gemini API Problems

**Problem:** AI assistant not responding or giving errors

**Symptoms:**
- "AI assistant offline" message
- API rate limit errors
- Invalid API key errors

**Solutions:**

Verify API key configuration
Check .env file:
GEMINI_API_KEY=your_actual_api_key_here

Ensure no extra spaces or quotes
Test API key validity
curl -H "Authorization: Bearer YOUR_API_KEY"
https://generativelanguage.googleapis.com/v1/models

Enable offline mode
Edit .env file:
AI_OFFLINE_MODE=true

Check API usage limits
Visit Google Cloud Console
Check quotas and billing
Restart application with new settings
stop-demo.bat
start-demo.bat



### Offline Mode Issues

**Problem:** Offline mode not working properly

**Symptoms:**
- AI responses unavailable offline
- Fallback responses not loading
- Offline indicator not showing

**Solutions:**

Verify offline response files exist
ls frontend/public/assets/data/offline-responses.json

Check offline mode configuration
.env file:
AI_OFFLINE_MODE=true
AI_FALLBACK_RESPONSES_PATH=./frontend/public/assets/data/offline-responses.json

Test offline functionality
Disconnect internet
Restart application
Verify AI assistant shows offline responses
Regenerate offline responses (if missing)
node scripts/generate-offline-responses.js



## Browser Compatibility Issues

### Browser-Specific Problems

**Problem:** Application doesn't work in specific browsers

**Symptoms:**
- Blank pages
- JavaScript errors
- CSS rendering issues
- Interactive elements not working

**Solutions:**

Supported browsers:
Chrome 90+, Edge 90+, Firefox 88+, Safari 14+
Clear browser data
Chrome: chrome://settings/clearBrowserData
Edge: edge://settings/clearBrowserData
Firefox: about:preferences#privacy
Disable browser extensions
Test in incognito/private mode
Check browser console for errors
F12 > Console tab
Update browser to latest version
Test different browsers
Chrome: https://chrome.google.com/
Edge: Built into Windows 10/11
Firefox: https://firefox.com/


### Security Certificate Issues

**Problem:** Browser security warnings or HTTPS issues

**Symptoms:**
- "Not secure" warnings
- Certificate errors
- Mixed content warnings

**Solutions:**

For local development, use HTTP
Application URL: http://localhost:3000
NOT: https://localhost:3000
If HTTPS required, generate local certificates
Install mkcert
npm install -g mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1

Configure application for HTTPS
Update .env:
HTTPS=true
SSL_CRT_FILE=localhost.pem
SSL_KEY_FILE=localhost-key.pem



## Network and Connectivity Issues

### Internet Connection Problems

**Problem:** Application requires internet but connection is unreliable

**Symptoms:**
- AI assistant intermittent failures
- Asset loading issues
- API timeouts

**Solutions:**

Enable robust offline mode
.env configuration:
AI_OFFLINE_MODE=true
CACHE_STRATEGY=aggressive
OFFLINE_FIRST=true

Pre-cache all assets
npm run cache:preload

Configure connection timeout settings
.env:
API_TIMEOUT=30000
CONNECTION_RETRY_ATTEMPTS=3
OFFLINE_DETECTION=true

Test offline functionality
Network adapter > Disable
Verify application continues working


### Firewall and Antivirus Interference

**Problem:** Windows Firewall or antivirus blocking application

**Symptoms:**
- Connection refused errors
- Application won't start
- Port access denied

**Solutions:**

Windows Firewall configuration
Windows Security > Firewall & network protection
Allow through firewall:
- Node.js
- Docker Desktop
- Restaurant Revenue Rocket
Manual firewall rules
netsh advfirewall firewall add rule name="RRR Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="RRR Backend" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="RRR Database" dir=in action=allow protocol=TCP localport=5432

Antivirus exclusions
Add exclusions for:
C:\RestaurantRevenueRocket\
C:\Users$$Username].docker\
%APPDATA%\npm\
Temporary disable real-time protection for testing
Windows Security > Virus & threat protection
Real-time protection: Off (temporarily)


## Data and Export Issues

### Export Functionality Problems

**Problem:** Cannot export session data or reports

**Symptoms:**
- Export buttons not working
- Download fails
- Corrupted export files

**Solutions:**

Check export directory permissions
Ensure data/exports/ directory exists and is writable
mkdir data\exports\session-reports

Test export functionality
npm run demo:export-session

Check browser download settings
Chrome: chrome://settings/downloads
Ensure downloads allowed and directory accessible
Manual export alternative
Copy files from: data/exports/session-reports/
To: Desktop or desired location
Clear export cache
rm -rf data/exports/temp/*



### Demo Profile Loading Issues

**Problem:** Client profiles won't load or are corrupted

**Symptoms:**
- Profile loading errors
- Default profile used instead
- Missing scenario data

**Solutions:**

Verify profile files exist
ls data/demo-profiles/

Should show: quick-service.json, fine-dining.json, etc.
Validate profile JSON
Use JSON validator or:
node -e "console.log(JSON.parse(require('fs').readFileSync('data/demo-profiles/fine-dining.json')))"

Reset to default profiles
npm run demo:reset-profiles

Manual profile loading
npm run demo:load-profile "fine-dining"

Check profile loading logs
docker logs rrr-app | grep profile



## Emergency Recovery Procedures

### Complete System Reset

**When all else fails:**

1. Stop all services
stop-demo.bat

2. Remove all containers and volumes
docker-compose -f docker-compose.local.yml down -v
docker system prune -a
docker volume prune

3. Clear application data
rmdir /s /q data\exports\session-reports
rmdir /s /q data\temp
rmdir /s /q docker\volumes

4. Reinstall dependencies
rm -rf node_modules frontend\node_modules backend\node_modules
npm run install:all

5. Reconfigure environment
copy .env.example .env

Edit .env with your settings
6. Complete setup
setup-windows.bat

7. Verify installation
start-demo.bat



### Backup and Restore

**Create backup before troubleshooting:**

Backup application data
xcopy /s data\exports backup\exports
xcopy /s docker\volumes backup\volumes
copy .env backup\

Backup Docker volumes
docker run --rm -v rrr_postgres_data:/data -v %cd%\backup:/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
docker run --rm -v rrr_redis_data:/data -v %cd%\backup:/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .

Restore from backup
xcopy /s backup\exports data\exports
xcopy /s backup\volumes docker\volumes
copy backup.env .env

Restore Docker volumes
docker run --rm -v rrr_postgres_data:/data -v %cd%\backup:/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
docker run --rm -v rrr_redis_data:/data -v %cd%\backup:/backup alpine tar xzf /backup/redis-backup.tar.gz -C /data



## Getting Additional Help

### Log Analysis

Collect all relevant logs
mkdir troubleshooting-logs
copy docker\volumes\logs*.log troubleshooting-logs
docker logs rrr-postgres > troubleshooting-logs\postgres.log
docker logs rrr-redis > troubleshooting-logs\redis.log
npm run monitor:performance > troubleshooting-logs\performance.log



### System Information

Gather system information
systeminfo > system-info.txt
docker version > docker-info.txt
docker-compose version >> docker-info.txt
node --version > node-info.txt
npm --version >> node-info.txt



### Contact Support

When contacting support, provide:
- System information files
- Complete error messages
- Steps to reproduce the issue
- Log files from troubleshooting-logs folder
- Screenshot of the issue

**Support Channels:**
- Documentation: `docs/` folder
- GitHub Issues: [Repository issues page]
- Email: support@restaurantrevenuerocket.com