import datetime
from sqlalchemy.orm import Session
from app.models import User, Livestock, HealthReport
from app.triage import evaluate_triage

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).first():
        return {"message": "Database already contains data."}

    # 1. Create Users
    farmers = [
        User(name="Samuel Kiprotich", role="farmer", phone_number="+254-712-345678"),
        User(name="Fatima Al-Hassan", role="farmer", phone_number="+234-802-987654"),
        User(name="Rajesh Kumar", role="farmer", phone_number="+91-98765-43210"),
        User(name="Elena Rostova", role="farmer", phone_number="+7-916-555-0199"),
        User(name="Mateo Silva", role="farmer", phone_number="+55-11-9876-5432"),
        User(name="Dr. Sarah Mercer", role="vet", phone_number="+1-555-014-9988"),
    ]
    db.add_all(farmers)
    db.commit()

    # Refresh to get IDs
    for f in farmers:
        db.refresh(f)

    # 2. Create Livestock
    livestock_items = [
        Livestock(owner_id=farmers[0].id, species="Cattle", age=36, vaccination_status="partially_vaccinated"),
        Livestock(owner_id=farmers[0].id, species="Goat", age=18, vaccination_status="up_to_date"),
        Livestock(owner_id=farmers[1].id, species="Cattle", age=24, vaccination_status="unvaccinated"),
        Livestock(owner_id=farmers[2].id, species="Sheep", age=12, vaccination_status="up_to_date"),
        Livestock(owner_id=farmers[3].id, species="Swine", age=8, vaccination_status="unvaccinated"),
        Livestock(owner_id=farmers[4].id, species="Poultry", age=4, vaccination_status="unknown"),
    ]
    db.add_all(livestock_items)
    db.commit()

    for l in livestock_items:
        db.refresh(l)

    # 3. Create Sample Reports (Rural points across realistic surveillance regions)
    sample_reports = [
        {
            "livestock_id": livestock_items[0].id,
            "symptoms": '["blisters", "salivation", "lameness"]',
            "mortality": False,
            "lat": -1.2921,
            "lng": 36.8219,
            "hours_ago": 3
        },
        {
            "livestock_id": livestock_items[2].id,
            "symptoms": '["sudden death", "bloody discharge"]',
            "mortality": True,
            "lat": -1.3500,
            "lng": 36.7800,
            "hours_ago": 6
        },
        {
            "livestock_id": livestock_items[1].id,
            "symptoms": '["high fever", "loss of appetite", "shivering"]',
            "mortality": False,
            "lat": -1.1800,
            "lng": 36.9000,
            "hours_ago": 12
        },
        {
            "livestock_id": livestock_items[3].id,
            "symptoms": '["mild cough", "nasal discharge"]',
            "mortality": False,
            "lat": -1.2500,
            "lng": 36.8500,
            "hours_ago": 24
        },
        {
            "livestock_id": livestock_items[4].id,
            "symptoms": '["blisters", "high fever", "lethargy"]',
            "mortality": False,
            "lat": -1.3100,
            "lng": 36.7200,
            "hours_ago": 36
        }
    ]

    for item in sample_reports:
        status, _ = evaluate_triage(item["symptoms"], item["mortality"])
        report = HealthReport(
            livestock_id=item["livestock_id"],
            symptoms=item["symptoms"],
            mortality_status=item["mortality"],
            latitude=item["lat"],
            longitude=item["lng"],
            status=status,
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=item["hours_ago"])
        )
        db.add(report)

    db.commit()
    return {"message": "Sample rural surveillance data seeded successfully."}
