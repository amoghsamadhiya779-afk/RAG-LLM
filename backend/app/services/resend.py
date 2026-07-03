from app.core.config import settings
import httpx
import structlog

logger = structlog.get_logger(__name__)

async def send_email(to_email: str, subject: str, html_body: str) -> bool:
    if not settings.RESEND_API_KEY:
        logger.warning("resend_not_configured")
        return False
        
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                settings.RESEND_API_URL,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json={
                    "from": "onboarding@resend.dev",
                    "to": to_email,
                    "subject": subject,
                    "html": html_body
                },
                timeout=10.0
            )
            response.raise_for_status()
            return True
    except Exception as e:
        logger.error("email_send_failed", error=str(e), to=to_email)
        return False
