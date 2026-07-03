import pytest
from unittest.mock import patch

def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_guest_requires_turnstile(client):
    # Missing Turnstile token
    response = client.post("/api/v1/chat", json={"message": "hello"})
    assert response.status_code == 401
    assert "Turnstile" in response.json()["error"]["message"]

@patch("app.core.limits.verify_turnstile", return_value=True)
def test_guest_turnstile_success(mock_verify, client):
    response = client.post("/api/v1/chat", json={"message": "hello"}, headers={"X-Turnstile-Token": "valid_token"})
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_auth_bypasses_turnstile(auth_client):
    response = auth_client.post("/api/v1/chat", json={"message": "hello"})
    assert response.status_code == 200

def test_recruiter_gate_success(recruiter_client):
    response = recruiter_client.get("/api/v1/recruiter/dashboard")
    assert response.status_code == 200

def test_recruiter_gate_forbidden(auth_client):
    # Seeker trying to access recruiter dashboard
    response = auth_client.get("/api/v1/recruiter/dashboard")
    assert response.status_code == 403

def test_migrate_idempotency(auth_client, mock_redis):
    headers = {"Idempotency-Key": "test-key"}
    data = {"saved_jobs": ["job1"], "applications": [], "resume_metadata": {}}
    
    # First call
    response1 = auth_client.post("/api/v1/migrate-guest-data", json=data, headers=headers)
    assert response1.status_code == 200
    
    # Second call (idempotent)
    response2 = auth_client.post("/api/v1/migrate-guest-data", json=data, headers=headers)
    assert response2.status_code == 200
    assert response2.json()["message"] == "Already processed."

def test_migrate_payload_too_large(auth_client):
    headers = {"Idempotency-Key": "test-key", "Content-Length": "150000"} # Exceeds 100KB
    data = {"saved_jobs": ["job1"], "applications": [], "resume_metadata": {}}
    response = auth_client.post("/api/v1/migrate-guest-data", json=data, headers=headers)
    assert response.status_code == 413
