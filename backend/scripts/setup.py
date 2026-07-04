import os, asyncio
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def setup():
    url = os.getenv("DATABASE_URL", "").replace("postgresql+asyncpg://", "postgresql://")
    try:
        conn = await asyncpg.connect(url, statement_cache_size=0, timeout=15)
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        print("Successfully created pgvector extension!")
        await conn.close()
    except Exception as e:
        print(f"Failed to create pgvector: {e}")

    try:
        from google import genai
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        for m in client.models.list():
            if "embed" in m.name or "text-embedding" in m.name:
                print(f"Available embedding model: {m.name}")
    except Exception as e:
        print(f"Gemini error: {e}")

if __name__ == "__main__":
    asyncio.run(setup())
