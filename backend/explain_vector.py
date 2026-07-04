import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def explain_query():
    dummy_vector = '[' + ','.join(['0.1']*768) + ']'
    async with AsyncSessionLocal() as db:
        res = await db.execute(text(f"""
            EXPLAIN (ANALYZE, BUFFERS) 
            SELECT id FROM jobs 
            ORDER BY embedding <=> '{dummy_vector}'::vector 
            LIMIT 5;
        """))
        for row in res.fetchall():
            print(row[0])

if __name__ == '__main__':
    asyncio.run(explain_query())
