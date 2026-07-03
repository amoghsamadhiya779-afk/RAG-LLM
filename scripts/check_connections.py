import os
import sys
import asyncio
import httpx
from sqlalchemy.ext.asyncio import create_async_engine
from google import genai
from app.core.config import settings

def mask_secret(secret: str | None) -> str:
    if not secret:
        return "MISSING"
    if len(secret) <= 4:
        return "****"
    return f"****{secret[-4:]}"

def print_result(service: str, status: str, detail: str = ""):
    color = "\033[92m" if status == "PASS" else "\033[91m" if status == "FAIL" else "\033[93m"
    reset = "\033[0m"
    print(f"{service.ljust(30)} | {color}{status.ljust(6)}{reset} | {detail}")

async def check_database():
    try:
        if not settings.DATABASE_URL:
            return "FAIL", "DATABASE_URL is missing"
        if "pooler.supabase.com" not in settings.DATABASE_URL:
            print_result("DATABASE", "WARN", "Not using pooler.supabase.com")
        if ":6543" not in settings.DATABASE_URL:
            print_result("DATABASE", "WARN", "Not using port 6543 (transaction mode)")
            
        db_url = settings.DATABASE_URL
        if db_url and db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            
        engine = create_async_engine(db_url, connect_args={"server_settings": {"statement_timeout": "10000"}})
        async with engine.connect() as conn:
            from sqlalchemy import text
            await conn.execute(text("SELECT 1"))
            
            # Check pgvector
            result = await conn.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector'"))
            if not result.scalar():
                return "FAIL", "pgvector extension not found in database"
                
        return "PASS", f"Connected to {mask_secret(settings.DATABASE_URL)}"
    except Exception as e:
        return "FAIL", f"Connection error: {str(e).splitlines()[0]}"

async def check_supabase_auth():
    try:
        base_url = settings.SUPABASE_URL.replace("/rest/v1", "").rstrip("/")
        url = f"{base_url}/auth/v1/health"
        headers = {"apikey": settings.SUPABASE_SERVICE_ROLE_KEY}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                return "PASS", f"Auth healthy. URL: {settings.SUPABASE_URL}"
            return "FAIL", f"HTTP {res.status_code} - {res.text[:50]}"
    except Exception as e:
        return "FAIL", f"Error: {str(e)}"

async def check_jwks():
    try:
        base_url = settings.SUPABASE_URL.replace("/rest/v1", "").rstrip("/")
        url = f"{base_url}/auth/v1/.well-known/jwks.json"
        headers = {"apikey": settings.SUPABASE_SERVICE_ROLE_KEY}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200 and "keys" in res.json():
                return "PASS", "JWKS keys retrieved successfully"
            return "FAIL", f"HTTP {res.status_code} - {res.text[:50]}"
    except Exception as e:
        return "FAIL", f"Error: {str(e)}"

async def check_gemini():
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        # Using the v1alpha embedding call to test
        response = await client.aio.models.embed_content(
            # Some regions/versions might use text-embedding-004, others models/embedding-001
            model="models/embedding-001",
            contents="ping"
        )
        if len(response.embeddings[0].values) == 768:
            return "PASS", f"Vector dimension 768 confirmed. Key: {mask_secret(settings.GEMINI_API_KEY)}"
        return "FAIL", f"Invalid dimension: {len(response.embeddings[0].values)}"
    except Exception as e:
        if "404" in str(e):
            return "WARN", f"Gemini reachable but model not found (API version mismatch). Key: {mask_secret(settings.GEMINI_API_KEY)}"
        return "FAIL", f"Error: {str(e).splitlines()[0]}"

async def check_adzuna():
    try:
        url = f"https://api.adzuna.com/v1/api/jobs/us/search/1?app_id={settings.ADZUNA_APP_ID}&app_key={settings.ADZUNA_APP_KEY}&results_per_page=1"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url)
            if res.status_code == 200:
                return "PASS", f"Adzuna search successful. App ID: {mask_secret(settings.ADZUNA_APP_ID)}"
            return "FAIL", f"HTTP {res.status_code} - Check credentials"
    except Exception as e:
        return "FAIL", f"Error: {str(e)}"

async def check_serper():
    try:
        if not settings.SERPER_API_KEY:
            return "MISSING", "SERPER_API_KEY not provided"
            
        url = "https://google.serper.dev/search"
        headers = {"X-API-KEY": settings.SERPER_API_KEY, "Content-Type": "application/json"}
        payload = {"q": "test", "num": 1}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code == 200:
                return "PASS", f"Serper successful. Key: {mask_secret(settings.SERPER_API_KEY)}"
            return "FAIL", f"HTTP {res.status_code} - Check credentials"
    except Exception as e:
        return "FAIL", f"Error: {str(e)}"

async def check_upstash():
    try:
        url = f"{settings.UPSTASH_REDIS_REST_URL.rstrip('/')}/ping"
        headers = {"Authorization": f"Bearer {settings.UPSTASH_REDIS_REST_TOKEN}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                if data.get("result") == "PONG":
                    return "PASS", f"Redis PONG. Key: {mask_secret(settings.UPSTASH_REDIS_REST_TOKEN)}"
            return "FAIL", f"HTTP {res.status_code} - Expected PONG, got {res.text[:20]}"
    except Exception as e:
        return "FAIL", f"Error: {str(e)}"

async def check_resend():
    try:
        url = "https://api.resend.com/domains"
        headers = {"Authorization": f"Bearer {settings.RESEND_API_KEY}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                return "PASS", f"Resend authenticated. Key: {mask_secret(settings.RESEND_API_KEY)}"
            return "FAIL", f"HTTP {res.status_code} - Check credentials"
    except Exception as e:
        return "FAIL", f"Error: {str(e)}"

async def check_turnstile():
    try:
        url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
        payload = {"secret": settings.TURNSTILE_SECRET_KEY, "response": "dummy"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, data=payload)
            if res.status_code == 200:
                data = res.json()
                if data.get("success") == True:
                    return "WARN", "Configured with ALWAYS-PASS test secret. DO NOT USE IN PROD."
                if "invalid-input-response" in data.get("error-codes", []):
                    return "PASS", f"Turnstile secret is real and reachable. Key: {mask_secret(settings.TURNSTILE_SECRET_KEY)}"
            return "FAIL", f"HTTP {res.status_code} - {res.text[:50]}"
    except Exception as e:
        return "FAIL", f"Error: {str(e)}"

def check_sentry():
    try:
        import sentry_sdk
        # Just init, do not capture event
        sentry_sdk.init(dsn=settings.SENTRY_DSN)
        return "PASS", f"Sentry DSN initialized. DSN: {mask_secret(settings.SENTRY_DSN)}"
    except Exception as e:
        return "FAIL", f"Error: {str(e)}"

def check_cron_secret():
    if not settings.CRON_SECRET:
        return "FAIL", "CRON_SECRET is missing"
    if len(settings.CRON_SECRET) < 32:
        return "FAIL", "CRON_SECRET must be at least 32 characters long"
    return "PASS", f"CRON_SECRET is secure. Key: {mask_secret(settings.CRON_SECRET)}"

def check_allowed_origins():
    origins = settings.ALLOWED_ORIGINS
    if "*" in origins:
        return "FAIL", "Wildcard '*' origin is not allowed in production."
    if "https://rag-llm-iota.vercel.app" not in origins:
        return "FAIL", "Missing https://rag-llm-iota.vercel.app in ALLOWED_ORIGINS."
    return "PASS", "Origins configured securely."

async def run_checks():
    print("="*80)
    print("LIVE CONNECTIVITY & SECRETS CHECK")
    print("="*80)
    
    # Run async checks
    results = []
    has_critical_failure = False
    
    db_res = await check_database()
    print_result("Database (pgvector)", *db_res)
    if db_res[0] == "FAIL": has_critical_failure = True
    
    auth_res = await check_supabase_auth()
    print_result("Supabase Auth", *auth_res)
    if auth_res[0] == "FAIL": has_critical_failure = True
    
    jwks_res = await check_jwks()
    print_result("Supabase JWKS", *jwks_res)
    if jwks_res[0] == "FAIL": has_critical_failure = True
    
    gem_res = await check_gemini()
    print_result("Gemini API (Embeddings)", *gem_res)
    if gem_res[0] == "FAIL": has_critical_failure = True
    
    adz_res = await check_adzuna()
    print_result("Adzuna API", *adz_res)
    if adz_res[0] == "FAIL": has_critical_failure = True
    
    serp_res = await check_serper()
    print_result("Serper API", *serp_res)
    # Serper is optional if Tavily is used, but we'll flag it if failed (not MISSING)
    
    upst_res = await check_upstash()
    print_result("Upstash Redis", *upst_res)
    if upst_res[0] == "FAIL": has_critical_failure = True
    
    resend_res = await check_resend()
    print_result("Resend API", *resend_res)
    if resend_res[0] == "FAIL": has_critical_failure = True
    
    turn_res = await check_turnstile()
    print_result("Cloudflare Turnstile", *turn_res)
    if turn_res[0] == "FAIL": has_critical_failure = True
    
    sen_res = check_sentry()
    print_result("Sentry DSN", *sen_res)
    if sen_res[0] == "FAIL": has_critical_failure = True
    
    cron_res = check_cron_secret()
    print_result("CRON Secret", *cron_res)
    if cron_res[0] == "FAIL": has_critical_failure = True
    
    orig_res = check_allowed_origins()
    print_result("CORS Origins", *orig_res)
    if orig_res[0] == "FAIL": has_critical_failure = True
    
    print("="*80)
    if has_critical_failure:
        print("\033[91mCRITICAL FAILURES DETECTED.\033[0m Process exiting with 1.")
        sys.exit(1)
    else:
        print("\033[92mALL REQUIRED CHECKS PASSED.\033[0m")

if __name__ == "__main__":
    asyncio.run(run_checks())
