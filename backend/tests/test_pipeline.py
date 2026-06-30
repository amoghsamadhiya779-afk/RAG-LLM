import pytest
import httpx
from httpx import AsyncClient, ASGITransport
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
            return {"organic": [{"title": "Mock Job", "snippet": "Mock desc", "link": "http://mock"}]}
            
    original_post = httpx.AsyncClient.post
    
    async def mock_post(self, url, *args, **kwargs):
        if "serper.dev" in str(url):
            return MockResponse()
        return await original_post(self, url, *args, **kwargs)
        
    monkeypatch.setattr("httpx.AsyncClient.post", mock_post)

@pytest.mark.asyncio
async def test_internet_search(mock_search_provider):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/jobs/search", json={"keywords": ["python", "remote"]})
        data = response.json()
        assert response.status_code == 200
        assert len(data) > 0
        assert data[0]["title"] == "Mock Job"

@pytest.mark.asyncio
async def test_ats_scoring(mock_hf_provider):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Note: In a real test we'd need an auth token and an existing resume ID in DB
        # This is a structural representation of the test
        pass
