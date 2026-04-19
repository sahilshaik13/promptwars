import asyncio
from fastapi import Request, Depends
from app.cache import AsyncTTLCache
from app.services.venue_simulator import simulator_engine
from app.models import VenueSnapshot

from app.services.auth import get_current_user

# Global lock to synchronize snapshot generation
_snapshot_lock = asyncio.Lock()

async def get_cache(request: Request) -> AsyncTTLCache:
    return request.app.state.cache

async def get_snapshot(
    request: Request,
    user_id: str = Depends(get_current_user),
    cache: AsyncTTLCache = Depends(get_cache)
) -> VenueSnapshot:
    async with _snapshot_lock:
        cache_key = f"venue_snapshot_{user_id}"
        cached = await cache.get(cache_key)
        if cached:
            return cached
        
        # Load this user's specific sandbox settings
        settings = request.app.state.user_settings.get(user_id, {
            "theme": "hackathon",
            "situation": "morning_entry",
            "severity": "medium"
        })
        
        # Generate from the engine using user-scoped settings
        snapshot = simulator_engine.generate_snapshot(**settings)
        await cache.set(cache_key, snapshot)
        return snapshot
