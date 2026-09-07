from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import math
from datetime import datetime, timedelta

app = FastAPI()

# Enable CORS so the Mobile App and Web Dashboard can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared Database Storage in Memory
reports_db = [
    { "id": 1, "farmer_name": "Ramesh Patel", "farmer_phone": "+91 98765 11111", "species": "Cattle 🐄", "symptoms": ["blisters", "high fever"], "latitude": 16.5062, "longitude": 80.6480, "mortality_status": False, "status": "flagged_high_risk", "timestamp": datetime.utcnow().isoformat() }
]
outbreaks_db = [
    { "id": 1, "latitude": 16.5062, "longitude": 80.6480, "species": "Cattle", "farmer_name": "Ramesh Patel", "symptoms": "blisters, high fever" }
]

def calculate_distance_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@app.post("/api/reports")
def submit_farmer_report(report: dict):
    report_id = len(reports_db) + 1
    report['id'] = report_id
    report['timestamp'] = datetime.utcnow().isoformat()
    
    # AI Risk Evaluation & Clustering
    high_risk_symptoms = ["blisters", "high fever", "sudden death", "skin sores"]
    is_high_risk = any(s.lower() in [hr.lower() for hr in report.get('symptoms', [])] for s in high_risk_symptoms)
    
    if is_high_risk or report.get('mortality_status'):
        report['status'] = 'flagged_high_risk'
    else:
        report['status'] = 'pending'
        
    reports_db.insert(0, report) # Add to top of list
    
    # Check for cluster (>= 3 cases within 10km)
    recent_time_limit = datetime.utcnow() - timedelta(hours=48)
    nearby_cases = 0
    for r in reports_db:
        if r['id'] != report_id and datetime.fromisoformat(r['timestamp']) > recent_time_limit:
            dist = calculate_distance_km(report['latitude'], report['longitude'], r['latitude'], r['longitude'])
            if dist <= 10.0 and r['status'] in ['flagged_high_risk', 'escalated_quarantine_alert']:
                nearby_cases += 1
                
    if nearby_cases >= 2:
        outbreak_cluster = {
            "id": len(outbreaks_db) + 1,
            "latitude": report['latitude'],
            "longitude": report['longitude'],
            "radius_km": 10.0,
            "species": report['species'],
            "farmer_name": report['farmer_name'],
            "symptoms": ", ".join(report.get('symptoms', []))
        }
        outbreaks_db.insert(0, outbreak_cluster)

    return {"success": True, "report_id": report_id}

@app.get("/api/reports")
def get_reports():
    return reports_db

@app.get("/api/outbreaks")
def get_outbreaks():
    return outbreaks_db

@app.post("/api/reports/{report_id}/escalate")
def escalate_report(report_id: int):
    for r in reports_db:
        if r['id'] == report_id:
            r['status'] = 'escalated_quarantine_alert'
            return {"success": True}
    return {"success": False, "error": "Report not found"}

@app.post("/api/seed")
def seed_data():
    return {"success": True, "message": "Telemetry active"}