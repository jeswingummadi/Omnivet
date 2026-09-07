from typing import Optional, List, Union
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator
import json

class UserBase(BaseModel):
    name: str
    role: str = "farmer"  # farmer, vet, admin
    phone_number: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class LivestockBase(BaseModel):
    species: str
    age: Optional[int] = None
    vaccination_status: Optional[str] = "unknown"

class LivestockCreate(LivestockBase):
    owner_id: int

class LivestockResponse(LivestockBase):
    id: int
    owner_id: int
    model_config = ConfigDict(from_attributes=True)


class HealthReportCreate(BaseModel):
    livestock_id: Optional[int] = None
    species: Optional[str] = "Cattle"
    farmer_name: Optional[str] = "Rural Farmer"
    farmer_phone: Optional[str] = "000-000-0000"
    symptoms: Union[str, List[str]]
    mortality_status: bool = False
    latitude: float
    longitude: float
    status: Optional[str] = "pending"

    @field_validator("symptoms", mode="before")
    def format_symptoms(cls, v):
        if isinstance(v, list):
            return json.dumps(v)
        return str(v)


class HealthReportResponse(BaseModel):
    id: int
    livestock_id: int
    symptoms: str
    mortality_status: bool
    latitude: float
    longitude: float
    status: str
    timestamp: datetime
    species: Optional[str] = None
    farmer_name: Optional[str] = None
    farmer_phone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OutbreakMarker(BaseModel):
    id: int
    latitude: float
    longitude: float
    status: str
    species: str
    symptoms: str
    mortality_status: bool
    farmer_name: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class EscalateReportRequest(BaseModel):
    notes: Optional[str] = "Escalated by veterinary official"
