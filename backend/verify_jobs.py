import asyncio
import os
import httpx
from dotenv import load_dotenv
import asyncpg

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
CRON_SECRET = os.environ.get("CRON_SECRET")
DATABASE_URL = os.environ.get("DATABASE_URL").replace(":6543", ":5432").replace("postgresql+asyncpg://", "postgresql://")

async def main():
    print("1. Checking DB count...")
    conn = await asyncpg.connect(DATABASE_URL)
    count_before = await conn.fetchval("SELECT count(*) FROM public.jobs")
    print(f"   Count before: {count_before}")
    await conn.close()

    print("\n2. Triggering ingestion API...")
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "http://127.0.0.1:8001/internal/ingest/run",
            headers={"X-Cron-Secret": CRON_SECRET}
        )
        print("Status:", resp.status_code)
        print("Response:", resp.json())

    print("\n3. Checking DB count again...")
    conn = await asyncpg.connect(DATABASE_URL)
    count_after = await conn.fetchval("SELECT count(*) FROM public.jobs")
    print(f"   Count after: {count_after}")
    await conn.close()

    print("\n4. Triggering GET /jobs API...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get("http://127.0.0.1:8001/jobs")
        print("Status:", resp.status_code)
        data = resp.json()
        print(f"Returned {len(data.get('items', []))} jobs.")
        if data.get('items'):
            first_job = data['items'][0]
            print(f"   First job: {first_job.get('title')} at {first_job.get('company')}")
            
if __name__ == "__main__":
    asyncio.run(main())
