# Complete CI/CD Deployment Guide for Node.js on AWS

## Overview
This guide covers setting up automated deployment for Node.js applications using GitHub Actions and AWS EC2.

## ✅ Current Setup (What You've Done Right)

Your current setup is excellent and follows best practices:
- ✅ SSH key authentication
- ✅ GitHub Actions for CI/CD
- ✅ PM2 for process management
- ✅ Automated deployment on push to main branch

## 🔧 Improved GitHub Actions Workflow

Here's an enhanced version of your workflow with additional features:

```yaml
name: Deploy Node.js Demo

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linting
        run: npm run lint || echo "No lint script found"

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: 22
          timeout: 60s
          script: |
            echo "🚀 Starting deployment..."
            
            cd /var/www/html/node-demo
            cp package.json package.json.backup
            echo "📥 Pulling latest changes..."
            git pull origin main
            echo "📦 Installing dependencies..."
            npm ci --production
            echo "🔨 Building application..."
            npm run build 2>/dev/null || echo "No build script found"
            echo "🔄 Restarting application..."
            pm2 restart demo-app || pm2 start ecosystem.config.js
            pm2 save
            echo "✅ Deployment completed successfully!"
```

## 📋 Complete Setup Checklist

### 1. Local Development Machine Setup

```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
cat ~/.ssh/id_rsa.pub
cat ~/.ssh/id_rsa
```

### 2. AWS EC2 Server Setup

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
sudo mkdir -p /var/www/html
sudo chown -R ubuntu:ubuntu /var/www/html
cd /var/www/html
git clone https://github.com/yourusername/your-repo.git node-demo
cd node-demo
npm install --production
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. PM2 Ecosystem Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'demo-app',
    script: './app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start your application:
```bash
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. GitHub Repository Secrets

| Secret Name | Value |
|-------------|-------|
| `SERVER_HOST` | Your EC2 public IP |
| `SERVER_USER` | `ubuntu` |
| `SERVER_SSH_KEY` | Your private SSH key content |

### 5. Project Structure

```
your-project/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── ecosystem.config.js
├── package.json
├── app.js
├── logs/
└── README.md
```

## 🔒 Security Best Practices

### 1. Server Security

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 3000
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 2. Environment Variables

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=your_database_url
API_KEY=your_api_key
```

### 3. GitHub Secrets Management
- Never commit sensitive data
- Use GitHub secrets
- Rotate SSH keys periodically

## 🚀 Deployment Process

### Automatic Deployment
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### Manual Deployment
```bash
ssh ubuntu@your-server-ip
cd /var/www/html/node-demo
git pull origin main
npm install --production
pm2 restart demo-app
```

## 📊 Monitoring & Maintenance

```bash
pm2 status
pm2 logs demo-app
pm2 monit
pm2 restart demo-app
pm2 stop demo-app
pm2 delete demo-app
htop
df -h
free -h
tail -f /var/www/html/node-demo/logs/combined.log
```

## 🔧 Advanced Features

### Zero-Downtime Deployment

```javascript
instances: 'max',
exec_mode: 'cluster',
```

```yaml
pm2 reload demo-app || pm2 start ecosystem.config.js
```

### Database Migrations

```yaml
npm run migrate
```

### Health Checks

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});
```

## 📝 Best Practices Summary

✅ **Do:** Use SSH keys, run tests, use PM2, keep secrets safe  
❌ **Don't:** Commit secrets, deploy without tests

## 🎯 Next Steps

- Set up staging
- Add backups
- Implement monitoring
- Set up HTTPS
- Use Nginx reverse proxy
- Add tests
- Implement rollback strategy