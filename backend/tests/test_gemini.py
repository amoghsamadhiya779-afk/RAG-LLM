import os
import sys

import pytest
from app.main import app
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_health_gemini_endpoint_success(monkeypatch):
    class MockModel:
        def __init__(self, name):
            self.name = name

    class MockAioModelsService:
        async def list(self):
            return [MockModel("models/gemini-2.5-flash"), MockModel("models/text-embedding-004")]

    class MockAioService:
        def __init__(self):
            self.models = MockAioModelsService()

    class MockClient:
        def __init__(self, api_key=None):
            self.aio = MockAioService()

    import google.genai
    monkeypatch.setattr(google.genai, "Client", MockClient)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-2.5-flash")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health/gemini")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["model"] == "gemini-2.5-flash"


@pytest.mark.asyncio
async def test_health_gemini_endpoint_missing_api_key(monkeypatch):
    from app.core.config import settings
    original_api_key = settings.GEMINI_API_KEY
    settings.GEMINI_API_KEY = ""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health/gemini")
        assert response.status_code == 500
        assert "Gemini API Key is not configured" in response.json()["detail"]
    
    settings.GEMINI_API_KEY = original_api_key


@pytest.mark.asyncio
async def test_lifespan_verification_success(monkeypatch):
    class MockModel:
        def __init__(self, name):
            self.name = name

    class MockAioModelsService:
        async def list(self):
            return [MockModel("models/gemini-2.5-flash"), MockModel("models/text-embedding-004")]

    class MockAioService:
        def __init__(self):
            self.models = MockAioModelsService()

    class MockClient:
        def __init__(self, api_key=None):
            self.aio = MockAioService()

    import google.genai
    monkeypatch.setattr(google.genai, "Client", MockClient)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    from app.main import lifespan
    from fastapi import FastAPI
    
    original_modules = sys.modules.copy()
    if "pytest" in sys.modules:
        del sys.modules["pytest"]
    
    try:
        async with lifespan(FastAPI()):
            pass
    finally:
        sys.modules.update(original_modules)


@pytest.mark.asyncio
async def test_lifespan_verification_fails_missing_key(monkeypatch):
    from app.core.config import settings
    original_api_key = settings.GEMINI_API_KEY
    settings.GEMINI_API_KEY = ""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    
    from app.main import lifespan
    from fastapi import FastAPI
    
    original_modules = sys.modules.copy()
    if "pytest" in sys.modules:
        del sys.modules["pytest"]
        
    try:
        with pytest.raises(ValueError, match="GEMINI_API_KEY is not configured"):
            async with lifespan(FastAPI()):
                pass
    finally:
        sys.modules.update(original_modules)
        settings.GEMINI_API_KEY = original_api_key


@pytest.mark.asyncio
async def test_lifespan_verification_fails_model_not_found(monkeypatch):
    class MockModel:
        def __init__(self, name):
            self.name = name

    class MockAioModelsService:
        async def list(self):
            return [MockModel("models/some-other-model")]

    class MockAioService:
        def __init__(self):
            self.models = MockAioModelsService()

    class MockClient:
        def __init__(self, api_key=None):
            self.aio = MockAioService()

    import google.genai
    monkeypatch.setattr(google.genai, "Client", MockClient)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    from app.main import lifespan
    from fastapi import FastAPI
    
    original_modules = sys.modules.copy()
    if "pytest" in sys.modules:
        del sys.modules["pytest"]
        
    try:
        import logging
        from unittest.mock import patch
        with patch.object(logging.getLogger("app.main"), "error") as mock_error:
            async with lifespan(FastAPI()):
                pass
            mock_error.assert_called_once()
            assert "was not found in available models" in mock_error.call_args[0][0]
    finally:
        sys.modules.update(original_modules)
