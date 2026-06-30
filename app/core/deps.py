import uuid
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.models import User, Profile, RoleEnum

# -------------------------------------------------------------
# AUTHENTICATION DISABLED FOR PUBLIC PROJECT MODE
# -------------------------------------------------------------
# A mock user ID to satisfy foreign key constraints.
MOCK_USER_ID = "00000000-0000-0000-0000-000000000000"

async def get_current_user(
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Bypasses JWT authentication. Returns a universal mock user.
    Creates the mock user if it doesn't exist in the database.
    """
    mock_uuid = uuid.UUID(MOCK_USER_ID)
    result = await db.execute(select(User).where(User.id == mock_uuid))
    user = result.scalar_one_or_none()
    
    if not user:
        # Create the universal mock user & profile if missing
        user = User(
            id=mock_uuid,
            email="universal@project.local",
            hashed_password="mock",
            role=RoleEnum.admin,
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        profile = Profile(
            user_id=mock_uuid,
            full_name="Universal Project User",
            role=RoleEnum.admin
        )
        db.add(profile)
        await db.commit()

    return user

async def get_current_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Profile:
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    return profile

def require_role(allowed_roles: list[RoleEnum]):
    async def role_checker(
        user: User = Depends(get_current_user),
        profile: Profile = Depends(get_current_profile)
    ):
        # Bypassing role checks to enable all sections for all users
        return user
    return role_checker
