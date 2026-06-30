import pytest
from httpx import AsyncClient
from app.main import app
import uuid

# Mock providers for offline testing
@pytest.fixture
def mock_hf_provider(monkeypatch):
    class MockResponse:
        status_code = 200
        def json(self):
            return {
                "candidates": [{
                    "content": {
                        "parts": [{"text": '{"titles": ["SWE"], "seniority": "Junior", "skills": ["Python"], "domains": ["Web"], "suggested_keywords": ["FastAPI"], "years_experience": 1}'}]
                    }
                }]
            }
        @property
        def text(self): return "mock"
        
    async def mock_post(*args, **kwargs):
        return MockResponse()
        
    monkeypatch.setattr("httpx.AsyncClient.post", mock_post)

@pytest.fixture
def mock_search_provider(monkeypatch):
    class MockResponse:
        status_code = 200
        def json(self):
            return {"web": {"results": [{"title": "Mock Job", "description": "Mock desc", "url": "http://mock"}]}}
            
    async def mock_get(*args, **kwargs):
        return MockResponse()
        
    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

@pytest.mark.asyncio
async def test_internet_search(mock_search_provider):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/jobs/search", json={"keywords": ["python", "remote"]})
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert data[0]["title"] == "Mock Job"

@pytest.mark.asyncio
async def test_ats_scoring(mock_hf_provider):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Note: In a real test we'd need an auth token and an existing resume ID in DB
        # This is a structural representation of the test
        pass
