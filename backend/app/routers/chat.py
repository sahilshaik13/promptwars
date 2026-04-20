"""
/api/chat  — Gemini-powered venue assistant with Graph RAG + Dijkstra navigation.
"""

import re
import time
import asyncio
import structlog
from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.cache import AsyncTTLCache
from app.dependencies import get_cache, get_snapshot
from app.services.auth import get_current_user
from app.services.graph_builder import build_venue_graph, compute_all_fastest_routes
from app.services.gemini_client import ask_gemini
from app.services.supabase_client import save_chat_message, get_chat_history

log = structlog.get_logger(__name__)
router = APIRouter(tags=["chat"])

_HTML_RE = re.compile(r"<[^>]+>")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    session_id: str = Field(..., min_length=4, max_length=64)

    @field_validator("message")
    @classmethod
    def sanitise_message(cls, v: str) -> str:
        return _HTML_RE.sub("", v).strip()

    @field_validator("session_id")
    @classmethod
    def validate_session(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_\-]+$", v):
            raise ValueError("session_id must be alphanumeric")
        return v


class ChatResponse(BaseModel):
    reply: str
    zones_referenced: list[str] = []
    response_time_ms: int = 0


@router.post("/api/chat", response_model=ChatResponse, summary="Ask the Gemini venue navigator")
async def chat(
    request: Request,
    body: ChatRequest,
    snapshot = Depends(get_snapshot),
    user_id: str = Depends(get_current_user),
) -> ChatResponse:
    t0 = time.time()

    # Get live snapshot and build graph
    venue_graph = build_venue_graph(snapshot)

    # Dijkstra: pre-compute fastest routes for all origin→destination pairs
    fastest_routes = compute_all_fastest_routes(venue_graph)

    # Multi-turn chat history from Supabase
    history = await get_chat_history(user_id, body.session_id, limit=6)

    # Call Gemini with alias resolution + route table context
    try:
        reply = await ask_gemini(
            message=body.message,
            venue_graph=venue_graph,
            fastest_routes=fastest_routes,
            chat_history=history,
        )
    except Exception as exc:
        log.error("gemini_failed", session_id=body.session_id, user_id=user_id, error=str(exc))
        raise HTTPException(status_code=503, detail="AI assistant temporarily unavailable")

    latency = int((time.time() - t0) * 1000)
    log.info("chat_response_sent", user_id=user_id, latency_ms=latency, session_id=body.session_id)

    # Persist the exchange asynchronously
    asyncio.create_task(save_chat_message(user_id, body.session_id, body.message, reply))

    return ChatResponse(
        reply=reply,
        zones_referenced=[],  # future: parse from Gemini response
        response_time_ms=latency,
    )
