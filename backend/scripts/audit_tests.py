import os
import sys
import time
import json
import requests
import statistics
from supabase import create_client

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_step(title):
    print(f"\n{'='*10} {title} {'='*10}\n")

def request_and_print(method, endpoint, headers=None, json_data=None, expected_status=None, silent=False):
    url = f"{BASE_URL}{endpoint}"
    if not silent:
        print(f"> {method} {endpoint}")
        if json_data:
            print(f"> Body: {json.dumps(json_data)}")
        if headers and "Authorization" in headers:
            print("> Authorization: Bearer <TOKEN>")
            
    res = requests.request(method, url, headers=headers, json=json_data)
    
    if not silent:
        print(f"< {res.status_code} {res.reason}")
        try:
            print(f"< {json.dumps(res.json())}")
        except:
            print(f"< {res.text}")
        print()
        
    if expected_status:
        if isinstance(expected_status, list):
            assert res.status_code in expected_status, f"Expected {expected_status}, got {res.status_code}"
        else:
            assert res.status_code == expected_status, f"Expected {expected_status}, got {res.status_code}"
    return res

print_step("0. STARTUP GUARD")
started = False
for _ in range(30):
    try:
        r = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health", timeout=1)
        if r.status_code == 200:
            started = True
            break
    except requests.exceptions.RequestException:
        pass
    time.sleep(1)

if not started:
    print("FATAL: Server did not start within 30s")
    sys.exit(1)
print("Server is UP!")

print_step("SETUP FIXTURES")
# Get a job ID
res = request_and_print("GET", "/jobs?limit=1", silent=True)
jobs = res.json().get("items", [])
if not jobs:
    print("FATAL: No jobs in database to test with.")
    sys.exit(1)
job_id = jobs[0]["id"]
print(f"Fixture Job ID: {job_id}")

# Create Users
email_a = f"usera_{time.time()}@example.com"
res_a = request_and_print("POST", "/auth/sign-up", json_data={"email": email_a, "password": "password", "fullName": "User A", "role": "seeker"}, expected_status=200)
token_a = res_a.json()["token"]
user_a_id = res_a.json()["user"]["id"]

email_b = f"userb_{time.time()}@example.com"
res_b = request_and_print("POST", "/auth/sign-up", json_data={"email": email_b, "password": "password", "fullName": "User B", "role": "seeker"}, expected_status=200)
token_b = res_b.json()["token"]

# Upload PDF to Supabase
supa_url = os.environ.get("SUPABASE_URL")
supa_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not supa_url or not supa_key:
    # hack to load env vars
    from dotenv import load_dotenv
    load_dotenv()
    supa_url = os.environ.get("SUPABASE_URL")
    supa_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(supa_url, supa_key)
storage_path = f"{user_a_id}/test_resume.pdf"
pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
supabase.storage.from_("resumes").upload(storage_path, pdf_bytes)
print(f"Uploaded minimal PDF to {storage_path}")

res_resume = request_and_print("POST", "/resumes", headers={"Authorization": f"Bearer {token_a}"}, json_data={"filename": "test.pdf", "storage_path": storage_path}, expected_status=200)
resume_id = res_resume.json()["id"]

print_step("1. OWNERSHIP (RESUMES)")
# Positive control
request_and_print("GET", f"/resumes/{resume_id}", headers={"Authorization": f"Bearer {token_a}"}, expected_status=200)
# Negative control (User B)
request_and_print("GET", f"/resumes/{resume_id}", headers={"Authorization": f"Bearer {token_b}"}, expected_status=403)
# Negative control (No token)
request_and_print("GET", f"/resumes/{resume_id}", expected_status=401)
# B should not list A's resume
res_mine = request_and_print("GET", "/resumes/mine", headers={"Authorization": f"Bearer {token_b}"}, expected_status=200)
assert len(res_mine.json()) == 0, "User B should have 0 resumes"

print_step("2. APPLY TWICE")
# First apply
res_app = request_and_print("POST", f"/jobs/{job_id}/applications", headers={"Authorization": f"Bearer {token_a}"}, json_data={"jobId": job_id, "resume_id": resume_id, "cover_note": "Hello"}, expected_status=200)
application_id = res_app.json()["id"]
# Second apply
request_and_print("POST", f"/jobs/{job_id}/applications", headers={"Authorization": f"Bearer {token_a}"}, json_data={"jobId": job_id, "resume_id": resume_id, "cover_note": "Hello"}, expected_status=409)

print_step("1b. OWNERSHIP (APPLICATIONS)")
# Positive control: A lists their own apps
res_my_apps = request_and_print("GET", "/applications/mine", headers={"Authorization": f"Bearer {token_a}"}, expected_status=200)
assert len(res_my_apps.json()) == 1, "User A should have 1 application"
# B lists their own apps
res_b_apps = request_and_print("GET", "/applications/mine", headers={"Authorization": f"Bearer {token_b}"}, expected_status=200)
assert len(res_b_apps.json()) == 0, "User B should have 0 applications"

print_step("3. SAVED JOBS")
# Empty GET
request_and_print("GET", "/saved", headers={"Authorization": f"Bearer {token_a}"}, expected_status=200)
# POST No Token
request_and_print("POST", f"/saved/{job_id}", expected_status=401)
# POST With Token
request_and_print("POST", f"/saved/{job_id}", headers={"Authorization": f"Bearer {token_a}"}, expected_status=200)
# GET with token (should see it)
res_saved = request_and_print("GET", "/saved", headers={"Authorization": f"Bearer {token_a}"}, expected_status=200)
assert len(res_saved.json()["items"]) == 1, "Should have 1 saved job"
# DELETE
request_and_print("DELETE", f"/saved/{job_id}", headers={"Authorization": f"Bearer {token_a}"}, expected_status=200)
# GET empty
res_saved_empty = request_and_print("GET", "/saved", headers={"Authorization": f"Bearer {token_a}"}, expected_status=200)
assert len(res_saved_empty.json()["items"]) == 0, "Should have 0 saved jobs"

print_step("4. HTTP p50 LATENCY")
endpoints = [
    "/jobs?limit=20",
    f"/jobs/{job_id}",
    "/jobs?q=engineer",
    "/saved"
]

results = []
for ep in endpoints:
    url = f"{BASE_URL}{ep}"
    headers = {"Authorization": f"Bearer {token_a}"} if "saved" in ep else None
    
    # Warmup
    requests.get(url, headers=headers)
    
    # 5 runs
    times = []
    for _ in range(5):
        t0 = time.time()
        requests.get(url, headers=headers)
        times.append(time.time() - t0)
    
    p50 = statistics.median(times)
    results.append((ep, p50))

print("| Endpoint | p50 latency (5 requests) |")
print("|----------|--------------------------|")
for ep, p50 in results:
    print(f"| {ep} | {p50*1000:.1f}ms |")

print_step("CLEANUP")
supabase.storage.from_("resumes").remove([storage_path])
print("Deleted Supabase storage object")
request_and_print("DELETE", f"/resumes/{resume_id}", headers={"Authorization": f"Bearer {token_a}"}, expected_status=200)
print("Deleted Resume (and Application cascades via DB foreign key)")
print("\nAUDIT SCRIPT COMPLETED SUCCESSFULLY.")
