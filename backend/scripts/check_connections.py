import os
import sys
import httpx
import asyncio
from dotenv import load_dotenv

# load real .env
load_dotenv(".env")

def mask(val):
    if not val: return "NONE"
    val = str(val)
    if len(val) <= 4: return "***" + val
    return "***" + val[-4:]

RESULTS = []

def record(service, vars, status, reason="", hint=""):
    RESULTS.append({
        "service": service,
        "vars": vars,
        "status": status,
        "reason": reason,
        "hint": hint
    })
    print(f"{service:15} | {vars:40} | {status:4} | {reason:20} | {hint}")

async def check_supabase(url, key):
    if not url or not key:
        return record("Supabase", f"URL={mask(url)} KEY={mask(key)}", "SKIP", "Missing vars")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{url.rstrip('/')}/auth/v1/settings",
                headers={"apikey": key, "Authorization": f"Bearer {key}"}
            )
            if resp.status_code in (200, 401, 403):
                if resp.status_code == 200:
                    record("Supabase", f"URL={mask(url)} KEY={mask(key)}", "PASS", "")
                else:
                    record("Supabase", f"URL={mask(url)} KEY={mask(key)}", "FAIL", "auth", "anon key pasted where service_role is needed?")
            else:
                record("Supabase", f"URL={mask(url)} KEY={mask(key)}", "FAIL", f"HTTP {resp.status_code}")
    except Exception as e:
        record("Supabase", f"URL={mask(url)} KEY={mask(key)}", "FAIL", "network", str(e))

async def check_database(url):
    if not url:
        return record("Database", "NONE", "SKIP", "Missing var")
    
    try:
        import asyncpg
        conn = await asyncpg.connect(url, timeout=10.0)
        await conn.execute("SELECT 1")
        await conn.close()
        record("Database", f"URL={mask(url)}", "PASS", "")
    except asyncpg.exceptions.InvalidPasswordError:
        record("Database", f"URL={mask(url)}", "FAIL", "auth", "un-URL-encoded password in DATABASE_URL (@ must be %40)?")
    except Exception as e:
        err = str(e).lower()
        if "timeout" in err or "connection refused" in err:
            record("Database", f"URL={mask(url)}", "FAIL", "network", "direct connection string instead of the 6543 pooler?")
        else:
            record("Database", f"URL={mask(url)}", "FAIL", "auth/network", str(e))

async def check_gemini(key):
    if not key:
        return record("Gemini", "NONE", "SKIP", "Missing var")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={key}")
            if resp.status_code == 200:
                record("Gemini", f"KEY={mask(key)}", "PASS", "")
            else:
                if resp.status_code == 400 and "API_KEY_INVALID" in resp.text:
                    record("Gemini", f"KEY={mask(key)}", "FAIL", "auth", "Invalid key format or deactivated")
                elif resp.status_code == 403:
                    record("Gemini", f"KEY={mask(key)}", "FAIL", "auth", "Permission denied")
                else:
                    record("Gemini", f"KEY={mask(key)}", "FAIL", f"HTTP {resp.status_code}", resp.text[:50])
    except Exception as e:
        record("Gemini", f"KEY={mask(key)}", "FAIL", "network", str(e))

async def check_hf(token):
    if not token:
        return record("HuggingFace", "NONE", "SKIP", "Missing var")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://huggingface.co/api/whoami-v2", headers={"Authorization": f"Bearer {token}"})
            if resp.status_code == 200:
                record("HuggingFace", f"TOKEN={mask(token)}", "PASS", "")
            elif resp.status_code == 401:
                record("HuggingFace", f"TOKEN={mask(token)}", "FAIL", "auth", "Invalid or revoked token")
            else:
                record("HuggingFace", f"TOKEN={mask(token)}", "FAIL", f"HTTP {resp.status_code}")
    except Exception as e:
        record("HuggingFace", f"TOKEN={mask(token)}", "FAIL", "network", str(e))

async def check_adzuna(app_id, app_key):
    if not app_id or not app_key:
        return record("Adzuna", f"ID={mask(app_id)} KEY={mask(app_key)}", "SKIP", "Missing vars")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"https://api.adzuna.com/v1/api/jobs/us/search/1?app_id={app_id}&app_key={app_key}&results_per_page=1"
            resp = await client.get(url)
            if resp.status_code == 200:
                record("Adzuna", f"ID={mask(app_id)} KEY={mask(app_key)}", "PASS", "")
            elif resp.status_code in (401, 403):
                record("Adzuna", f"ID={mask(app_id)} KEY={mask(app_key)}", "FAIL", "auth", "Adzuna app_id and app_key swapped or invalid")
            else:
                record("Adzuna", f"ID={mask(app_id)} KEY={mask(app_key)}", "FAIL", f"HTTP {resp.status_code}")
    except Exception as e:
        record("Adzuna", f"ID={mask(app_id)} KEY={mask(app_key)}", "FAIL", "network", str(e))

async def check_serper(key):
    if not key:
        return record("Serper", "NONE", "SKIP", "Missing var")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post("https://google.serper.dev/search", headers={"X-API-KEY": key}, json={"q": "test"})
            if resp.status_code == 200:
                record("Serper", f"KEY={mask(key)}", "PASS", "")
            elif resp.status_code == 403:
                record("Serper", f"KEY={mask(key)}", "FAIL", "auth", "Invalid key or exhausted quota")
            else:
                record("Serper", f"KEY={mask(key)}", "FAIL", f"HTTP {resp.status_code}")
    except Exception as e:
        record("Serper", f"KEY={mask(key)}", "FAIL", "network", str(e))

async def check_upstash(url, token):
    if not url or not token:
        return record("Upstash Redis", f"URL={mask(url)} TOKEN={mask(token)}", "SKIP", "Missing vars")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{url.rstrip('/')}/PING", headers={"Authorization": f"Bearer {token}"})
            if resp.status_code == 200:
                record("Upstash Redis", f"URL={mask(url)} TOKEN={mask(token)}", "PASS", "")
            elif resp.status_code == 401:
                record("Upstash Redis", f"URL={mask(url)} TOKEN={mask(token)}", "FAIL", "auth", "Invalid token")
            else:
                record("Upstash Redis", f"URL={mask(url)} TOKEN={mask(token)}", "FAIL", f"HTTP {resp.status_code}")
    except Exception as e:
        record("Upstash Redis", f"URL={mask(url)} TOKEN={mask(token)}", "FAIL", "network", str(e))

async def check_resend(key):
    if not key:
        return record("Resend", "NONE", "SKIP", "Missing var")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://api.resend.com/domains", headers={"Authorization": f"Bearer {key}"})
            if resp.status_code == 200:
                record("Resend", f"KEY={mask(key)}", "PASS", "")
            elif resp.status_code == 401 or resp.status_code == 403:
                record("Resend", f"KEY={mask(key)}", "FAIL", "auth", "Resend key from wrong team or invalid")
            else:
                record("Resend", f"KEY={mask(key)}", "FAIL", f"HTTP {resp.status_code}")
    except Exception as e:
        record("Resend", f"KEY={mask(key)}", "FAIL", "network", str(e))

async def check_turnstile(secret):
    if not secret:
        return record("Turnstile", "NONE", "SKIP", "Missing var")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={"secret": secret, "response": "dummy"}
            )
            data = resp.json()
            if data.get("error-codes") and "invalid-input-secret" in data.get("error-codes", []):
                record("Turnstile", f"SECRET={mask(secret)}", "FAIL", "auth", "Dummy Turnstile test secret still in place?")
            elif data.get("error-codes") and "invalid-input-response" in data.get("error-codes", []):
                record("Turnstile", f"SECRET={mask(secret)}", "PASS", "")
            else:
                record("Turnstile", f"SECRET={mask(secret)}", "FAIL", "format", str(data.get("error-codes")))
    except Exception as e:
        record("Turnstile", f"SECRET={mask(secret)}", "FAIL", "network", str(e))

async def check_sentry(dsn):
    if not dsn:
        return record("Sentry", "NONE", "SKIP", "Missing var")
    try:
        import sentry_sdk
        sentry_sdk.init(dsn=dsn)
        sentry_sdk.capture_message("Key verification test message")
        record("Sentry", f"DSN={mask(dsn)}", "PASS", "")
    except Exception as e:
        record("Sentry", f"DSN={mask(dsn)}", "FAIL", "init/network", str(e))

async def main():
    print(f"{'SERVICE':15} | {'VARS':40} | {'STAT':4} | {'REASON':20} | {'HINT'}")
    print("-" * 120)
    
    await check_supabase(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
    await check_database(os.getenv("DATABASE_URL"))
    await check_gemini(os.getenv("GEMINI_API_KEY"))
    await check_hf(os.getenv("HF_TOKEN"))
    await check_adzuna(os.getenv("ADZUNA_APP_ID"), os.getenv("ADZUNA_APP_KEY"))
    await check_serper(os.getenv("SERPER_API_KEY"))
    await check_upstash(os.getenv("UPSTASH_REDIS_REST_URL"), os.getenv("UPSTASH_REDIS_REST_TOKEN"))
    await check_resend(os.getenv("RESEND_API_KEY"))
    await check_turnstile(os.getenv("TURNSTILE_SECRET_KEY"))
    await check_sentry(os.getenv("SENTRY_DSN"))
    
    has_fails = any(r["status"] == "FAIL" for r in RESULTS)
    if has_fails:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
