import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import httpx

load_dotenv()

async def main():
    URL = 'https://1amogh212-resume-intelligence.hf.space'
    CRON_SECRET = os.getenv('CRON_SECRET')
    
    with open('diagnostic_results.txt', 'w', encoding='utf-8') as f:
        # a) Curl live
        r_jobs = httpx.get(f'{URL}/api/v1/jobs?limit=3', timeout=30)
        f.write('--- 1a) Live /api/v1/jobs?limit=3 ---\n')
        f.write(r_jobs.text[:1000] + '\n\n')
        
        # b) SQL counts
        url = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql://')
        conn = await asyncpg.connect(url)
        total = await conn.fetchval('SELECT count(*) FROM jobs')
        nulls = await conn.fetchval('SELECT count(*) FROM jobs WHERE embedding IS NULL')
        f.write('--- 1b) SQL Counts ---\n')
        f.write(f'Total: {total}\n')
        f.write(f'Null embeddings: {nulls}\n\n')
        
        # c) DB Host
        import urllib.parse
        parsed = urllib.parse.urlparse(url)
        f.write('--- 1c) Local DB Host ---\n')
        f.write(f'{parsed.hostname}\n\n')
        
        # 2) /internal/diagnostics
        f.write('--- 2) /internal/diagnostics ---\n')
        r_diag_unauth = httpx.get(f'{URL}/internal/diagnostics', timeout=10)
        f.write(f'Unauth status: {r_diag_unauth.status_code}\n')
        
        r_diag_auth = httpx.get(f'{URL}/internal/diagnostics', headers={'X-Cron-Secret': CRON_SECRET}, timeout=30)
        f.write(f'Auth status: {r_diag_auth.status_code}\n')
        f.write(f'Auth body: {r_diag_auth.text[:200]}\n\n')

        # 3) Newest row dims
        f.write('--- 3) Newest Row vector_dims ---\n')
        newest_dim = await conn.fetchval('SELECT vector_dims(embedding) FROM jobs WHERE embedding IS NOT NULL ORDER BY created_at DESC LIMIT 1')
        f.write(f'vector_dims: {newest_dim}\n\n')
        
        # also fetch what the ingest run wrote.
        newest_jobs = await conn.fetch('SELECT title, created_at, source FROM jobs ORDER BY created_at DESC LIMIT 5')
        f.write('--- 1d) Newest Jobs in DB ---\n')
        for j in newest_jobs:
            f.write(f"{j.get('title')} - {j.get('source')} - {j.get('created_at')}\n")
        
        await conn.close()

asyncio.run(main())
