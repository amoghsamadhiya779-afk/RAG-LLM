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
from app.core.deps import require_user, optional_user
from app.db.models import User
from app.db.session import get_db

from sqlalchemy.ext.compiler import compiles
from sqlalchemy import ARRAY

@compiles(ARRAY, "sqlite")
def compile_array_sqlite(type_, compiler, **kw):
    return "JSON"

@pytest.fixture(autouse=True)
def mock_redis():
    with patch("app.core.limits.redis", new=MagicMock()) as mock_r:
        mock_r.get.return_value = None
        mock_r.incr.return_value = 1
        mock_r.incrby.return_value = 1
        # Provide same mock to migrate
        try:
            import app.api.routes.migrate
            app.api.routes.migrate.redis = mock_r
        except AttributeError:
            pass
        yield mock_r

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
    from app.core.deps import optional_user, require_user
    async def mock_user():
        return User(id="test_user_1", email="test@example.com")
    app.dependency_overrides[require_user] = mock_user
    app.dependency_overrides[optional_user] = mock_user
    yield client
    app.dependency_overrides.pop(require_user, None)
    app.dependency_overrides.pop(optional_user, None)

@pytest.fixture
def recruiter_client(client):
    from app.core.deps import optional_user, require_user
    async def mock_recruiter():
        return User(id="recruiter_1", email="recruiter@example.com")
    app.dependency_overrides[require_user] = mock_recruiter
    app.dependency_overrides[optional_user] = mock_recruiter
    yield client
    app.dependency_overrides.pop(require_user, None)
    app.dependency_overrides.pop(optional_user, None)

