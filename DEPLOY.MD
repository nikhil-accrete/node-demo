# Complete Node.js Deployment Guide

## 🎯 Overview

This guide will help you deploy a complete Node.js application with:
- **Backend**: Node.js API with Express
- **Server**: AWS Ubuntu EC2 instance
- **Web Server**: Nginx reverse proxy
- **Process Manager**: PM2 for Node.js
- **CI/CD**: GitHub Actions for automated deployment

## 📋 Prerequisites

- ✅ AWS EC2 Ubuntu instance running
- ✅ GitHub account
- ✅ Local development environment with Node.js
- ✅ SSH access to your server

## 🚀 Part 1: Local Development Setup

### 1.1 Create Node.js API Project

**Create project directory:**
```bash
mkdir node-api
cd node-api
npm init -y
```

**Install dependencies:**
```bash
npm install express cors helmet morgan dotenv
npm install -D nodemon
```

**Create `.env` file:**
```bash
NODE_ENV=local
PORT=8000
```

**Update `package.json` scripts:**
```json
{
    "name": "node-api",
    "version": "1.0.0",
    "description": "Demo Node.js project for CI/CD with PM2 and GitHub Actions",
    "main": "index.js",
    "scripts": {
        "start": "node index.js",
        "dev": "nodemon index.js",
        "test": "echo \"No tests yet\" && exit 0"
    },
    "author": "Your Name",
    "license": "MIT",
    "dependencies": {
        "cors": "^2.8.5",
        "dotenv": "^17.2.0",
        "express": "^4.21.2",
        "helmet": "^8.1.0",
        "morgan": "^1.10.0",
        "path-to-regexp": "^6.2.1"
    },
    "devDependencies": {
        "nodemon": "^3.1.10"
    }
}
```

### 1.2 Test Local Setup

**Start Node.js API:**
```bash
cd node-api
npm start
# Should run on http://localhost:8000
```

**Test integration** - React app should successfully connect to API.

## 🚀 Part 2: Prepare for Deployment

### 2.1 Create GitHub Repositories

**For Node.js API:**
```bash
cd node-api
git init
git add .
git commit -m "Initial commit - Node.js API"
git branch -M main
git remote add origin https://github.com/yourusername/node-api.git
git push -u origin main
```

### 2.2 Create Production Environment Files

**For Node.js - `.env`:**
```bash
NODE_ENV=production
PORT=8000
```

### 2.3 Add .gitignore Files

**Node.js `.gitignore`:**
```
node_modules/
npm-debug.log*
.env
.env.local
*.log
.DS_Store
```

## 🚀 Part 3: Server Setup

### 3.1 Connect to Your AWS Server

```bash
ssh ubuntu@YOUR_SERVER_IP
```

### 3.2 Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 (Update version if required)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Start and enable services
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3.3 Set Up Project Directories

```bash
# Create project directories
sudo mkdir -p /var/www/html
sudo chown -R ubuntu:ubuntu /var/www/html

# Clone your repositories
cd /var/www/html
git clone https://github.com/yourusername/node-api.git
```

### 3.4 Set Up Node.js API

```bash
cd /var/www/html/node-api

# Install dependencies
npm install --production

# Create production .env file
sudo nano .env
# Add:
# NODE_ENV=production
# PORT=8000

# Start with PM2 directly (no ecosystem.config.js needed)
pm2 start index.js --name "demo-app"

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup
# Follow the instructions shown by the command above
```

## 🚀 Part 4: Configure Nginx

### 4.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/fullstack-app
```

**Add this configuration (replace YOUR_SERVER_IP with your actual IP):**
```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Serve React app (static files)
    location / {
        root /var/www/html/react-frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy API requests to Node.js
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml;
}
```

### 4.2 Enable the Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/fullstack-app /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🚀 Part 5: Update AWS Security Group

1. **Go to AWS Console → EC2 → Security Groups**
2. **Find your instance's security group**
3. **Edit Inbound Rules**
4. **Add these rules:**
   - **Type**: HTTP, **Port**: 80, **Source**: 0.0.0.0/0
   - **Type**: HTTPS, **Port**: 443, **Source**: 0.0.0.0/0
   - **Type**: SSH, **Port**: 22, **Source**: 0.0.0.0/0

## 🚀 Part 6: Set Up SSH Keys for CI/CD

### 6.1 Generate SSH Keys (Local Machine)

```bash
# Generate SSH keys
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Display public key (copy this)
cat ~/.ssh/id_rsa.pub

# Display private key (copy this for GitHub secrets)
cat ~/.ssh/id_rsa
```

### 6.2 Add Public Key to AWS Server

```bash
# SSH to server
ssh ubuntu@YOUR_SERVER_IP

# Add your public key
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste your public key here, save and exit

# Set permissions
chmod 600 ~/.ssh/authorized_keys
```

## 🚀 Part 7: Create GitHub Actions Workflows

### 7.1 Node.js API Deployment

**Create `.github/workflows/deploy-api.yml` in your Node.js repository:**

```yaml
name: Deploy Node.js API

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to AWS Server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            echo "🚀 Starting API deployment..."
            
            cd /var/www/html/node-api
            
            # Pull latest changes
            git pull origin main
            
            # Install dependencies
            npm install --production
            
            # Create logs directory if needed
            mkdir -p logs
            
            # Restart API with PM2
            pm2 restart demo-app || pm2 start index.js --name "demo-app"
            
            # Save PM2 configuration
            pm2 save
            
            echo "✅ API deployment successful!"
```
## 🚀 Part 8: Configure GitHub Secrets

**For both repositories, add these secrets:**
**Repository → Settings → Secrets and variables → Actions**

| Secret Name | Value |
|-------------|-------|
| `SERVER_HOST` | Your server IP address |
| `SERVER_USER` | `ubuntu` |
| `SERVER_SSH_KEY` | Your private SSH key content |

## 🚀 Part 9: Test Your Deployment

### 9.1 Manual Testing

```bash
# Test API directly
curl http://YOUR_SERVER_IP:8000/api/health

# Test through Nginx proxy
curl http://YOUR_SERVER_IP/api/health

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# View logs
pm2 logs demo-app
sudo tail -f /var/log/nginx/error.log
```

### 9.2 Test Full Application

1. **Visit** `http://YOUR_SERVER_IP` in your browser
2. **Check** if React app loads
3. **Test** API functionality (todos, users, stats)
4. **Verify** all features work

### 9.3 Test CI/CD Pipeline

1. **Make a small change** to your code
2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. **Watch GitHub Actions** deploy automatically
4. **Verify** changes appear on your live site

## 🔧 Alternative PM2 Management Commands

### Direct PM2 Commands (without ecosystem.config.js)

**Start application:**
```bash
pm2 start index.js --name "demo-app"
```

**Restart application:**
```bash
pm2 restart demo-app
```

**Stop application:**
```bash
pm2 stop demo-app
```

**Delete application:**
```bash
pm2 delete demo-app
```

**View logs:**
```bash
pm2 logs demo-app
```

**Monitor in real-time:**
```bash
pm2 monit
```

**Check status:**
```bash
pm2 status
```

**Save current PM2 configuration:**
```bash
pm2 save
```

### Advanced PM2 Options

**Start with specific options:**
```bash
pm2 start index.js --name "demo-app" --instances 1 --max-memory-restart 1G
```

**Start in cluster mode:**
```bash
pm2 start index.js --name "demo-app" --instances max
```

**Start with environment variables:**
```bash
pm2 start index.js --name "demo-app" --env production
```

### Common Issues and Solutions

**1. API not responding:**
```bash
# Check PM2 status
pm2 status
pm2 restart demo-app

# Check logs
pm2 logs demo-app
```

**2. React app shows 502 error:**
```bash
# Check Nginx configuration
sudo nginx -t
sudo systemctl restart nginx
```

**3. CI/CD fails:**
- Verify GitHub secrets are correct
- Check SSH key permissions
- Ensure server is accessible

**4. Permission errors:**
```bash
# Fix ownership
sudo chown -R ubuntu:ubuntu /var/www/html
sudo chown -R ubuntu:ubuntu /var/www/html/react-demo
sudo chown -R www-data:www-data /var/www/html/react-frontend/build
```

## 🎯 What You Now Have

✅ **Complete fullstack application**
✅ **Production-ready server setup**
✅ **Automated CI/CD pipeline**
✅ **Nginx reverse proxy with caching**
✅ **PM2 process management**
✅ **Security headers and optimization**

## 🔧 Troubleshooting

1. **Set up SSL/HTTPS** with Let's Encrypt
2. **Configure custom domain** instead of IP
3. **Add database** (MongoDB/PostgreSQL)
4. **Set up monitoring** and alerting
5. **Add comprehensive logging**
6. **Implement authentication**
7. **Add automated backups**

Your fullstack application is now live and automatically deployable! 🎉

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Verify all steps were followed correctly
3. Check server logs for detailed error messages
4. Ensure all dependencies are properly installed

Happy deploying! 🚀