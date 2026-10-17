# Deploying CarbonBill to Render.com (Free Tier Guide)

This guide shows you how to deploy **CarbonBill** to [Render.com](https://render.com) completely on the free tier, and how to **keep the service awake** so it never goes to sleep.

---

## 1. How the Anti-Sleep Technique Works

### The Problem on Render Free Tier:
- On Render's Free Plan, web services automatically go to sleep after **15 minutes of inactivity** (no incoming HTTP web requests).
- When a user opens your site after it has gone to sleep, they experience a **50-second cold start delay**.

### The Solution:
We implemented a **two-layer anti-sleep defense**:

1. **Built-in Keep-Alive Background Service (Automatic)**:
   - On Render, the system automatically detects the `RENDER_EXTERNAL_URL` environment variable (e.g. `https://carbonbill.onrender.com`).
   - Every **12 minutes** (before Render's 15-minute countdown finishes), our built-in `.NET` background service sends a lightweight HTTP ping to its own `/health` endpoint.
   - Render's ingress router registers this as active traffic and resets the 15-minute idle timer back to zero.
   - Result: **The app stays awake 24/7 automatically.**

2. **External Free Uptime Pinger (Recommended Redundant Backup)**:
   - Services like [UptimeRobot](https://uptimerobot.com) or [Cron-job.org](https://cron-job.org) can ping your URL every 5 or 10 minutes from the outside.
   - Setting this up takes less than 1 minute and ensures your service remains awake even across server redeploys.

---

## 2. Deploying to Render (2 Easy Methods)

### Method A: One-Click Render Blueprint (Recommended)

1. **Push your code to GitHub** (we have already provided `render.yaml` and `Dockerfile` in the root).
2. Go to [dashboard.render.com](https://dashboard.render.com) and log in.
3. Click the **"New +"** button at the top right and select **"Blueprint"**.
4. Connect your GitHub repository: `SHOEBILL04/CarbonBill`.
5. Render will automatically detect [`render.yaml`](file:///home/rakibul/Projects/CarbonBill/render.yaml) and configure:
   - Service Type: **Web Service (Docker)**
   - Region: **Singapore** (lowest latency for Bangladesh)
   - Plan: **Free**
   - Health check path: `/health`
6. Click **"Apply"**.
7. Render will build the container (both the React frontend and .NET 8 backend) and provide you with a live URL:
   `https://carbonbill.onrender.com`

---

### Method B: Manual Web Service Setup

If you prefer to configure it manually on the Render dashboard:
1. Click **"New +"** ➔ **"Web Service"**.
2. Choose **"Build and deploy from a Git repository"**.
3. Select your `CarbonBill` repository.
4. Fill in the following settings:
   - **Name**: `carbonbill` (or any name you like)
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Language / Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Free`
5. Under **Advanced ➔ Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `ASPNETCORE_ENVIRONMENT` | `Production` | Enables production mode |
   | `OCR_PROVIDER` | `Tesseract` | Enables OCR for bills and slips |
   | `KEEP_ALIVE_INTERVAL_MINUTES` | `12` | Pings itself every 12 mins to stay awake |
   | `GROQ_API_KEY` | *(your-key)* | Optional: For AI decarbonization briefs |
6. Under **Advanced ➔ Health Check Path**, set:
   `/health`
7. Click **"Create Web Service"**.

---

## 3. Setting Up 100% Guaranteed Uptime with UptimeRobot (Free)

To ensure Render never goes to sleep under any circumstance:

1. Create a free account at [UptimeRobot.com](https://uptimerobot.com).
2. Click **"+ Add New Monitor"**.
3. Choose:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `CarbonBill Render`
   - **URL (or IP)**: `https://your-carbonbill-service.onrender.com/health`
   - **Monitoring Interval**: `Every 5 minutes`
4. Click **"Create Monitor"**.

Now, UptimeRobot will ping your `/health` route every 5 minutes. Render will see constant incoming traffic and will **never put your free server to sleep**!

---

## 4. What URL will Users See?

Once deployed, your single Render URL serves everything:
- **Web App**: `https://your-app.onrender.com/` (React PWA frontend)
- **Floor Camera Capture**: `https://your-app.onrender.com/?mode=floor`
- **Swagger Documentation**: `https://your-app.onrender.com/swagger`
- **Hangfire Background Jobs**: `https://your-app.onrender.com/hangfire`
- **Health Check**: `https://your-app.onrender.com/health`
