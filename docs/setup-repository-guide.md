# Setup Guide for Restaurant Revenue Rocket Repository

## Overview
This guide provides step-by-step instructions for setting up the full project repository for "Restaurant Revenue Rocket." The current state of the project directory is missing critical components such as `scripts`, `backend`, and `frontend` directories, which are essential for setting up the development environment and proceeding with Phase 2: Core Agentic AI Development. This document aims to assist in obtaining or initializing the complete project structure to enable environment setup and development tasks.

## Objectives
- Ensure the full project repository is cloned or initialized with all necessary files and directories.
- Verify the presence of critical components required for development, including `scripts`, `backend`, and `frontend`.
- Provide clear instructions to resolve the current blocker in setting up the development environment.

## Current Issue
The project directory at `c:/Users/Thack/Documents/_projects/restaurant-rocket` lacks essential directories and files, including:
- `scripts/` - Likely contains necessary setup or utility scripts (e.g., `check-requirements.js`).
- `backend/` - Essential for server-side code and API integrations.
- `frontend/` - Essential for the user interface and demo interactions.

This absence prevents the successful execution of setup scripts like `start-demo.bat`, installation of dependencies via `npm install`, and starting of Docker containers for PostgreSQL and Redis.

## Steps to Set Up the Repository

### Step 1: Confirm Repository Source
- **Action**: Determine the source of the full "Restaurant Revenue Rocket" repository. This could be a GitHub repository, an internal Git server, or another version control system.
- **If you have the repository URL**:
  - Proceed to Step 2 to clone the repository.
- **If you do not have the repository URL**:
  - Contact the project administrator, team lead, or relevant stakeholder to obtain access to the full project repository.
  - Alternatively, if this is a new project setup, confirm if a project template or initialization script is available to create the missing directories and files.

### Step 2: Clone the Full Repository
- **Prerequisite**: Ensure Git is installed on your system. If not, download and install Git from [https://git-scm.com/downloads](https://git-scm.com/downloads).
- **Action**: Clone the repository to your local machine using the following command in PowerShell or Command Prompt. Replace `<repository-url>` with the actual URL provided by your project administrator.
  ```
  git clone <repository-url>
  ```
- **Alternative**: If the repository is already partially cloned, you may need to pull the latest changes or switch to the correct branch to ensure all files are present:
  ```
  git pull origin main
  ```
  Replace `main` with the appropriate branch name if different.
- **Destination**: Ensure the repository is cloned or updated in `c:/Users/Thack/Documents/_projects/restaurant-rocket`. If cloning to a new location, move the contents to this directory or update the working directory accordingly.

### Step 3: Verify Project Structure
- **Action**: After cloning or updating the repository, check for the presence of critical directories and files. Use the following PowerShell command to list the contents of the project directory:
  ```
  dir
  ```
- **Expected Structure**: Confirm that the following directories are now present:
  - `scripts/`
  - `backend/`
  - `frontend/`
  - Other relevant directories or files as per the project documentation.
- **If Structure is Incomplete**: If critical directories are still missing, contact the repository owner or check if there are submodules or additional setup steps required. Run the following command to update submodules if applicable:
  ```
  git submodule update --init --recursive
  ```

### Step 4: Initialize Environment Configuration
- **Action**: Check for the presence of a `.env` file in the project root. If missing, create one by copying `.env.example` to `.env`:
  ```
  copy .env.example .env
  ```
- **Edit `.env`**: Open the `.env` file in a text editor and update any necessary configurations, such as API keys (e.g., Gemini API key), port numbers, or database credentials as per the project requirements.

### Step 5: Run Setup Script (if available)
- **Action**: If a setup script like `setup-windows.bat` is present, run it to initialize the project environment, install dependencies, and set up Docker containers:
  ```
  .\setup-windows.bat
  ```
- **Note**: Ensure Docker Desktop is running before executing the setup script. If Docker is not running, start it manually or use:
  ```
  start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  ```

### Step 6: Install Dependencies
- **Action**: Once the full repository structure is confirmed, install project dependencies using npm. Run the following command in the project root directory:
  ```
  npm install
  ```
- **Note**: If npm version compatibility warnings appear (as seen with npm v11.1.0 and Node.js v20.16.0), consider updating npm to a compatible version or Node.js to a supported version like 20.17.0 or higher:
  ```
  npm install -g npm
  ```

### Step 7: Start Development Environment
- **Action**: After dependencies are installed, start the development environment using the provided script:
  ```
  .\start-demo.bat
  ```
- **Alternative**: If `start-demo.bat` fails, manually start Docker containers using:
  ```
  & "C:\Program Files\Docker\Docker\resources\bin\docker-compose.exe" -f docker-compose.local.yml up -d postgres redis
  ```
- **Verify**: Check if containers are running:
  ```
  & "C:\Program Files\Docker\Docker\resources\bin\docker.exe" ps
  ```

### Step 8: Confirm Setup Completion
- **Action**: Verify that the development environment is fully set up by checking for running containers, installed dependencies, and accessible services. Ensure the backend and frontend (if applicable) can be started without errors.
- **Documentation**: Refer to additional setup guides in the `docs/` folder for troubleshooting or specific configuration details.

## Troubleshooting
- **Git Clone Issues**: If cloning fails, ensure you have the correct permissions and access to the repository. Check network connectivity and Git credentials.
- **Missing Directories**: If critical directories are still missing after cloning, confirm with the project team if there are additional repositories, submodules, or manual setup steps required.
- **Docker Issues**: Ensure Docker Desktop is installed and running. If `docker-compose.local.yml` is empty or ineffective, it may need to be updated or regenerated as part of the setup process.
- **Dependency Installation Errors**: If `npm install` fails, check for Node.js and npm version compatibility. Consider using a Node.js version manager like `nvm` to switch to a supported version.

## Next Steps
Once the full repository is set up and the development environment is initialized, proceed with Phase 2: Core Agentic AI Development tasks as outlined in `docs/phase2-core-ai-development-progress.md`. The immediate task will be to confirm the setup (Week 3, Day 1-2) and update the progress documentation accordingly.

If further assistance is needed beyond these steps, please provide details on the repository source, access credentials, or any specific setup instructions unique to this project.

**Note**: This guide was created to address the current blocker in setting up the development environment due to missing project components. It will be updated as needed based on user feedback or additional information.
