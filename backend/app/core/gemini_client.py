from google import genai
from app.core.config import settings
import os
import sys

_client = None

def get_gemini_client() -> genai.Client:
    global _client
    # Detect testing environment securely using pytest internals as well
    is_testing = (
        "pytest" in sys.modules or 
        "_pytest" in sys.modules or 
        "unittest" in sys.modules or 
        os.environ.get("TESTING") in ("1", "true", "True")
    )
    if is_testing:
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        return genai.Client(api_key=api_key)
        
    if _client is None:
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        _client = genai.Client(api_key=api_key)
    return _client
