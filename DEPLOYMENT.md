# Deployment Guide

This guide covers deploying Pokemon Ranch to **Render** and **DigitalOcean**.

## Option 1: Static Site Deployment (Simplest)

Since you have `manifest.json`, the app works as a static site. No server needed!

### Render (Static Site)

1. **Create a Render account** at https://render.com
2. **Go to Dashboard** → Click "New +" → Select "Static Site"
3. **Connect your repository** (GitHub/GitLab/Bitbucket)
   - Or use "Manual Deploy" to upload files
4. **Configure:**
   - **Name:** pokemon-ranch (or any name)
   - **Build Command:** Leave empty (or `echo "No build needed"`)
   - **Publish Directory:** `.` (root directory)
5. **Click "Create Static Site"**
6. Your site will be live at `https://your-app-name.onrender.com`

**Note:** Render's free static sites have some limitations. For production, consider their paid plans.

### DigitalOcean (App Platform - Static Site)

1. **Create a DigitalOcean account** at https://digitalocean.com
2. **Go to App Platform** → Click "Create App"
3. **Connect your repository** or upload files
4. **Configure:**
   - **Resource Type:** Static Site
   - **Build Command:** Leave empty
   - **Output Directory:** `.`
5. **Choose a plan** (Static sites start at $0/month on free tier)
6. **Deploy!**

---

## Option 2: Server Deployment (With API)

If you want the `/api/sprites` endpoint for automatic sprite detection, deploy as a Node.js server.

### Render (Web Service)

1. **Create a Render account** at https://render.com
2. **Go to Dashboard** → Click "New +" → Select "Web Service"
3. **Connect your repository** or upload files
4. **Configure:**
   - **Name:** pokemon-ranch
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid for better performance)
5. **Environment Variables** (optional):
   - `NODE_ENV=production`
   - `PORT` (auto-set by Render, but defaults to 3000)
6. **Click "Create Web Service"**
7. Your app will be live at `https://your-app-name.onrender.com`

**Render Free Tier Notes:**
- Services sleep after 15 minutes of inactivity
- Cold starts take ~30 seconds
- Good for development/testing

### DigitalOcean (App Platform - Web Service)

1. **Create a DigitalOcean account** at https://digitalocean.com
2. **Go to App Platform** → Click "Create App"
3. **Connect your repository** or upload files
4. **Configure:**
   - **Resource Type:** Web Service
   - **Build Command:** `npm install`
   - **Run Command:** `npm start`
   - **HTTP Port:** 3000 (or use `PORT` env var)
5. **Choose a plan:**
   - **Basic:** $5/month (512MB RAM, 1GB storage)
   - **Professional:** $12/month (1GB RAM, better performance)
6. **Environment Variables:**
   - `NODE_ENV=production`
   - `PORT=3000` (optional, auto-detected)
7. **Deploy!**

### Alternative: DigitalOcean Droplet (Manual Setup)

If you prefer a VPS (more control, but manual setup):

1. **Create a Droplet:**
   - Choose Ubuntu 22.04
   - Size: $6/month Basic plan (1GB RAM) is fine
   - Add SSH keys

2. **SSH into your droplet:**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Clone and setup:**
   ```bash
   git clone your-repo-url
   cd pokemon-ranch
   npm install
   ```

5. **Install PM2 (process manager):**
   ```bash
   npm install -g pm2
   pm2 start server.js --name pokemon-ranch
   pm2 startup
   pm2 save
   ```

6. **Setup Nginx (reverse proxy):**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/pokemon-ranch
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pokemon-ranch /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL (Let's Encrypt):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Quick Comparison

| Platform | Type | Free Tier | Best For |
|----------|------|-----------|----------|
| **Render Static** | Static | Yes | Simple, no server needed |
| **Render Web** | Server | Yes (sleeps) | Testing/dev |
| **DO App Platform** | Static | Limited | Production static sites |
| **DO App Platform** | Web Service | $5/month | Production apps |
| **DO Droplet** | VPS | $6/month | Full control |

---

## Pre-Deployment Checklist

- [ ] All sprite GIF files are in `sprites/` directory
- [ ] `sprites/manifest.json` is updated with all your sprites
- [ ] Tested locally (`npm install && npm start` if using server)
- [ ] Repository is ready (if using Git deployment)
- [ ] Domain name ready (optional, for custom domain)

---

## Troubleshooting

### Static Site Issues:
- **Sprites not loading:** Check that paths in `manifest.json` are correct
- **CORS errors:** Some hosts require specific headers (Render handles this automatically)

### Server Issues:
- **Port errors:** Make sure `PORT` environment variable is set or defaults to 3000
- **Sprites not detected:** Check that `sprites/` directory is included in deployment
- **Build fails:** Ensure `package.json` has correct Node version

### Render Specific:
- **Service sleeps:** Free tier services sleep after inactivity. First request takes ~30 seconds
- **Cold starts:** Upgrade to paid plan for instant starts

### DigitalOcean Specific:
- **App won't start:** Check logs in App Platform dashboard
- **Port conflicts:** Ensure `PORT` env var matches your app configuration

---

## Recommended Setup

For **production** with many sprites:
- Use **DigitalOcean App Platform** (Web Service) - $5/month
- Reliable, no sleep, good performance

For **development/testing**:
- Use **Render** (Web Service) - Free tier
- Good for testing, sleeps after inactivity

For **static-only** (no API needed):
- Use **Render Static** or **DigitalOcean App Platform Static**
- Free/cheap, works perfectly with `manifest.json`

