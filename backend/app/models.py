from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ARRAY, JSON
from datetime import datetime, timezone
try:
    from .database import Base
except (ImportError, ValueError):
    try:
        from app.database import Base
    except (ImportError, ValueError):
        from database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    farmer_name = Column(String, nullable=False)
    farmer_phone = Column(String, nullable=True)
    species = Column(String, nullable=False)
    symptoms = Column(ARRAY(String).with_variant(JSON, "sqlite"), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    mortality_status = Column(Boolean, default=False)
    status = Column(String, default="pending")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    village = Column(String, nullable=True)
    district = Column(String, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "report_id": self.id,
            "farmer_name": self.farmer_name,
            "farmer_phone": self.farmer_phone,
            "species": self.species,
            "symptoms": self.symptoms or [],
            "latitude": self.latitude,
            "longitude": self.longitude,
            "mortality_status": self.mortality_status,
            "status": self.status,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "village": self.village,
            "district": self.district,
            "success": True,
        }

class Outbreak(Base):
    __tablename__ = "outbreaks"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Float, default=10.0)
    species = Column(String, nullable=False)
    farmer_name = Column(String, nullable=False)
    symptoms = Column(String, nullable=True)
    status = Column(String, default="flagged_high_risk")

    def to_dict(self):
        return {
            "id": self.id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "radius_km": self.radius_km,
            "species": self.species,
            "farmer_name": self.farmer_name,
            "symptoms": self.symptoms,
            "status": self.status or "flagged_high_risk",
        }
