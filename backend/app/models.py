import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    role = Column(String(50), nullable=False, default="farmer")  # farmer, vet, admin
    phone_number = Column(String(30), nullable=False, unique=True, index=True)

    livestock = relationship("Livestock", back_populates="owner", cascade="all, delete-orphan")


class Livestock(Base):
    __tablename__ = "livestock"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    species = Column(String(80), nullable=False)  # Cattle, Goat, Sheep, Swine, Poultry, etc.
    age = Column(Integer, nullable=True)          # Age in months
    vaccination_status = Column(String(50), default="unknown")  # up_to_date, partially_vaccinated, unvaccinated, unknown

    owner = relationship("User", back_populates="livestock")
    reports = relationship("HealthReport", back_populates="livestock", cascade="all, delete-orphan")


class HealthReport(Base):
    __tablename__ = "health_reports"

    id = Column(Integer, primary_key=True, index=True)
    livestock_id = Column(Integer, ForeignKey("livestock.id"), nullable=False)
    symptoms = Column(Text, nullable=False)  # JSON or comma-separated string
    mortality_status = Column(Boolean, default=False, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, flagged, flagged_high_risk, resolved
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    livestock = relationship("Livestock", back_populates="reports")
