from app.core.idempotency import IdempotentRoute
from fastapi import APIRouter, UploadFile, File, Depends, Request
from app.core.security import optional_user, User
from app.core.limits import check_rate_limit, check_guest_turnstile
from app.core.errors import APIError
from app.services.gemini import analyze_resume_gemini
try:
    import magic
except ImportError:
    import mimetypes
    magic = None
import fitz # PyMuPDF
import docx
import io
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter(route_class=IdempotentRoute, prefix="/resume", tags=["resume"])

MAX_FILE_SIZE = 5 * 1024 * 1024

def extract_text_from_pdf(content: bytes) -> str:
    text = ""
    with fitz.open(stream=content, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()
    return text

def extract_text_from_docx(content: bytes) -> str:
    doc = docx.Document(io.BytesIO(content))
    return "\n".join([paragraph.text for paragraph in doc.paragraphs])

@router.post("/analyze")
async def analyze_resume(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(optional_user)
):
    # Enforce guest Turnstile
    if not user:
        await check_guest_turnstile(request)
        client_ip = request.client.host
        await check_rate_limit(f"ratelimit:analyze:{client_ip}", limit=5)
    else:
        await check_rate_limit(f"ratelimit:analyze:{user.id}", limit=25)
        
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise APIError("file_too_large", "Resume file must be under 5MB.", 413)
        
    mime = magic.from_buffer(content[:2048], mime=True)
    
    text = ""
    if mime == "application/pdf":
        text = extract_text_from_pdf(content)
    elif mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        text = extract_text_from_docx(content)
    else:
        raise APIError("invalid_file_type", "Only PDF and DOCX files are supported.", 415)
        
    if not text.strip():
        raise APIError("unreadable_file", "Could not extract text from the file.", 422)
        
    # Analyze via Gemini
    parsed = await analyze_resume_gemini(text)
    
    return {
        "status": "success",
        "data": parsed.model_dump()
    }
