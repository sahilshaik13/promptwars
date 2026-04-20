from fastapi import APIRouter, HTTPException, Path, Depends
from typing import Annotated
from app.models import WaitTimePrediction
from app.dependencies import get_snapshot, VenueSnapshot
from app.services.wait_predictor import predict_wait

router = APIRouter(tags=["predict"])

@router.get("/api/predict/{zone_id}", response_model=WaitTimePrediction)
async def predict_zone_wait(
    zone_id: Annotated[str, Path(pattern=r"^[a-z0-9_]+$")],
    snapshot: VenueSnapshot = Depends(get_snapshot)
):
    """
    Predicts the wait time for a specific zone based on the latest venue snapshot.
    
    Args:
        zone_id (str): Canonical identifier of the zone.
        snapshot (VenueSnapshot): Injected latest venue state.
        
    Returns:
        WaitTimePrediction: ML-derived forecast including confidence and trend.
        
    Raises:
        HTTPException: 404 if the zone_id does not exist in the snapshot.
    """
    zone = next((z for z in snapshot.zones if z.zone_id == zone_id), None)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
        
    return predict_wait(zone)
