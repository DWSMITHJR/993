#!/bin/bash

# Configuration
REMOTE_HOST="your-production-host.com"
REMOTE_USER="username"
REMOTE_PATH="/var/www/html"
LOCAL_DIR="./"

# Sync files to server
rsync -avz --delete \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.vscode' \
  --exclude='.idea' \
  --exclude='.DS_Store' \
  --exclude='node_modules' \
  -e ssh $LOCAL_DIR $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH

echo "Deployment completed successfully!"
