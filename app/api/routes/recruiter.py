from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, Depends
from app.core.security import require_role, User

router = APIRouter(route_class=IdempotentRoute, prefix="/recruiter", tags=["recruiter"])

@router.get("/dashboard", dependencies=[Depends(require_role(["recruiter", "admin"]))])
async def get_dashboard(user: User = Depends(require_role(["recruiter", "admin"]))):
    return {"message": "Welcome to the recruiter dashboard", "user_id": user.id}
