from pydantic import BaseModel, ConfigDict, Field, field_validator
from enum import Enum
from datetime import datetime
from typing import List, Optional

class ZoneType(str, Enum):
    """Canonical zone types in the Hitex venue."""
    gate = "gate"
    concession = "concession"
    restroom = "restroom"
    seating = "seating"

class SimulationSettings(BaseModel):
    """Sandbox simulation parameters for user-specific orchestration."""
    model_config = ConfigDict(populate_by_name=True)
    
    user_id: str = Field(..., description="Unique identifier for the user session")
    theme: str = Field(default="hackathon", description="Simulation theme (e.g., concert, tech_expo)")
    situation: str = Field(default="morning_entry", description="Current venue situation (e.g., peak_flow)")
    severity: str = Field(default="medium", description="Congestion severity level")

class ZoneStatus(BaseModel):
    """Live state of a specific venue zone."""
    zone_id: str = Field(..., description="Canonical ID of the zone")
    name: str = Field(..., description="Human-readable name of the zone")
    type: ZoneType = Field(..., description="Category of the zone")
    capacity: int = Field(..., ge=0, description="Maximum safe occupancy")
    current_count: int = Field(..., ge=0, description="Current number of visitors")
    crowd_level: float = Field(..., ge=0.0, le=1.0, description="Density percentage (0.0 - 1.0)")
    status: str = Field(..., description="Status label (low, medium, high, critical)")
    predicted_wait_time: float = Field(default=0.0, description="Estimated wait time in minutes")
    trend: str = Field(default="stable", description="Trend direction: rising, falling, stable")
    confidence: float = Field(default=1.0, description="Prediction model confidence score")
    lat: Optional[float] = Field(None, description="Latitude coordinate")
    lng: Optional[float] = Field(None, description="Longitude coordinate")

    @field_validator("crowd_level")
    @classmethod
    def validate_crowd_range(cls, v: float) -> float:
        if not 0.0 <= v <= 1.0:
            raise ValueError("crowd_level must be between 0.0 and 1.0")
        return v

class Particle(BaseModel):
    """Low-fidelity spatial indicator for heatmaps and gravity views."""
    id: str = Field(..., description="Unique particle ID")
    x: float = Field(..., description="Longitude coordinate")
    y: float = Field(..., description="Latitude coordinate")
    type: str = Field(default="visitor", description="Particle category (e.g., biker, admin)")

class VenueSnapshot(BaseModel):
    """High-fidelity snapshot of the entire venue intelligence state."""
    snapshot_time: datetime = Field(default_factory=datetime.utcnow)
    match_minute: int = Field(default=0)
    match_phase: str = Field(..., description="Current simulation phase label")
    zones: List[ZoneStatus] = Field(..., description="List of all zone states")
    particles: List[Particle] = Field(default_factory=list, description="List of dynamic spatial particles")

class WaitTimePrediction(BaseModel):
    """ML-derived wait time forecast for a specific zone."""
    zone_id: str = Field(..., description="Canonical ID of the zone")
    predicted_wait_minutes: int = Field(..., ge=0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    trend: str = Field(..., description="Rising, falling, or stable")
    recommendation: str = Field(..., description="AI-driven action recommendation")
    predicted_at: datetime = Field(default_factory=datetime.utcnow)
