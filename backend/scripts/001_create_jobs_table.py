import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

DATABASE_URL = os.environ.get("DATABASE_URL")
# Use direct connection port to avoid pgbouncer prepared statement issues
DATABASE_URL = DATABASE_URL.replace(":6543", ":5432").replace("postgresql+asyncpg://", "postgresql://")

async def run_migration():
    print(f"Connecting to {DATABASE_URL.split('@')[1]} ...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("Dropping existing jobs table and dependencies (if any)...")
        await conn.execute("DROP TABLE IF EXISTS public.jobs CASCADE;")

        print("Creating jobs table if not exists...")
        await conn.execute("create extension if not exists vector;")
        await conn.execute("""
            create table if not exists public.jobs (
              id            uuid primary key default gen_random_uuid(),
              source        text not null,
              external_id   text not null,
              title         text not null,
              company       text,
              location      text,
              remote        boolean default false,
              seniority     text,
              tags          text[] default '{}',
              salary_min    numeric,
              salary_max    numeric,
              currency      text,
              description_html text,
              apply_url     text,
              posted_at     timestamptz,
              embedding     vector(768),
              created_at    timestamptz default now(),
              updated_at    timestamptz default now(),
              unique (source, external_id)
            );
        """)
        await conn.execute("create index if not exists jobs_posted_at_idx on public.jobs (posted_at desc);")
        await conn.execute("create index if not exists jobs_tags_idx on public.jobs using gin (tags);")
        await conn.execute("create index if not exists jobs_embedding_idx on public.jobs using hnsw (embedding vector_cosine_ops);")
        await conn.execute("alter table public.jobs enable row level security;")
        
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE schemaname = 'public' 
                    AND tablename = 'jobs' 
                    AND policyname = 'jobs public read'
                ) THEN
                    CREATE POLICY "jobs public read" on public.jobs for select using (true);
                END IF;
            END
            $$;
        """)
        print("Migration applied successfully.")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_migration())
