import pytest
from app.utils.spatial_utils import calculate_crowd_level, generate_random_particles, THEME_MATRICES

def test_crowd_level_bounds():
    """Verify that crowd level never exceeds 1.0 or drops below 0.0."""
    # Test high severity override
    lvl = calculate_crowd_level(90, "concert_peak", "hall_1", 1.5)
    assert 0.0 <= lvl <= 1.0
    
    # Test low severity override
    lvl = calculate_crowd_level(5, "morning_entry", "gate_main", 0.1)
    assert 0.0 <= lvl <= 1.0

def test_situation_modifiers():
    """Verify that different situations produce expected directional crowd shifts."""
    base = 50.0
    zid_gate = "gate_main"
    zid_hall = "hall_1"
    
    # Morning entry: Gates boost, Halls drop
    m_gate = calculate_crowd_level(base, "morning_entry", zid_gate, 1.0)
    m_hall = calculate_crowd_level(base, "morning_entry", zid_hall, 1.0)
    assert m_gate > m_hall
    
    # Closing: Gates boost heavily, Halls drop heavily
    c_gate = calculate_crowd_level(base, "closing", zid_gate, 1.0)
    c_hall = calculate_crowd_level(base, "closing", zid_hall, 1.0)
    assert c_gate > c_hall
    assert c_hall < m_hall # Halls emptier in closing than entry

def test_particle_generation():
    """Verify particle scatter logic behaves correctly."""
    particles = generate_random_particles(17.470, 78.375, 10)
    assert len(particles) == 10
    for p in particles:
        assert "x" in p
        assert "y" in p
        assert "id" in p

def test_theme_matrices_integrity():
    """Ensure all expected zones are present in theme matrices."""
    zones = ["gate_main", "hall_1", "hall_2", "hall_3", "hall_4"]
    for theme, matrix in THEME_MATRICES.items():
        for z in zones:
            assert z in matrix, f"Missing zone {z} in theme {theme}"
