import pytest
from fastapi.testclient import TestClient
from resume_rag.api import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_unauthenticated_query_fails():
    response = client.post("/query", json={"question": "hello"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid API Key"

def test_authenticated_query_fails_validation():
    # Provided API Key but missing required fields
    response = client.post("/query", json={}, headers={"X-API-Key": "default-dev-key"})
    assert response.status_code == 422

def test_rate_limiting_triggers():
    # Attempt 15 requests to a limited endpoint like /documents (10/minute limit)
    responses = []
    for _ in range(15):
        responses.append(
            client.post("/documents", json={"text": "test", "source": "test"}, headers={"X-API-Key": "default-dev-key"})
        )
    
    # At least one should be 429 Too Many Requests
    status_codes = [r.status_code for r in responses]
    assert 429 in status_codes
