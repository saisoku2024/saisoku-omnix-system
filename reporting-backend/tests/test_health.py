def test_root_endpoint(client):
    """Test root GET / status endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "backend ready"
    assert data.get("service") == "SAISOKU OMNIX Backend"


def test_health_endpoint(client):
    """Test health check GET /health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"
