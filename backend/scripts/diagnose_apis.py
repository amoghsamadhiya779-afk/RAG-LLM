import os, asyncio, sys
import httpx
from dotenv import load_dotenv

load_dotenv()

RESULTS = []
def rec(name, ok, msg=""):
    RESULTS.append((name, ok))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: {msg}")

def missing(*keys):
    return [k for k in keys if not os.getenv(k)]

async def check_gemini():
    if missing("GEMINI_API_KEY"): return rec("Gemini", False, "GEMINI_API_KEY missing")
    try:
        from google import genai
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        r = client.models.embed_content(model="text-embedding-004", contents="ping")
        dims = len(r.embeddings[0].values)
        rec("Gemini embed", dims == 768, f"{dims} dims (expect 768)")
    except Exception as e:
        rec("Gemini", False, repr(e)[:180])

async def check_db():
    url = os.getenv("DATABASE_URL", "")
    if not url: return rec("Postgres", False, "DATABASE_URL missing")
    if not url.startswith("postgresql+asyncpg://"):
        rec("DATABASE_URL form", False, "must start with postgresql+asyncpg://")
    try:
        import asyncpg
        raw = url.replace("postgresql+asyncpg://", "postgresql://")
        conn = await asyncpg.connect(raw, statement_cache_size=0, timeout=15)
        one = await conn.fetchval("SELECT 1")
        ext = await conn.fetchval("SELECT 1 FROM pg_extension WHERE extname='vector'")
        await conn.close()
        rec("Postgres", one == 1, f"SELECT 1 ok; pgvector={'yes' if ext else 'MISSING'}")
    except Exception as e:
        rec("Postgres", False, repr(e)[:180])

async def check_supabase_rest(client):
    base = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not base or not key: return rec("Supabase REST", False, "URL / service_role missing")
    try:
        r = await client.get(f"{base}/rest/v1/", headers={"apikey": key}, timeout=15)
        rec("Supabase REST", r.status_code < 400, f"HTTP {r.status_code}")
    except Exception as e:
        rec("Supabase REST", False, repr(e)[:180])

async def check_jwks(client):
    base = os.getenv("SUPABASE_URL", "").rstrip("/")
    if not base: return rec("Supabase JWKS", False, "SUPABASE_URL missing")
    try:
        r = await client.get(f"{base}/auth/v1/.well-known/jwks.json", timeout=15)
        keys = r.json().get("keys", []) if r.status_code == 200 else []
        rec("Supabase JWKS", bool(keys), f"HTTP {r.status_code}, {len(keys)} keys")
    except Exception as e:
        rec("Supabase JWKS", False, repr(e)[:180])

async def check_adzuna(client):
    if missing("ADZUNA_APP_ID", "ADZUNA_APP_KEY"): return rec("Adzuna", False, "keys missing")
    try:
        r = await client.get(
            "https://api.adzuna.com/v1/api/jobs/gb/search/1",
            params={"app_id": os.environ["ADZUNA_APP_ID"], "app_key": os.environ["ADZUNA_APP_KEY"],
                    "results_per_page": 1, "what": "developer"}, timeout=20)
        rec("Adzuna", r.status_code == 200, f"HTTP {r.status_code}")
    except Exception as e:
        rec("Adzuna", False, repr(e)[:180])

async def check_web_search(client):
    if os.getenv("SERPER_API_KEY"):
        try:
            r = await client.post("https://google.serper.dev/search",
                headers={"X-API-KEY": os.environ["SERPER_API_KEY"], "Content-Type": "application/json"},
                json={"q": "test"}, timeout=20)
            rec("Serper", r.status_code == 200, f"HTTP {r.status_code}")
        except Exception as e:
            rec("Serper", False, repr(e)[:180])
    elif os.getenv("TAVILY_API_KEY"):
        try:
            r = await client.post("https://api.tavily.com/search",
                json={"api_key": os.environ["TAVILY_API_KEY"], "query": "test", "max_results": 1}, timeout=20)
            rec("Tavily", r.status_code == 200, f"HTTP {r.status_code}")
        except Exception as e:
            rec("Tavily", False, repr(e)[:180])
    else:
        rec("Web search", False, "no SERPER_API_KEY or TAVILY_API_KEY")

async def check_upstash(client):
    if missing("UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"): return rec("Upstash", False, "keys missing")
    try:
        r = await client.get(f"{os.environ['UPSTASH_REDIS_REST_URL']}/ping",
            headers={"Authorization": f"Bearer {os.environ['UPSTASH_REDIS_REST_TOKEN']}"}, timeout=15)
        rec("Upstash Redis", r.status_code == 200, f"HTTP {r.status_code}")
    except Exception as e:
        rec("Upstash Redis", False, repr(e)[:180])

async def check_resend(client):
    if missing("RESEND_API_KEY"): return rec("Resend", False, "key missing")
    try:
        r = await client.get("https://api.resend.com/domains",
            headers={"Authorization": f"Bearer {os.environ['RESEND_API_KEY']}"}, timeout=15)
        rec("Resend", r.status_code == 200, f"HTTP {r.status_code}")
    except Exception as e:
        rec("Resend", False, repr(e)[:180])

async def check_turnstile(client):
    if missing("TURNSTILE_SECRET_KEY"): return rec("Turnstile", False, "secret missing")
    try:
        r = await client.post("https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={"secret": os.environ["TURNSTILE_SECRET_KEY"], "response": "dummy"}, timeout=15)
        codes = r.json().get("error-codes", [])
        # valid secret + dummy token -> ['invalid-input-response']; bad secret -> ['invalid-input-secret']
        ok = "invalid-input-secret" not in codes
        rec("Turnstile secret", ok, f"codes={codes}")
    except Exception as e:
        rec("Turnstile", False, repr(e)[:180])

async def check_hf(client):
    if missing("HF_TOKEN"): return rec("HF token", False, "HF_TOKEN missing")
    try:
        r = await client.get("https://huggingface.co/api/whoami-v2",
            headers={"Authorization": f"Bearer {os.environ['HF_TOKEN']}"}, timeout=15)
        rec("HF token", r.status_code == 200, f"HTTP {r.status_code}")
    except Exception as e:
        rec("HF token", False, repr(e)[:180])

async def main():
    await check_gemini()
    await check_db()
    async with httpx.AsyncClient() as client:
        await check_supabase_rest(client)
        await check_jwks(client)
        await check_adzuna(client)
        await check_web_search(client)
        await check_upstash(client)
        await check_resend(client)
        await check_turnstile(client)
        await check_hf(client)
    passed = sum(1 for _, ok in RESULTS if ok)
    print(f"\\n=== {passed}/{len(RESULTS)} checks passed ===")
    sys.exit(0 if passed == len(RESULTS) else 1)

if __name__ == "__main__":
    asyncio.run(main())
