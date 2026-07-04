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
    assert "Turnstile" in response.json()["detail"]

@patch("app.core.limits.verify_turnstile", return_value=True)
def test_guest_turnstile_success(mock_verify, client):
    from app.core.config import settings
    original_key = settings.GEMINI_API_KEY
    settings.GEMINI_API_KEY = ""
    try:
        response = client.post("/api/v1/chat", json={"message": "hello"}, headers={"X-Turnstile-Token": "valid_token"})
        assert response.status_code == 200
    finally:
        settings.GEMINI_API_KEY = original_key

def test_auth_bypasses_turnstile(auth_client):
    from app.core.config import settings
    original_key = settings.GEMINI_API_KEY
    settings.GEMINI_API_KEY = ""
    try:
        response = auth_client.post("/api/v1/chat", json={"message": "hello"})
        assert response.status_code == 200
    finally:
        settings.GEMINI_API_KEY = original_key


