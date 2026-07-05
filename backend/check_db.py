import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT data_type FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'tags';"))
        print('tags type:', res.scalar())
        
        # Check if any tag contains employment info
        res_tags = await db.execute(text("SELECT tags FROM jobs WHERE tags IS NOT NULL LIMIT 20;"))
        for r in res_tags:
            print('sample tags:', r[0])

asyncio.run(main())