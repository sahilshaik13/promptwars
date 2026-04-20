import pytest
from app.services.pathfinder import calculate_edge_cost, find_fastest_route, generate_strategic_routes
from app.models import ZoneStatus, ZoneType

@pytest.fixture
def mock_zones():
    return {
        "gate_main": ZoneStatus(zone_id="gate_main", name="Main Gate", type=ZoneType.gate, current_count=100, capacity=1000, crowd_level=0.1, status="low", lat=17.470, lng=78.370),
        "hall_1": ZoneStatus(zone_id="hall_1", name="Hall 1", type=ZoneType.seating, current_count=500, capacity=1000, crowd_level=0.5, status="medium", lat=17.472, lng=78.372),
        "hall_2": ZoneStatus(zone_id="hall_2", name="Hall 2", type=ZoneType.seating, current_count=800, capacity=1000, crowd_level=0.8, status="high", lat=17.474, lng=78.374),
    }

def test_calculate_edge_cost(mock_zones):
    """Verify that traversal cost increases with crowd density."""
    z1 = mock_zones["gate_main"]
    z2 = mock_zones["hall_1"]
    
    # Low crowd cost
    cost_low = calculate_edge_cost(z1, z2, 100)
    
    # High crowd cost
    z2.crowd_level = 0.9
    cost_high = calculate_edge_cost(z1, z2, 100)
    
    assert cost_high > cost_low
    # Check queue delay for gate types
    z2.type = ZoneType.gate
    cost_with_queue = calculate_edge_cost(z1, z2, 100)
    assert cost_with_queue > cost_high

def test_find_fastest_route(mock_zones):
    """Verify Dijkstra correctly finds the lowest-cost path."""
    topology = [
        ("gate_main", "hall_1", "Direct Path", 100),
        ("hall_1", "hall_2", "Direct Path", 100),
    ]
    
    # Simple path
    result = find_fastest_route(topology, mock_zones, "gate_main", "hall_2")
    assert result["path"] == ["gate_main", "hall_1", "hall_2"]
    assert result["eta_mins"] > 0
    
    # Unreachable path
    result_fail = find_fastest_route(topology, mock_zones, "gate_main", "UNKNOWN")
    assert result_fail["path"] == []
    assert result_fail["eta_mins"] == -1

def test_avoid_congested_route(mock_zones):
    """Verify algorithm pivots when avoid_congested is True."""
    # gate_main -> hall_1 (crowded) or gate_main -> hall_2 (clear)
    mock_zones["hall_1"].crowd_level = 0.9
    mock_zones["hall_2"].crowd_level = 0.1
    
    topology = [
        ("gate_main", "hall_1", "Path A", 100),
        ("hall_1", "hall_2", "Path B", 100),
        ("gate_main", "hall_2", "Path C", 500), # Longer but clearer
    ]
    
    # Normally it takes Path A+B (100+100)
    normal = find_fastest_route(topology, mock_zones, "gate_main", "hall_2", avoid_congested=False)
    assert normal["path"] == ["gate_main", "hall_1", "hall_2"]
    
    # Avoiding congested should pick Path C (500)
    clear = find_fastest_route(topology, mock_zones, "gate_main", "hall_2", avoid_congested=True)
    assert clear["path"] == ["gate_main", "hall_2"]

def test_generate_strategic_routes(mock_zones):
    """Verify the summary report generation for AI context."""
    topology = [("gate_main", "hall_1", "A", 100)]
    report = generate_strategic_routes(topology, mock_zones, ["hall_1"])
    assert "DESTINATION: Hall 1" in report
    assert "Fastest Route" in report
