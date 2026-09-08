from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import math
from datetime import datetime, timedelta, timezone

try:
    from .database import engine, Base, get_db
    from .models import Report, Outbreak
except (ImportError, ValueError):
    try:
        from app.database import engine, Base, get_db
        from app.models import Report, Outbreak
    except (ImportError, ValueError):
        from database import engine, Base, get_db
        from models import Report, Outbreak

# Auto-create tables in Neon PostgreSQL on startup
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create tables on import: {e}")

app = FastAPI(title="OmniVet Health Surveillance API")

# Enable CORS so the Mobile App and Web Dashboard can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_distance_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# ==========================================
# 1. ROOT & HEALTH ENDPOINTS
# ==========================================
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "OmniVet API",
        "database": "Neon PostgreSQL",
        "message": "OmniVet Surveillance Backend is running live on Neon PostgreSQL!"
    }

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        report_count = db.query(Report).count()
        return {
            "status": "healthy",
            "service": "OmniVet API",
            "database": "connected",
            "reports_count": report_count,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {
            "status": "degraded",
            "database_error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

# ==========================================
# 2. SURVEILLANCE & TRIAGE ENDPOINTS
# ==========================================
@app.post("/api/reports", status_code=201)
def submit_farmer_report(report_data: dict, db: Session = Depends(get_db)):
    # 1. AI Risk Evaluation
    high_risk_symptoms = ["blisters", "high fever", "sudden death", "skin sores"]
    symptoms_list = report_data.get('symptoms', [])
    if isinstance(symptoms_list, str):
        symptoms_list = [s.strip() for s in symptoms_list.split(',') if s.strip()]

    is_high_risk = any(s.lower() in [hr.lower() for hr in symptoms_list] for s in high_risk_symptoms) or bool(report_data.get('mortality_status', False))
    status_flag = 'flagged_high_risk' if is_high_risk else 'pending'

    lat = float(report_data.get('latitude', 0.0))
    lng = float(report_data.get('longitude', 0.0))

    # 2. Save to Neon PostgreSQL Database
    new_report = Report(
        farmer_name=report_data.get('farmer_name', 'Anonymous Farmer'),
        farmer_phone=report_data.get('farmer_phone', ''),
        species=report_data.get('species', 'Cattle'),
        symptoms=symptoms_list,
        latitude=lat,
        longitude=lng,
        mortality_status=bool(report_data.get('mortality_status', False)),
        status=status_flag,
        village=report_data.get('village'),
        district=report_data.get('district'),
        timestamp=datetime.now(timezone.utc)
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # 3. Check for Nearby Outbreak Clusters (10km radius within 48h)
    recent_time_limit = datetime.now(timezone.utc) - timedelta(hours=48)
    recent_reports = db.query(Report).filter(
        Report.id != new_report.id,
        Report.timestamp >= recent_time_limit,
        Report.status.in_(['flagged_high_risk', 'escalated_quarantine_alert'])
    ).all()

    nearby_cases = 0
    for r in recent_reports:
        dist = calculate_distance_km(new_report.latitude, new_report.longitude, r.latitude, r.longitude)
        if dist <= 10.0:
            nearby_cases += 1

    if nearby_cases >= 2:
        outbreak_cluster = Outbreak(
            latitude=new_report.latitude,
            longitude=new_report.longitude,
            radius_km=10.0,
            species=new_report.species,
            farmer_name=new_report.farmer_name,
            symptoms=", ".join(symptoms_list),
            status="flagged_high_risk"
        )
        db.add(outbreak_cluster)
        db.commit()
        db.refresh(outbreak_cluster)

    # 4. Return Full Payload Structure
    return {
        "success": True,
        "id": new_report.id,
        "report_id": new_report.id,
        "status": new_report.status,
        "latitude": new_report.latitude,
        "longitude": new_report.longitude,
        "data": {
            "id": new_report.id,
            "farmer_name": new_report.farmer_name,
            "farmer_phone": new_report.farmer_phone,
            "species": new_report.species,
            "symptoms": new_report.symptoms or [],
            "latitude": new_report.latitude,
            "longitude": new_report.longitude,
            "mortality_status": new_report.mortality_status,
            "status": new_report.status,
            "village": new_report.village,
            "district": new_report.district,
            "timestamp": new_report.timestamp.isoformat() if new_report.timestamp else None
        }
    }

@app.get("/api/reports")
def get_reports(db: Session = Depends(get_db)):
    db.expire_all()
    reports = db.query(Report).order_by(Report.id.desc()).all()
    if not reports:
        # Seed initial telemetry record if table is currently empty
        seed = Report(
            farmer_name="Ramesh Patel",
            farmer_phone="+91 98765 11111",
            species="Cattle 🐄",
            symptoms=["blisters", "high fever"],
            latitude=16.5062,
            longitude=80.6480,
            mortality_status=False,
            status="flagged_high_risk",
            village="Amaravati",
            district="Guntur",
            timestamp=datetime.now(timezone.utc)
        )
        db.add(seed)
        db.commit()
        db.refresh(seed)
        reports = [seed]
    return [r.to_dict() for r in reports]

@app.get("/api/outbreaks")
def get_outbreaks(db: Session = Depends(get_db)):
    db.expire_all()
    outbreaks = db.query(Outbreak).order_by(Outbreak.id.desc()).all()
    if not outbreaks:
        # Seed initial outbreak record if table is currently empty
        seed_outbreak = Outbreak(
            latitude=16.5062,
            longitude=80.6480,
            radius_km=10.0,
            species="Cattle",
            farmer_name="Ramesh Patel",
            symptoms="blisters, high fever",
            status="flagged_high_risk"
        )
        db.add(seed_outbreak)
        db.commit()
        db.refresh(seed_outbreak)
        outbreaks = [seed_outbreak]
    return [o.to_dict() for o in outbreaks]

@app.post("/api/reports/{report_id}/escalate")
def escalate_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if report:
        report.status = 'escalated_quarantine_alert'
        db.commit()
        return {"success": True, "status": "escalated_quarantine_alert"}
    return {"success": False, "error": "Report not found"}

@app.post("/api/seed")
def seed_data(db: Session = Depends(get_db)):
    seed_report = Report(
        farmer_name="Ramesh Patel",
        farmer_phone="+91 98765 11111",
        species="Cattle 🐄",
        symptoms=["blisters", "high fever"],
        latitude=16.5062,
        longitude=80.6480,
        mortality_status=False,
        status="flagged_high_risk",
        village="Amaravati",
        district="Guntur",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(seed_report)
    db.commit()
    return {"success": True, "message": "Telemetry active in Neon DB"}