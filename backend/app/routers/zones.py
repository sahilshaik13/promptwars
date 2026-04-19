from fastapi import APIRouter, Depends, Body, Request
from app.models import VenueSnapshot
from app.dependencies import get_cache, get_snapshot
from app.services.auth import get_current_user

from app.services.venue_simulator import simulator_engine
from app.cache import AsyncTTLCache

router = APIRouter(tags=["zones"])

@router.get("/api/zones", response_model=VenueSnapshot)
async def get_zones(
    snapshot: VenueSnapshot = Depends(get_snapshot),
    user_id: str = Depends(get_current_user)
):
    return snapshot

@router.post("/api/simulate")
async def update_simulation(
    request: Request,
    theme: str = Body(...),
    situation: str = Body(...),
    severity: str = Body(...),
    user_id: str = Depends(get_current_user)
):
    """Overrides the simulation environment FOR THIS USER'S SANDBOX."""
    # Update the registry for the individual user
    registry = request.app.state.user_settings
    registry[user_id] = {
        "theme": theme,
        "situation": situation,
        "severity": severity
    }
    
    # Invalidate per-user cache
    cache: AsyncTTLCache = request.app.state.cache
    await cache.invalidate(f"venue_snapshot_{user_id}")
    
    return {"status": "success", "user_id": user_id, "theme": theme, "situation": situation, "severity": severity}
