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
   | `OCR_PROVIDER` | `Tesseract` | Enables bilingual Bengali/English OCR |
   | `KEEP_ALIVE_INTERVAL_MINUTES` | `12` | Pings itself every 12 mins to stay awake |
   | `GROQ_API_KEY` | *(your-key)* | **AI Feature**: Powers Groq Vision & LLM bill extraction |
   | `GEMINI_API_KEY` | *(your-key)* | **AI Feature**: Powers Gemini 2.0 decarbonization advisor |
   | `LANGSMITH_API_KEY` | *(your-key)* | Optional: LLM observability & prompt tracing |
6. Under **Advanced ➔ Health Check Path**, set:
   `/health`
7. Click **"Create Web Service"**.

---

## 3. How to Enable All AI Features on Render (100% Free)

CarbonBill includes three primary AI capabilities:

### A. Bilingual OCR (Bengali & English Utility Bills) - Automatic & Free
- **What it does**: Scans paper electricity bills (BPDB, DESCO, DPDC), gas bills (Titas), fuel challans, and meter photos.
- **Cost**: **$0.00 (100% Free)**.
- **Setup**: Zero setup required! We already installed native `tesseract-ocr`, `tesseract-ocr-eng`, and `tesseract-ocr-ben` inside the Docker image.

### B. Groq Vision & LLM Bill Extraction (`GROQ_API_KEY`)
- **What it does**: Parses the visual layout and text of bills to automatically extract vendor names, consumed units (kWh / m3 / litres), net payable BDT, meter numbers, power factor penalties, and confidence scores.
- **Models Used**: `llama-3.2-11b-vision-preview` (multimodal vision) and `llama-3.3-70b-versatile` (instant semantic parser).
- **Cost**: **Free tier available at Groq**.
- **How to get key**:
  1. Go to [console.groq.com](https://console.groq.com) and create a free account.
  2. Navigate to **API Keys** ➔ **Create API Key**.
  3. Copy your key (starts with `gsk_...`).
  4. In Render Dashboard ➔ Your Service ➔ **Environment** ➔ Add `GROQ_API_KEY`.

### C. Google Gemini Decarbonization Advisor (`GEMINI_API_KEY`)
- **What it does**: Automatically analyzes your factory's real equipment, electricity tariffs, and emissions to generate tailored engineering recommendations (e.g., VFD compressor inverters, LED retrofit, rooftop solar PV) with exact BDT savings and bilingual English/Bengali implementation roadmaps.
- **Model Used**: `gemini-2.0-flash` (with automatic fallback to `gemini-1.5-flash`).
- **Cost**: **Free tier available in Google AI Studio**.
- **How to get key**:
  1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) and log in with your Google account.
  2. Click **Create API Key**.
  3. Copy your key (starts with `AIzaSy...`).
  4. In Render Dashboard ➔ Your Service ➔ **Environment** ➔ Add `GEMINI_API_KEY`.

### D. LangSmith Tracing & Observability (`LANGSMITH_API_KEY`) - Optional
- **What it does**: Monitors LLM token counts, execution latency, and extraction success rates in real-time.
- **How to get key**: Sign up at [smith.langchain.com](https://smith.langchain.com) ➔ Settings ➔ API Keys.
- Add `LANGSMITH_API_KEY` under Environment Variables in Render.

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
