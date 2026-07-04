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
    from app.core.config import settings
    monkeypatch.setattr(settings, "SERPER_API_KEY", "mock-serper-key")
    monkeypatch.setenv("SERPER_API_KEY", "mock-serper-key")

@pytest.mark.asyncio
async def test_internet_search(mock_search_provider):
    from unittest.mock import patch, AsyncMock
    from app.db.models import Job
    from datetime import datetime, timezone
    mock_job = Job(
        id=uuid.uuid4(), 
        title="Mock Job", 
        company="Mock", 
        description_html="Mock desc", 
        source="internal", 
        external_id="ext-123",
        remote=False,
        tags=[],
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    with patch("app.db.repositories.jobs_repo.JobsRepository.query_jobs_with_count", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = ([mock_job], 1)
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get("/api/v1/jobs", params={"q": "python remote"})
            data = response.json()
            assert response.status_code == 200
            assert "items" in data

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.db.base import Base
from app.db.models import User, Profile, Resume, RoleEnum

@pytest.mark.asyncio
async def test_ats_scoring(monkeypatch):
    class MockGenerateResponse:
        def __init__(self):
            self.text = '{"match_percentage": 85, "keyword_coverage": ["Python"], "missing_skills": ["Go"], "flags": ["No degree"], "suggestions": ["Add metrics"]}'

    class MockModelsService:
        async def generate_content(self, model, contents, config=None, **kwargs):
            return MockGenerateResponse()

    class MockAioModelsService:
        def __init__(self):
            self.models = MockModelsService()

    class MockClient:
        def __init__(self, api_key=None):
            self.aio = MockAioModelsService()

    import google.genai
    monkeypatch.setattr(google.genai, "Client", MockClient)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-2.5-flash")

    test_db_url = "sqlite+aiosqlite:///:memory:"
    test_engine = create_async_engine(test_db_url, echo=False)
    TestSessionLocal = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    mock_uuid = uuid.uuid4()
    resume_uuid = uuid.uuid4()

    async with TestSessionLocal() as session:
        user = User(
            id=mock_uuid,
            email="universal@project.local",
            password_hash="mock",
        )
        profile = Profile(
            user_id=mock_uuid,
            full_name="Universal Project User",
            role=RoleEnum.seeker
        )
        resume = Resume(
            id=resume_uuid,
            user_id=mock_uuid,
            file_name="resume.pdf",
            storage_path="mock/path.pdf",
            size_bytes=1000,
            parsed={"skills": ["Python"]},
            embedding=[0.0] * 768
        )
        session.add(user)
        session.add(profile)
        session.add(resume)
        await session.commit()

    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    from app.db.session import get_db
    from app.core.deps import require_user, get_current_profile
    
    async def override_require_user(): return user
    async def override_get_current_profile(): return profile
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_user] = override_require_user
    app.dependency_overrides[get_current_profile] = override_get_current_profile

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.post(
                "/api/v1/resumes/ats/score",
                json={
                    "resume_id": str(resume_uuid),
                    "job_text": "Need Python and Go"
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert data["match_percentage"] == 85
            assert "Python" in data["keyword_coverage"]
            assert "Go" in data["missing_skills"]
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(require_user, None)
        app.dependency_overrides.pop(get_current_profile, None)
        await test_engine.dispose()
        import os
        if os.path.exists("./test_temp.db"):
            try:
                os.remove("./test_temp.db")
            except Exception:
                pass

