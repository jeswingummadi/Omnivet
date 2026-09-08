# 🐾 Animal Health Surveillance & Early Warning System (Livestock Sentinel)

A production-grade, rural-optimized full-stack surveillance system designed to detect, triage, and contain animal disease outbreaks in low-connectivity farming regions.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│             FARMERS IN LOW-CONNECTIVITY RURAL AREAS         │
│                                                             │
│   [ Expo React Native Mobile App ]                          │
│           │ (Offline Form Submission)                       │
│           ▼                                                 │
│   [ AsyncStorage Local Queue ]  <── If Offline              │
│           │                                                 │
│           │ Auto Background Sync On Reconnect               │
│           ▼                                                 │
└───────────┬─────────────────────────────────────────────────┘
            │ POST /api/reports
            ▼
┌─────────────────────────────────────────────────────────────┐
│                 FASTAPI SURVEILLANCE BACKEND                │
│                                                             │
│  [ Rule-Based Triage Engine ]                               │
│     - Scans for "blisters", "high fever", "sudden death"    │
│     - Auto-elevates status to "flagged_high_risk"           │
│                                                             │
│  [ PostgreSQL + PostGIS Extension ] (SRID: 4326 WGS84)      │
│     - Stores Users, Livestock, and Geolocation Reports      │
└───────────┬─────────────────────────────────────────────────┘
            │ GET /api/outbreaks & GET /api/reports
            ▼
┌─────────────────────────────────────────────────────────────┐
│           VETERINARY OFFICIALS & COMMAND DASHBOARD          │
│                                                             │
│   [ Next.js + React-Leaflet GIS Dashboard ]                 │
│     - Pulsing Red Outbreak Markers with 5km Quarantine Rings │
│     - Real-Time Triage Telemetry Table                      │
│     - One-Click Veterinary Escalation Trigger               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌐 Cloud Deployment: Taking OmniVet Online on Vercel & Neon

OmniVet is configured for modern serverless deployment on **Vercel** with a **Neon PostgreSQL** database.

```text
┌─────────────────────────────────────────────────────────────┐
│                 NEON SERVERLESS POSTGRESQL                  │
│                (PostgreSQL + PostGIS Cloud)                 │
│              DATABASE_URL on AWS us-east-2                  │
└──────────────────────────────▲──────────────────────────────┘
                               │ SQLAlchemy ORM
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               FASTAPI BACKEND ON VERCEL                     │
│                (Python Serverless Runtime)                  │
│   - Endpoints: /api/reports, /api/outbreaks, /api/health    │
│   - vercel.json with @vercel/python                         │
│   - Environment Variable: DATABASE_URL                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │ HTTPS API Calls                     │ Telemetry Stream
            ▼                                     ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│   EXPO MOBILE CLIENT    │          │    GIS WEB DASHBOARD    │
│  Direct Online Reports  │          │    Hosted on Vercel     │
│   (Expo Go / Android)   │          │  (Next.js 14 Dashboard) │
│  EXPO_PUBLIC_API_URL    │          │  NEXT_PUBLIC_API_URL    │
└─────────────────────────┘          └─────────────────────────┘
```

---

### Part 1: Push latest configurations to GitHub

```bash
git add .
git commit -m "Refactor mobile to direct online, connect Neon PostgreSQL, and configure Vercel"
git push origin main
```

---

### Part 2: Deploy Backend to Vercel

1. Log in to [vercel.com](https://vercel.com/new).
2. Click **Add New...** → **Project** and select `jeswingummadi/Omnivet`.
3. In Project Settings:
   - **Project Name**: `omnivet-backend`
   - **Framework Preset**: `Other`
   - **Root Directory**: Click Edit and select `backend`
4. In **Environment Variables**, add:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon connection string (e.g. `postgresql://neondb_owner:***@ep-still-salad-ayl8p78u-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require`)
5. Click **Deploy**.
6. Copy your live backend URL (e.g. `https://omnivet-backend.vercel.app`).
   - Test it: `https://omnivet-backend.vercel.app/api/health` returns `{"status":"healthy","database":"connected"}`.

*(Note: The backend can also be deployed to Render.com using the included `render.yaml` blueprint).*

---

### Part 3: Deploy GIS Command Dashboard to Vercel

1. In [vercel.com/new](https://vercel.com/new), import `jeswingummadi/Omnivet` as a second project.
2. In Project Settings:
   - **Project Name**: `omnivet-dashboard`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click Edit and select `web`
3. In **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your live backend URL from Part 2 (e.g. `https://omnivet-backend.vercel.app`)
4. Click **Deploy**.
5. Your live GIS Veterinary Command Center is now online!

---

### Part 4: Run Mobile App (Direct Online Submissions)

The mobile app submits reports directly to your live backend over the network (no offline caching or local queue delays).

1. In your mobile environment:
   ```bash
   cd mobile
   ```
2. Set your live backend URL in `mobile/.env` or shell:
   ```env
   EXPO_PUBLIC_API_URL=https://omnivet-backend.vercel.app
   ```
3. Launch Expo:
   ```bash
   npm run start
   ```
4. Scan the QR code with **Expo Go** (Android/iOS).
   - If connected to the internet: Submissions directly reach the Neon database and trigger instant triage alerts.
   - If disconnected: The app immediately alerts: *"Network Error: Please connect to the internet to submit your report."*

*(Optional Web Export: To host the mobile app frontend on Vercel as a PWA, run `npx expo export:web` and deploy the output directory).*

---

## 🚀 Quickstart: Running All Three Services Locally

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- *(Optional)* **Docker** (for PostGIS container)

---

### Step 1: Launch Database (PostgreSQL + PostGIS)

#### Option A: Using Docker (Recommended for PostGIS)
From the project root:
```bash
docker compose up -d
```
This starts PostgreSQL 15 with PostGIS on port `5432` with database `animal_surveillance`.

#### Option B: Automatic SQLite Fallback
If Docker is not installed, the backend automatically detects that PostgreSQL is offline and switches to a local SQLite database (`animal_surveillance.db`) with zero manual configuration required!

---

### Step 2: Launch Backend API (FastAPI)

```bash
cd backend

# Install dependencies (if not already installed)
python -m pip install -r requirements.txt

# Run the backend server
python run.py
```
- **API Server**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Automated Test Suite**: `python -m pytest tests/test_backend.py -v`

---

### Step 3: Launch Web Dashboard (Next.js & GIS Leaflet)

```bash
cd web

# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **💡 Zero-Build HTML Alternative**: You can also double-click and open `web/standalone-dashboard.html` directly in any web browser without running Node or Next.js! It communicates directly with the FastAPI backend on port 8000.

---

### Step 4: Launch Mobile App (Expo React Native)

```bash
cd mobile

# Start Expo dev server
npm run start
```
- **Web Browser Preview**: Press `w` in the terminal to test the mobile app in your web browser.
- **Physical Device**: Scan the displayed QR code with the **Expo Go** app (Android/iOS).
- **Android Emulator**: Press `a` in the terminal.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reports` | Ingests new health report. Runs **Rule-Based Triage Engine**. Auto-elevates status to `flagged_high_risk` if triggers matched. |
| `GET` | `/api/outbreaks` | Returns all flagged/high-risk outbreaks with GPS coordinates for Leaflet GIS plotting. |
| `GET` | `/api/reports` | Returns all incoming surveillance reports joined with farmer and livestock details for the data table. |
| `POST` | `/api/reports/{id}/escalate` | Action endpoint for veterinarians to escalate a case to `escalated_quarantine_alert`. |
| `POST` | `/api/seed` | Seeds realistic surveillance telemetry across rural regions for instant testing. |
| `GET` | `/api/health` | Health check endpoint. |

---

## 🛡️ Rule-Based Triage Engine

Every report submitted to `POST /api/reports` is evaluated by the triage engine (`backend/app/triage.py`):
1. **Trigger Symptoms**:
   - `"blisters"` (indicative of Foot-and-Mouth Disease, Vesicular Stomatitis)
   - `"high fever"` (indicative of African Swine Fever, Anthrax, Rinderpest-like diseases)
   - `"sudden death"` (indicative of acute septicemic outbreaks / Anthrax)
2. **Action**:
   - If any trigger is present (or `mortality_status: true`), status becomes `"flagged_high_risk"`.
   - The GIS web map plots a **pulsing red marker** and projects a **5-kilometer quarantine perimeter** around the GPS coordinates.
   - The web dashboard highlights the case in the real-time triage table with an active **"Escalate"** button.

---

## 📱 Offline-First Mobile Logic

In rural zones with spotty 2G/3G connectivity:
1. When farmer clicks **"SUBMIT HEALTH REPORT"**:
   - App checks active internet connectivity (`NetInfo`).
   - **If Online**: Immediately posts to `POST /api/reports`.
   - **If Offline**: Stores report in `AsyncStorage` (`@pending_animal_health_reports`) with a local timestamp and shows `"Saved offline. Will sync when connected."` toast.
2. **Automatic Synchronization**:
   - On app startup, `syncService.js` drains the offline storage queue.
   - When the phone transitions from offline to online, a network event listener automatically pushes all pending reports to the backend.

---

## 🧪 Testing

Run backend tests:
```bash
cd backend
python -m pytest tests/test_backend.py -v
```
Verify:
- 7/7 unit and integration tests passing.
- Triage engine trigger validations.
- API ingestion and quarantine escalation lifecycle.
