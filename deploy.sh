#!/bin/bash

# OutSystems Exam Trainer - Auto Deploy Script
# This script is designed to run on Synology NAS or Linux servers

# Configuration
PROJECT_DIR="/volume1/docker/outsystems-exam"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"

# Create log directory if not exists
mkdir -p $LOG_DIR

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "=========================================="
log "Starting deployment process..."
log "=========================================="

# Change to project directory
cd $PROJECT_DIR

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    log "ERROR: docker-compose.yml not found. Wrong directory?"
    exit 1
fi

# Pull latest changes from Git
log "Pulling latest changes from Git..."
git fetch origin main
git reset --hard origin/main

if [ $? -ne 0 ]; then
    log "ERROR: Git pull failed!"
    exit 1
fi

log "Git pull successful"

# Backup current database before deployment
if [ -f "data/prod.db" ]; then
    BACKUP_DIR="$PROJECT_DIR/backups"
    mkdir -p $BACKUP_DIR
    BACKUP_FILE="$BACKUP_DIR/prod-db-$(date +%Y%m%d-%H%M%S).db"
    cp data/prod.db $BACKUP_FILE
    log "Database backed up to: $BACKUP_FILE"
    
    # Keep only last 5 backups
    cd $BACKUP_DIR
    ls -t prod-db-*.db | tail -n +6 | xargs -r rm
    cd $PROJECT_DIR
fi

# Stop and remove existing containers
log "Stopping existing containers..."
docker-compose down

if [ $? -ne 0 ]; then
    log "WARNING: Failed to stop containers (may not exist yet)"
fi

# Build Docker image
log "Building Docker image (this may take a few minutes)..."
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    log "ERROR: Docker build failed!"
    exit 1
fi

log "Docker build successful"

# Start containers
log "Starting containers..."
docker-compose up -d

if [ $? -ne 0 ]; then
    log "ERROR: Failed to start containers!"
    exit 1
fi

log "Containers started successfully"

# Wait for app to be ready
log "Waiting for application to be ready..."
sleep 10

# Health check
HEALTH_URL="http://localhost:3651"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$HTTP_CODE" = "200" ]; then
    log "Application is responding (HTTP $HTTP_CODE)"
else
    log "WARNING: Application may not be ready yet (HTTP $HTTP_CODE)"
fi

# Clean up unused Docker images
log "Cleaning up unused Docker images..."
docker image prune -f >> $LOG_FILE 2>&1

# Keep only last 10 deploy logs
cd $LOG_DIR
ls -t deploy-*.log | tail -n +11 | xargs -r rm

log "=========================================="
log "Deployment completed successfully!"
log "Application URL: http://your-nas-ip:3651"
log "Log file: $LOG_FILE"
log "=========================================="

exit 0
