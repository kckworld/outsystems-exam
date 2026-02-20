#!/usr/bin/env node

/**
 * OutSystems Exam Trainer - Webhook Server
 * Listens for GitHub webhook events and triggers deployment
 * 
 * Usage: node webhook-server.js
 * Or: nohup node webhook-server.js > logs/webhook.log 2>&1 &
 */

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'change-this-webhook-secret-key';
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || '/volume1/docker/outsystems-exam/deploy.sh';
const LOG_DIR = path.join(__dirname, 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Also write to file
  const logFile = path.join(LOG_DIR, 'webhook.log');
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Verify GitHub signature
function verifySignature(body, signature) {
  if (!signature) {
    return false;
  }
  
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', SECRET)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Execute deployment script
function deploy() {
  log('Executing deployment script...');
  
  exec(DEPLOY_SCRIPT, (error, stdout, stderr) => {
    if (error) {
      log(`Deployment error: ${error.message}`);
      return;
    }
    
    if (stderr) {
      log(`Deployment stderr: ${stderr}`);
    }
    
    log(`Deployment output: ${stdout}`);
    log('Deployment completed');
  });
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }
  
  // Webhook endpoint
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        // Verify signature
        const signature = req.headers['x-hub-signature-256'];
        
        if (!verifySignature(body, signature)) {
          log('Invalid signature - webhook rejected');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid signature' }));
          return;
        }
        
        const payload = JSON.parse(body);
        const event = req.headers['x-github-event'];
        
        log(`Received webhook event: ${event}`);
        
        // Handle push event
        if (event === 'push') {
          const branch = payload.ref;
          const repository = payload.repository.full_name;
          const pusher = payload.pusher.name;
          const commits = payload.commits.length;
          
          log(`Push event: ${repository} (${branch}) by ${pusher} - ${commits} commits`);
          
          // Only deploy on main branch
          if (branch === 'refs/heads/main') {
            log('Triggering deployment for main branch');
            deploy();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              message: 'Deployment started',
              branch: branch,
              commits: commits
            }));
          } else {
            log(`Skipping deployment for branch: ${branch}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              message: 'Skipped - not main branch',
              branch: branch
            }));
          }
        } else {
          log(`Event ${event} - no action taken`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Event received but no action taken' }));
        }
      } catch (error) {
        log(`Error processing webhook: ${error.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    
    req.on('error', (error) => {
      log(`Request error: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Request error' }));
    });
  } else {
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Start server
server.listen(PORT, () => {
  log('========================================');
  log(`Webhook server started on port ${PORT}`);
  log(`Health check: http://localhost:${PORT}/health`);
  log(`Webhook URL: http://your-nas-ip:${PORT}/webhook`);
  log(`Deploy script: ${DEPLOY_SCRIPT}`);
  log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully');
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`);
  log(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`);
});
