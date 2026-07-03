import os
import pytest
import sys
from unittest.mock import MagicMock

mock_magic = MagicMock()
mock_magic.from_buffer = MagicMock(return_value="application/pdf")
sys.modules['magic'] = mock_magic

os.environ["PROJECT_NAME"] = "Test jOBiON"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-key"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost:5432/test"
os.environ["GEMINI_API_KEY"] = "test-gemini"
os.environ["HF_TOKEN"] = "test-hf"
os.environ["ADZUNA_APP_ID"] = "test"
os.environ["ADZUNA_APP_KEY"] = "test"
os.environ["UPSTASH_REDIS_REST_URL"] = "https://test.upstash.io"
os.environ["UPSTASH_REDIS_REST_TOKEN"] = "test-token"
os.environ["RESEND_API_KEY"] = "test-resend"
os.environ["TURNSTILE_SECRET_KEY"] = "test-turnstile"
os.environ["CRON_SECRET"] = "test-cron"

from fastapi.testclient import TestClient
import fakeredis
from unittest.mock import AsyncMock, patch
from app.main import app
from app.core.security import get_current_user, User
from app.db.session import get_db

@pytest.fixture
def mock_redis():
    fake = fakeredis.FakeRedis()
    with patch("app.core.limits.redis", fake), patch("app.api.routes.internal_ingest.redis", fake), patch("app.api.routes.migrate.redis", fake), patch("app.api.routes.ats.redis", fake):
        yield fake

@pytest.fixture
def mock_db():
    db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: db
    yield db
    app.dependency_overrides.pop(get_db, None)

@pytest.fixture
def client(mock_redis, mock_db):
    yield TestClient(app)

@pytest.fixture
def auth_client(client):
    from app.core.security import optional_user, get_current_user
    async def mock_user():
        return User(id="test_user_1", email="test@example.com", role="seeker")
    app.dependency_overrides[get_current_user] = mock_user
    app.dependency_overrides[optional_user] = mock_user
    yield client
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(optional_user, None)

@pytest.fixture
def recruiter_client(client):
    from app.core.security import optional_user, get_current_user
    async def mock_recruiter():
        return User(id="recruiter_1", email="recruiter@example.com", role="recruiter")
    app.dependency_overrides[get_current_user] = mock_recruiter
    app.dependency_overrides[optional_user] = mock_recruiter
    yield client
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(optional_user, None)
