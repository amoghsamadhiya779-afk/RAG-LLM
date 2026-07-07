from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, Depends, Request
from app.core.deps import require_user, get_current_profile
from app.db.models import User, Profile, RoleEnum
from app.core.config import settings
from app.core.errors import APIError
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter(route_class=IdempotentRoute, prefix="/users", tags=["users"])

