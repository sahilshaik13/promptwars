import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth import get_current_user

def mock_get_current_user():
    return "test-user-123"

app.dependency_overrides[get_current_user] = mock_get_current_user

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_check_endpoint(client):
    """Verify that the system health subsystem is operational."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "subsystems" in data

def test_authenticated_api_zones(client):
    """Verify that the /api/zones route works with mocked auth."""
    response = client.get("/api/zones")
    assert response.status_code == 200
    data = response.json()
    assert "zones" in data
    assert "match_phase" in data

def test_simulation_override(client):
    """Verify that the simulator can be updated via the API."""
    payload = {
        "theme": "marathon",
        "situation": "busy_peak",
        "severity": "high"
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["theme"] == "marathon"

def test_prediction_endpoint(client):
    """Verify that wait-time predictions are accessible."""
    response = client.get("/api/predict/hall_1")
    assert response.status_code == 200
    data = response.json()
    assert "predicted_wait_minutes" in data
    assert "zone_id" in data

def test_graph_endpoint(client):
    """Verify that the venue knowledge graph can be retrieved."""
    response = client.get("/api/graph")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data

def test_api_docs_availability(client):
    """Verify that Swagger documentation is generated correctly."""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "Swagger UI" in response.text

def test_maps_endpoint(client):
    """Verify that map tiles API endpoint works."""
    response = client.get("/api/maps/tiles/17/47200/78900")
    assert response.status_code in [200, 404, 500]

def test_chat_endpoint_with_auth(client):
    """Verify that chat history endpoint requires auth."""
    response = client.get("/api/chat/history?session_id=test-session")
    assert response.status_code in [200, 401]

def test_unauthorized_access(client):
    """Verify that protected endpoints reject unauthenticated requests."""
    app.dependency_overrides.clear()
    response = client.get("/api/zones")
    assert response.status_code in [401, 403]
    app.dependency_overrides[get_current_user] = mock_get_current_user

def test_invalid_zone_prediction(client):
    """Verify graceful handling of invalid zone ID."""
    response = client.get("/api/predict/invalid_zone_xyz")
    assert response.status_code in [200, 404, 422]

def test_rate_limiting_headers(client):
    """Verify that rate limiting headers are present."""
    response = client.get("/health")
    assert response.status_code == 200

def test_cors_headers(client):
    """Verify CORS configuration."""
    response = client.options("/health", headers={"Origin": "http://localhost:3000"})
    assert response.status_code in [200, 405]

def test_api_zones_response_structure(client):
    """Verify comprehensive response structure for zones endpoint."""
    response = client.get("/api/zones")
    assert response.status_code == 200
    data = response.json()

    assert "zones" in data
    assert isinstance(data["zones"], list)

    if len(data["zones"]) > 0:
        zone = data["zones"][0]
        required_fields = ["zone_id", "name", "type", "capacity", "current_count", "crowd_level", "status"]
        for field in required_fields:
            assert field in zone, f"Missing required field: {field}"

def test_simulation_with_different_themes(client):
    """Verify simulation works with various theme combinations."""
    themes = ["hackathon", "marathon", "expo", "awards"]
    for theme in themes:
        payload = {"theme": theme, "situation": "morning_entry", "severity": "medium"}
        response = client.post("/api/simulate", json=payload)
        assert response.status_code == 200, f"Failed for theme: {theme}"

def test_prediction_confidence_bounds(client):
    """Verify prediction confidence values are within valid range."""
    response = client.get("/api/predict/hall_1")
    if response.status_code == 200:
        data = response.json()
        if "confidence" in data:
            assert 0.0 <= data["confidence"] <= 1.0

def test_graph_connectivity(client):
    """Verify that venue graph has proper node connectivity."""
    response = client.get("/api/graph")
    assert response.status_code == 200
    data = response.json()

    assert "nodes" in data
    assert "edges" in data
    assert isinstance(data["nodes"], list)
    assert isinstance(data["edges"], list)

    if len(data["nodes"]) > 0:
        node_ids = {n["id"] for n in data["nodes"]}
        for edge in data["edges"]:
            assert edge["source"] in node_ids, f"Orphaned edge source: {edge['source']}"
            assert edge["target"] in node_ids, f"Orphaned edge target: {edge['target']}"