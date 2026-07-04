import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import httpx
from app.services.embeddings import embed_text

load_dotenv()

async def main():
    URL = 'https://1amogh212-resume-intelligence.hf.space'
    url = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql://')
    conn = await asyncpg.connect(url, statement_cache_size=0)
    
    # Live API order
    r = httpx.get(f'{URL}/api/v1/jobs?q=machine+learning&limit=5', timeout=30)
    api_items = r.json().get('items', [])
    print('API ORDER:')
    for item in api_items:
        print('-', item.get('title'))
        
    # SQL order
    query = 'machine learning'
    embedding = await embed_text(query)
    vec_str = '[' + ','.join(map(str, embedding)) + ']'
    
    rows = await conn.fetch('SELECT title, embedding <=> $1::vector AS distance FROM jobs WHERE embedding IS NOT NULL ORDER BY distance ASC LIMIT 5', vec_str)
    print('\nSQL ORDER:')
    for r in rows:
        print(f"- {r.get('title')} (dist: {r.get('distance')})")
        
    await conn.close()

asyncio.run(main())
