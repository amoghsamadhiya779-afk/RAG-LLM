from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Profile, User
from app.repositories.user_repo import UserRepository
from app.schemas.schemas import AuthSession, SignInRequest, UserCreate, UserResponse, ProfileResponse
from app.core.security import verify_password, create_access_token

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserRepository(db)

    async def sign_up(self, req: UserCreate) -> AuthSession:
        existing = await self.repo.get_by_email(req.email)
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        
        user = await self.repo.create(req)
        result = await self.db.execute(select(Profile).where(Profile.user_id == user.id))
        profile = result.scalar_one()
        
        token = create_access_token(subject=str(user.id))
        
        return AuthSession(
            user=UserResponse.model_validate(user),
            profile=ProfileResponse.model_validate(profile),
            token=token
        )

    async def sign_in(self, req: SignInRequest) -> AuthSession:
        user = await self.repo.get_by_email(req.email)
        if not user or not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
            
        result = await self.db.execute(select(Profile).where(Profile.user_id == user.id))
        profile = result.scalar_one()
        
        token = create_access_token(subject=str(user.id))
        
        return AuthSession(
            user=UserResponse.model_validate(user),
            profile=ProfileResponse.model_validate(profile),
            token=token
        )

    async def get_me(self, user: User) -> AuthSession:
        result = await self.db.execute(select(Profile).where(Profile.user_id == user.id))
        profile = result.scalar_one()
        
        return AuthSession(
            user=UserResponse.model_validate(user),
            profile=ProfileResponse.model_validate(profile),
            token=""
        )
