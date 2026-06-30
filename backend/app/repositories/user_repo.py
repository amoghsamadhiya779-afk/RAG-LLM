import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import User, Profile
from app.schemas.schemas import UserCreate
from app.core.security import get_password_hash

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
        
    async def get_by_id(self, user_id: str | uuid.UUID) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create(self, user_in: UserCreate) -> User:
        user = User(
            email=user_in.email,
            password_hash=get_password_hash(user_in.password)
        )
        self.db.add(user)
        
        profile = Profile(
            user=user,
            role=user_in.role,
            full_name=user_in.full_name
        )
        self.db.add(profile)
        
        await self.db.commit()
        await self.db.refresh(user)
        return user
