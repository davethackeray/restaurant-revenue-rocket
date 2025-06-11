
# Restaurant Revenue Rocket 🚀

An interactive, gamified web application that demonstrates AI integration opportunities for restaurant businesses through immersive storytelling and hands-on simulations.

## Overview

Restaurant Revenue Rocket puts users in the shoes of Sarah Chen, owner of "Bella Vista," a struggling 15-location Italian restaurant chain. Through 10 interactive scenarios, users experience firsthand how AI integrations can transform operations, reduce costs, and increase revenue.

**Key Features:**
- 10 Interactive AI Integration Scenarios
- Real-time ROI Calculator
- AI-Powered Assistant (Gemini API)
- Gamified Learning Experience
- Local Windows Deployment
- Offline-Ready Demonstrations

## System Requirements

### Minimum Requirements
- **Operating System:** Windows 10 (Build 1903+) or Windows 11
- **RAM:** 8GB (16GB recommended)
- **CPU:** 4-core processor (Intel i5 or AMD Ryzen 5 equivalent)
- **Storage:** 10GB free disk space
- **Network:** Internet connection for Gemini AI API (optional for offline mode)

### Required Software
- **Node.js:** Version 20.0.0 or higher
- **Docker Desktop:** Latest version for Windows
- **Git:** For version control (optional)

## Quick Start

### 1. Initial Setup

Clone or download the repository
git clone https://github.com/your-org/restaurant-revenue-rocket.git
cd restaurant-revenue-rocket

Run the Windows setup script
setup-windows.bat

text

### 2. Configure Environment

1. Copy `.env.example` to `.env`
2. Add your Gemini API key:
GEMINI_API_KEY=your_api_key_here

text

### 3. Start Demonstration

Start the demonstration environment
start-demo.bat

text

The application will be available at `http://localhost:3000`

### 4. Stop Demonstration

Stop all services
stop-demo.bat

text

## Installation Guide

### Step 1: Install Prerequisites

#### Node.js Installation
1. Download Node.js 20+ from [nodejs.org](https://nodejs.org/)
2. Run the installer with default options
3. Verify installation:
node --version
npm --version

text

#### Docker Desktop Installation
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Install with WSL 2 backend enabled
3. Start Docker Desktop and complete setup
4. Verify installation:
docker --version
docker-compose --version

text

### Step 2: Application Setup

1. **Download Application**
If using Git
git clone https://github.com/your-org/restaurant-revenue-rocket.git
cd restaurant-revenue-rocket

Or extract from ZIP file
text

2. **Run Setup Script**
setup-windows.bat

text

3. **Configure Environment**
- Edit `.env` file with your Gemini API key
- Verify Docker containers are running

### Step 3: First Run

1. **Start Application**
start-demo.bat

text

2. **Access Application**
- Open browser to `http://localhost:3000`
- Complete initial setup wizard

3. **Verify Installation**
- Test all 10 scenarios
- Verify AI assistant functionality
- Check offline mode capabilities

## Usage Guide

### For Consultants

#### Preparing for Client Demonstrations

1. **Pre-Demo Setup**
Reset to clean state
npm run demo:reset

Load client-specific profile
npm run demo:load-profile "fine-dining"

text

2. **During Client Meeting**
- Start with overview scenario
- Customise examples to client's business
- Use ROI calculator with client's numbers
- Export results for follow-up

3. **Post-Demo Actions**
Export session results
npm run demo:export-session

Reset for next client
npm run demo:reset

text

#### Available Demo Profiles

- `quick-service` - Fast food and QSR chains
- `fine-dining` - Upscale restaurant operations
- `fast-casual` - Fast-casual restaurant chains
- `multi-location` - Large restaurant groups

### For Developers

#### Development Workflow

1. **Start Development Environment**
npm run dev

text

2. **Run Tests**
npm run test
npm run test:e2e

text

3. **Build for Production**
npm run build

text

#### Available Scripts

- `npm run dev` - Start development servers
- `npm run build` - Build production version
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run code linting
- `npm run demo:reset` - Reset demonstration data
- `npm run demo:export` - Export session data

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `NODE_ENV` | Environment mode | No | `demonstration` |
| `PORT` | Application port | No | `3000` |
| `DATABASE_URL` | PostgreSQL connection | No | Local Docker |
| `REDIS_URL` | Redis connection | No | Local Docker |

### Client Profiles

Located in `/data/demo-profiles/`, these JSON files configure scenarios for different restaurant types:

{
"name": "Fine Dining Restaurant",
"type": "fine-dining",
"metrics": {
"averageCheckSize": 85,
"dailyCovers": 120,
"locationCount": 3,
"currentMargin": 8
},
"scenarios": {
"inventory": {
"currentWaste": 35,
"targetWaste": 8
}
}
}

text

## Troubleshooting

### Common Issues

#### Docker Desktop Issues
Restart Docker Desktop
Windows: Restart Docker Desktop application
Check Docker status
docker system info

Reset Docker if needed
docker system prune -a

text

#### Port Conflicts
Check port usage
netstat -ano | findstr :3000
netstat -ano | findstr :5000

Stop conflicting processes or change ports in .env
text

#### Database Connection Issues
Restart database container
docker-compose -f docker-compose.local.yml restart postgres

Check database logs
docker logs rrr-postgres

text

#### Memory Issues
Check system memory usage
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory

Increase Docker memory allocation in Docker Desktop settings
text

### Log Files

- **Application Logs:** `./docker/volumes/logs/`
- **Database Logs:** `docker logs rrr-postgres`
- **Redis Logs:** `docker logs rrr-redis`

### Getting Help

1. **Check Documentation:** Review `/docs/` folder
2. **Check Logs:** Review application and container logs
3. **Restart Services:** Use `stop-demo.bat` then `start-demo.bat`
4. **Reset Environment:** Run `setup-windows.bat` again

## Architecture

### Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL 15 (Docker)
- **Cache:** Redis 7 (Docker)
- **AI Integration:** Google Gemini API
- **Containerisation:** Docker & Docker Compose

### Local Deployment Architecture

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ React App │ │ Node.js API │ │ PostgreSQL │
│ Port: 3000 │────│ Port: 5000 │────│ Port: 5432 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
│
┌─────────────────┐ ┌─────────────────┐
│ Redis │ │ Gemini API │
│ Port: 6379 │ │ (External) │
└─────────────────┘ └─────────────────┘

text

## Performance

### Optimisation Tips

1. **Allocate Adequate Resources**
   - Docker Desktop: 4GB RAM minimum
   - Close unnecessary applications during demos

2. **Pre-load Demo Data**
npm run demo:preload

text

3. **Use SSD Storage**
- Significantly improves database performance

4. **Monitor Resource Usage**
npm run monitor:resources

text

## Security

### Local Security Considerations

- Application runs on localhost only
- No external network exposure by default
- Demo data isolated per session
- Sensitive data not persisted beyond session

### Data Privacy

- All client interaction data remains local
- No data transmitted to external services except Gemini API
- Optional offline mode for sensitive demonstrations

## License

Copyright (c) 2025 Restaurant Revenue Rocket. All rights reserved.

## Support

For technical support or questions:
- Email: support@restaurantrevenuerocket.com
- Documentation: `/docs/`
- Issues: [GitHub Issues](https://github.com/your-org/restaurant-revenue-rocket/issues)