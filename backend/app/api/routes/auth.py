from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.schemas import AuthSession, SignInRequest, UserCreate
from app.services.auth_service import AuthService
from app.core.deps import require_user
from app.db.models import User

router = APIRouter(route_class=IdempotentRoute, prefix="/auth", tags=["auth"])

@router.post("/sign-up", response_model=AuthSession)
async def sign_up(req: UserCreate, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.sign_up(req)

@router.post("/sign-in", response_model=AuthSession)
async def sign_in(req: SignInRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.sign_in(req)

@router.post("/sign-out", status_code=204)
async def sign_out():
    # In a real JWT stateless setup, sign-out is handled client-side by deleting the token.
    # Optionally, we could blacklist the token here.
    return None

@router.get("/me", response_model=AuthSession)
async def get_me(user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.get_me(user)
