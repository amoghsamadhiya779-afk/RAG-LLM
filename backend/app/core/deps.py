import uuid
import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import User, Profile, RoleEnum
from app.core.config import settings
from app.core.errors import APIError

security = HTTPBearer()

def verify_supabase_jwt(token: str):
    try:
        if settings.SUPABASE_JWT_SECRET:
            # Fallback for HS256 if explicitly provided
            payload = jwt.decode(
                token, 
                settings.SUPABASE_JWT_SECRET, 
                algorithms=["HS256"], 
                audience="authenticated"
            )
            return payload
            
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        jwks_client = jwt.PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience="authenticated"
        )
        return payload
    except jwt.PyJWTError as e:
        raise APIError("unauthorized", f"Invalid token: {str(e)}", 401)

async def optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
        
    token = auth_header.split(" ")[1]
    try:
        payload = verify_supabase_jwt(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
            
        user_uuid = uuid.UUID(user_id)
        result = await db.execute(select(User).where(User.id == str(user_uuid)))
        return result.scalar_one_or_none()
    except Exception:
        return None

async def require_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = verify_supabase_jwt(token)
    
    user_id = payload.get("sub")
    if not user_id:
        raise APIError("unauthorized", "Token missing subject (sub).", 401)
        
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise APIError("unauthorized", "Invalid user ID format.", 401)
        
    result = await db.execute(select(User).where(User.id == str(user_uuid)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise APIError("unauthorized", "User not found in local database.", 401)
        
    return user

async def get_current_profile(
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
) -> Profile:
    result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise APIError("not_found", "User profile not found.", 404)
        
    return profile

def require_role(allowed_roles: list[RoleEnum]):
    async def role_checker(
        user: User = Depends(require_user),
        profile: Profile = Depends(get_current_profile)
    ):
        if user.role not in allowed_roles:
            raise APIError("forbidden", f"Insufficient permissions. Required roles: {[r.value for r in allowed_roles]}", 403)
        return user
    return role_checker
