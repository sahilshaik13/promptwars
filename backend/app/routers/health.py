from fastapi import APIRouter, Response
import time
from app.services.venue_simulator import simulator_engine
from app.services.supabase_client import get_supabase

router = APIRouter(tags=["health"])
_startup_time = time.time()

@router.get("/health")
async def health_check(response: Response):
    # Database
    db_status = "ok"
    try:
        client = get_supabase()
        if not client:
            db_status = "error"
    except Exception:
        db_status = "error"

    # Simulator — call generate_snapshot() as a liveness probe
    sim_status = "ok"
    try:
        snap = simulator_engine.generate_snapshot()
        if not snap or not snap.zones:
            sim_status = "error"
    except Exception:
        sim_status = "error"

    # ML Model
    model_status = "ok"
    try:
        from app.services.prediction_service import prediction_service
        if not prediction_service.model:
            model_status = "error"
    except Exception:
        model_status = "error"

    health = {
        "status": "ok",
        "uptime_seconds": int(time.time() - _startup_time),
        "subsystems": {
            "database": db_status,
            "simulator": sim_status,
            "prediction_model": model_status
        }
    }

    if any(v == "error" for v in health["subsystems"].values()):
        health["status"] = "degraded"

    return health

@router.get("/api/metrics")
async def metrics():
    return {"uptime_seconds": int(time.time() - _startup_time)}
