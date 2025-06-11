// Restaurant Revenue Rocket - Requirements Check Script
// This script checks for system requirements before installation or running the application

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================');
console.log('Checking System Requirements for Restaurant Revenue Rocket');
console.log('========================================\n');

// Check Node.js version
function checkNodeVersion() {
  const requiredNodeVersion = '20.0.0';
  const currentNodeVersion = process.version.slice(1); // Remove 'v' prefix
  console.log(`Node.js Version: ${currentNodeVersion}`);
  
  if (currentNodeVersion < requiredNodeVersion) {
    console.error(`ERROR: Node.js version ${requiredNodeVersion} or higher is required.`);
    process.exit(1);
  } else {
    console.log('✓ Node.js version meets requirements');
  }
}

// Check npm version
function checkNpmVersion() {
  try {
    const requiredNpmVersion = '8.0.0';
    const npmVersion = execSync('npm --version').toString().trim();
    console.log(`npm Version: ${npmVersion}`);
    
    if (npmVersion < requiredNpmVersion) {
      console.error(`WARNING: npm version ${requiredNpmVersion} or higher is recommended.`);
    } else {
      console.log('✓ npm version meets requirements');
    }
  } catch (error) {
    console.error('ERROR: Unable to determine npm version. Ensure npm is installed.');
    process.exit(1);
  }
}

// Check Docker installation
function checkDocker() {
  try {
    const dockerInfo = execSync('docker info --format "{{.ServerVersion}}"').toString().trim();
    console.log(`Docker Version: ${dockerInfo || 'Unknown'}`);
    console.log('✓ Docker is installed and running');
  } catch (error) {
    console.error('WARNING: Docker is not running or not installed. Docker is required for database and caching services.');
    console.error('Please ensure Docker Desktop is installed and running.');
  }
}

// Check project directories
function checkProjectStructure() {
  const requiredDirs = ['backend', 'frontend', 'scripts'];
  let missingDirs = [];
  
  console.log('\nChecking project structure...');
  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      missingDirs.push(dir);
      console.log(`✗ Directory '${dir}' is missing`);
    } else {
      console.log(`✓ Directory '${dir}' found`);
    }
  });
  
  if (missingDirs.length > 0) {
    console.error(`\nWARNING: The following required directories are missing: ${missingDirs.join(', ')}`);
    console.error('Ensure you have cloned the full repository or initialized the project structure.');
    console.log('Continuing with setup despite missing directories, as placeholders may be in place.');
  } else {
    console.log('✓ Project structure check passed. Note: Directories may be placeholders until full implementation.');
  }
}

// Run all checks
function runChecks() {
  checkNodeVersion();
  checkNpmVersion();
  checkDocker();
  checkProjectStructure();
  
  console.log('\n========================================');
  console.log('System Requirements Check Complete');
  console.log('========================================\n');
}

runChecks();
