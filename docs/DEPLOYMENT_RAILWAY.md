# Deploying CarbonBill to Railway.app (Complete Guide)

This guide shows you how to deploy the entire **CarbonBill** platform to [Railway.app](https://railway.com) with all features enabled (Vite React PWA Frontend, .NET 8 Web API, Tesseract OCR with Bengali support, Groq Vision, Gemini Decarbonization AI, and Persistent Storage).

---

## 1. Why Railway is Recommended for CarbonBill

Compared to Render's free tier, Railway provides:
- **Full CPU & Memory**: Unlike Render's 0.1 vCPU throttle, Railway gives you full container CPU power. OCR and AI image extraction run in seconds.
- **Persistent Volume Support**: Attaching a volume to `/data` ensures your SQLite database (`carbonbill.db`), Hangfire jobs, and uploaded bill photos are permanently saved across redeployments.
- **No Sleep / No Cold Starts**: Your application responds instantly 24/7 without 50-second sleep wake-ups.
- **Automated HTTPS & Custom Domains**: Railway gives you a free SSL domain (e.g. `https://carbonbill-production.up.railway.app`) or lets you attach your own domain with 1 click.

---

## 2. Step-by-Step Deployment Instructions

### Step 1: Push Your Code to GitHub
Ensure you have the latest code with `Dockerfile` and `railway.json`:
```bash
git push origin main
```

---

### Step 2: Create a New Project in Railway

1. Go to [railway.com](https://railway.com) and log in with GitHub.
2. Click **"+ New Project"**.
3. Select **"Deploy from GitHub repo"**.
4. Choose your repository: `SHOEBILL04/CarbonBill`.
5. Railway will detect [`railway.json`](file:///home/rakibul/Projects/CarbonBill/railway.json) and use the unified multi-stage [`Dockerfile`](file:///home/rakibul/Projects/CarbonBill/Dockerfile).

---

### Step 3: Add a Persistent Volume (Important for Data Persistence)

By default, containers lose local files when redeployed. To keep your database and uploaded bills permanent:
1. In your Railway project canvas, click on your **CarbonBill** service.
2. Go to the **"Volumes"** tab.
3. Click **"+ Add Volume"**.
4. Set the **Mount Path** to:
   ```text
   /data
   ```
5. Click **"Add"**.
*(All SQLite database files, Hangfire history, and uploaded bill documents will now be permanently preserved.)*

---

### Step 4: Configure Environment Variables

In your Railway service, go to the **"Variables"** tab and add the following:

| Variable Name | Recommended Value | Description |
| :--- | :--- | :--- |
| `ASPNETCORE_ENVIRONMENT` | `Production` | Enables production mode and static SPA serving |
| `JWT__SECRET` | `odXmKcpLtfh5PYT7yM78AjykANQkpk2zcWzSLcTR1jk=` *(or generate a random 32+ char key)* | Secret key for secure token authentication |
| `GROQ_API_KEY` | *(your Groq API key)* | **Required for AI Vision bill extraction** (Free at [console.groq.com](https://console.groq.com)) |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | High-accuracy text parsing model |
| `GROQ_VISION_MODEL` | `qwen/qwen3.8-27b` | Multimodal visual layout extraction model |
| `GEMINI_API_KEY` | *(your Gemini API key)* | **Required for Decarbonization AI Advisor** (Free at [aistudio.google.com](https://aistudio.google.com)) |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Active Google Gemini reasoning model |
| `OCR_PROVIDER` | `Tesseract` | Enables local bilingual Bengali/English OCR |
| `LANGSMITH_API_KEY` | *(optional)* | Tracing and observability on LangChain LangSmith |

> [!TIP]
> **Railway Raw Editor**: You can click **"Raw Editor"** in the Variables tab and paste the contents of [`.env.example`](file:///home/rakibul/Projects/CarbonBill/.env.example) directly!

---

### Step 5: Generate a Public Domain

1. In your Railway service, go to the **"Settings"** tab.
2. Scroll to the **"Networking"** section.
3. Under **Public Networking**, click **"Generate Domain"**.
4. Railway will assign an instant HTTPS domain, e.g.:
   `https://carbonbill-production.up.railway.app`

---

## 3. Verifying Your Live Deployment

Once the build finishes (usually 2–3 minutes):

1. **Main Web App**:
   Visit `https://<your-railway-url>/` — The React PWA app shell and login screen will load.
2. **Floor Camera Capture PWA**:
   Visit `https://<your-railway-url>/?mode=floor` (or log in as Floor User).
3. **Review & Verification Workspace**:
   Visit `https://<your-railway-url>/login?mode=review`.
4. **Interactive Swagger API Documentation**:
   Visit `https://<your-railway-url>/swagger`.
5. **Hangfire Background Job Dashboard**:
   Visit `https://<your-railway-url>/hangfire`.
6. **Health Check Endpoint**:
   Visit `https://<your-railway-url>/health` (Returns `Healthy`).

---

## 4. Default Demo Accounts

The database automatically seeds pilot demo accounts:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Floor / Camera Capture** | `jahid@ecofab.com` | `Pilot2026!` | Floor mobile capture PWA (`/?mode=floor`) |
| **Accounts / Reviewer** | `rahim@ecofab.com` | `Pilot2026!` | Two-pane Review & Verification workspace |
| **Sustainability Lead** | `fatima@ecofab.com` | `Pilot2026!` | Executive dashboard, analytics, PDF exports |
| **Platform Administrator** | `admin@carbonbill.com` | `Pilot2026!` | Tenant management, emission factors, audit logs |

---

## 5. Troubleshooting & FAQ

### Q: Why does the first deployment take 2–3 minutes?
The Dockerfile uses a unified multi-stage build that:
1. Installs Node.js packages and builds the optimized Vite React PWA bundle.
2. Restores .NET 8 packages and publishes the backend.
3. Installs Debian native packages (`tesseract-ocr`, `tesseract-ocr-ben`, `tesseract-ocr-eng`, `sqlite3`).
Subsequent builds will be much faster because Railway caches the Docker layers.

### Q: Does Railway sleep after inactivity?
No! Unlike Render free tier, Railway containers run continuously. You do not need to configure external pingers.

### Q: Where are files stored if I don't add a Volume?
They are stored inside the container in `/data`. The application will work normally, but if you redeploy the container, any newly uploaded files since the last deployment will reset to the initial seed state. Attaching a `/data` volume makes your storage permanent.
