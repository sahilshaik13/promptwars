import pytest
from app.services.venue_simulator import SimulatorEngine
from app.models import VenueSnapshot

@pytest.fixture
def engine():
    return SimulatorEngine()

def test_simulator_initialization(engine):
    """Verify engine starts with safe defaults."""
    assert engine.theme == "hackathon"
    assert engine.situation == "morning_entry"
    assert len(engine.zone_data) > 0

def test_set_state(engine):
    """Verify state updates propagate correctly."""
    engine.set_state("concert", "peak_flow", "high", auto_rotate=False)
    assert engine.theme == "concert"
    assert engine.situation == "peak_flow"
    assert engine.severity == "high"

def test_generate_snapshot(engine):
    """Verify SITREP generation and schema validity."""
    snapshot = engine.generate_snapshot()
    assert isinstance(snapshot, VenueSnapshot)
    assert len(snapshot.zones) == len(engine.zone_data)
    assert snapshot.match_phase is not None
    
    # Check for particle generation
    assert len(snapshot.particles) > 0

def test_situational_snapshots(engine):
    """Verify overrides in generate_snapshot."""
    snap1 = engine.generate_snapshot(theme="hackathon", severity="low")
    snap2 = engine.generate_snapshot(theme="hackathon", severity="high")
    
    # High severity should generally have higher total current_count
    total1 = sum(z.current_count for z in snap1.zones)
    total2 = sum(z.current_count for z in snap2.zones)
    assert total2 > total1

def test_invalid_parameters_fallback(engine):
    """Verify engine handles unknown situations gracefully."""
    # Should fallback to baseline matrices
    snap = engine.generate_snapshot(theme="INVALID_THEME", situation="UNKNOWN")
    assert isinstance(snap, VenueSnapshot)
    assert len(snap.zones) > 0
