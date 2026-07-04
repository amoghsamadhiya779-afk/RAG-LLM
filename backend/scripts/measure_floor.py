import asyncio
import time
import statistics
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def measure_floor():
    print("Warming up connection pool...")
    async with AsyncSessionLocal() as session:
        await session.execute(text("SELECT 1"))
    
    print("Running SELECT 1 benchmark (5 runs)...")
    latencies = []
    for _ in range(5):
        async with AsyncSessionLocal() as session:
            start = time.perf_counter()
            await session.execute(text("SELECT 1"))
            duration = time.perf_counter() - start
            latencies.append(duration)
            
    median_latency = statistics.median(latencies)
    
    print(f"Latencies: {[f'{l*1000:.1f}ms' for l in latencies]}")
    print(f"Median: {median_latency*1000:.1f}ms")

if __name__ == "__main__":
    asyncio.run(measure_floor())
