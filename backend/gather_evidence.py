import asyncio
import time
import httpx
from sqlalchemy import text
from app.db.session import AsyncSessionLocal
from app.core.security import create_access_token
import uuid

async def gather_evidence():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT user_id, role FROM profiles LIMIT 4"))
        users = res.fetchall()
        user_a_id = users[0][0] if len(users) > 0 else uuid.uuid4()
        user_b_id = users[1][0] if len(users) > 1 else uuid.uuid4()
        admin_id = users[2][0] if len(users) > 2 else uuid.uuid4()
        employer_id = users[3][0] if len(users) > 3 else uuid.uuid4()
        
        # Ensure we have an admin and employer if possible, otherwise just use whatever.
        res_admin = await db.execute(text("SELECT user_id FROM profiles WHERE role = 'admin' LIMIT 1"))
        if r := res_admin.scalar(): admin_id = r
        
        # The recruiter enum fails in Postgres, just fallback to dummy for employer
        pass
        
        import jwt
        from datetime import datetime, timedelta, timezone
        from app.core.config import settings
        import os
        
        secret = os.environ.get("SUPABASE_JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")
        
        def create_token(data: dict):
            to_encode = data.copy()
            expire = datetime.now(timezone.utc) + timedelta(minutes=60)
            to_encode.update({"exp": expire})
            return jwt.encode(to_encode, secret, algorithm="HS256")
            
        token_a = create_token({"sub": str(user_a_id), "role": "seeker"})
        token_b = create_token({"sub": str(user_b_id), "role": "seeker"})
        token_admin = create_token({"sub": str(admin_id), "role": "admin"})
        token_employer = create_token({"sub": str(employer_id), "role": "employer"})
        
        # 1. Admin 403 / 200 pair
        print("--- Admin 403/200 Pair ---")
        async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1") as client:
            r_403 = await client.get("/admin/stats", headers={"Authorization": f"Bearer {token_a}"})
            print(f"Seeker on /admin/stats -> {r_403.status_code}")
            r_200 = await client.get("/admin/stats", headers={"Authorization": f"Bearer {token_admin}"})
            print(f"Admin on /admin/stats -> {r_200.status_code}")
            
        # 2. Employer role gate + Embedding not-null
        print("\n--- Employer Role Gate & Embedding ---")
        async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1") as client:
            r_seek_job = await client.post("/jobs", headers={"Authorization": f"Bearer {token_a}"}, json={"title": "Test", "description": "Test", "location": "Test"})
            print(f"Seeker creating job -> {r_seek_job.status_code}")
            
            res = await db.execute(text("SELECT count(*) FROM jobs WHERE embedding IS NULL"))
            null_count = res.scalar()
            print(f"Jobs with NULL embedding in DB -> {null_count}")

        # 3. Two-Account Ownership Test
        print("\n--- Two-Account Ownership Test ---")
        async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1") as client:
            res = await db.execute(text("SELECT id FROM jobs LIMIT 1"))
            job_id = res.scalar()
            if job_id:
                app_res = await client.post(f"/jobs/{job_id}/applications", headers={"Authorization": f"Bearer {token_a}"}, json={"resume_id": str(uuid.uuid4()), "cover_letter": "Hi"})
                
                # Check idempotency
                if app_res.status_code == 200:
                    app_id = app_res.json()["id"]
                    r_b = await client.patch(f"/applications/{app_id}", headers={"Authorization": f"Bearer {token_b}"}, json={"stage": "withdrawn"})
                    print(f"User B accessing User A's application -> {r_b.status_code}")
                elif app_res.status_code == 409:
                    print("User A already applied.")
                    # Get the app id directly
                    res = await db.execute(text(f"SELECT id FROM applications WHERE user_id = '{user_a_id}' LIMIT 1"))
                    app_id = res.scalar()
                    if app_id:
                        r_b = await client.patch(f"/applications/{app_id}", headers={"Authorization": f"Bearer {token_b}"}, json={"stage": "withdrawn"})
                        print(f"User B accessing User A's application -> {r_b.status_code}")
                        
                app_res2 = await client.post(f"/jobs/{job_id}/applications", headers={"Authorization": f"Bearer {token_a}"}, json={"resume_id": str(uuid.uuid4()), "cover_letter": "Hi"})
                print(f"Apply Idempotency (User A applies again) -> {app_res2.status_code} {app_res2.json().get('detail', '')}")

        # 4. Saved Jobs
        print("\n--- Saved Jobs ---")
        async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1") as client:
            r_guest = await client.post(f"/saved", json={"job_id": str(job_id)})
            print(f"Guest save (no auth header) -> {r_guest.status_code} (Frontend intercepts this usually)")
            r_logged = await client.post(f"/saved", headers={"Authorization": f"Bearer {token_a}"}, json={"job_id": str(job_id)})
            print(f"Logged-in save -> {r_logged.status_code}")
            
        # 5. p50 Timings
        print("\n--- p50 Timings ---")
        async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1") as client:
            times = []
            for _ in range(10):
                t0 = time.time()
                await client.get("/jobs?page_size=20")
                times.append(time.time() - t0)
            times.sort()
            p50 = times[len(times)//2] * 1000
            print(f"/jobs p50 Timing: {p50:.2f}ms")

if __name__ == '__main__':
    asyncio.run(gather_evidence())
