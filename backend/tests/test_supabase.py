import pytest
from unittest.mock import MagicMock, patch
from app.services.supabase_client import get_supabase, save_chat_message, get_chat_history, save_zone_snapshot, log_wait_prediction

@pytest.fixture
def mock_supabase():
    with patch("app.services.supabase_client.create_client") as mock:
        client = MagicMock()
        mock.return_value = client
        yield client

def test_get_supabase_singleton(mock_supabase):
    """Verify that get_supabase returns a singleton client."""
    from app.services import supabase_client
    supabase_client._client = None # Reset
    
    with patch("app.config.settings.supabase_url", "http://test.com"), \
         patch("app.config.settings.supabase_anon_key", "test_key"):
        c1 = get_supabase()
        c2 = get_supabase()
        assert c1 == c2
        assert c1 == mock_supabase

@pytest.mark.asyncio
async def test_save_chat_message(mock_supabase):
    """Verify chat message insertion logic."""
    mock_table = mock_supabase.table.return_value
    mock_insert = mock_table.insert.return_value
    
    await save_chat_message("u1", "s1", "user", "hello")
    
    mock_supabase.table.assert_called_with("chat_messages")
    mock_insert.assert_called()

@pytest.mark.asyncio
async def test_get_chat_history(mock_supabase):
    """Verify chat history retrieval and ordering."""
    mock_table = mock_supabase.table.return_value
    mock_select = mock_table.select.return_value
    mock_eq = mock_select.eq.return_value
    mock_order = mock_eq.order.return_value
    mock_limit = mock_order.limit.return_value
    mock_limit.execute.return_value = MagicMock(data=[{"content": "test"}])
    
    history = await get_chat_history("u1", "s1")
    assert len(history) == 1
    assert history[0]["content"] == "test"

@pytest.mark.asyncio
async def test_save_zone_snapshot(mock_supabase):
    """Verify snapshot persistence."""
    await save_zone_snapshot("u1", {"match_minute": 10})
    mock_supabase.table.assert_called_with("zone_snapshots")

@pytest.mark.asyncio
async def test_log_wait_prediction(mock_supabase):
    """Verify prediction logging."""
    await log_wait_prediction("u1", "z1", 5, 0.9, "rising")
    mock_supabase.table.assert_called_with("wait_predictions")
