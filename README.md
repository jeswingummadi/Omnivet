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
