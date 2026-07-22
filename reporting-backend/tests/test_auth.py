def test_unprotected_route_rejection(client):
    """Test protected endpoints reject requests missing X-Admin-Token."""
    response = client.get("/api/dashboard/summary")
    # Should be rejected with 401 Unauthorized
    assert response.status_code == 401


def test_invalid_login_credentials(client):
    """Test login with wrong credentials raises 401."""
    response = client.post("/api/auth/login", json={"username": "wrong_user", "password": "wrong_password"})
    # If environment variables are configured, returns 401. If not configured, returns 503.
    assert response.status_code in (401, 503)
