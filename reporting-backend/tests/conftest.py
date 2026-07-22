import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    """FastAPI TestClient fixture for backend endpoints."""
    with TestClient(app) as test_client:
        yield test_client
