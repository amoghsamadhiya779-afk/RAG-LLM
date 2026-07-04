import asyncio
import os
from dotenv import load_dotenv
import asyncpg
from app.services.embeddings import embed_text

load_dotenv()

async def main():
    url = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql://')
    conn = await asyncpg.connect(url)
    
    query = 'machine learning'
    embedding = await embed_text(query)
    vec_str = '[' + ','.join(map(str, embedding)) + ']'
    
    rows = await conn.fetch('SELECT id, title, embedding <=> $1::vector AS distance FROM jobs WHERE embedding IS NOT NULL ORDER BY distance ASC LIMIT 5', vec_str)
    print('SQL Results:')
    for r in rows:
        print(f'{r["title"]} (dist: {r["distance"]})')
    
    await conn.close()

asyncio.run(main())
