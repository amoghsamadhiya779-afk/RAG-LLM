import uuid

import pytest


# Helper to create a live job
def create_live_job(employer_client, admin_client, title="Software Engineer"):
    resp = employer_client.post("/jobs", json={
        "title": title,
        "description": "We need a professional developer.",
        "requirements": ["Python", "FastAPI"]
    })
    assert resp.status_code == 201
    job_id = resp.json()["id"]
    app_resp = admin_client.post(f"/admin/jobs/{job_id}/approve")
    assert app_resp.status_code == 200
    return job_id

# Helper to upload a resume
def upload_resume(seeker_client, filename="resume.pdf", content=b"Mock PDF content"):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
    ).encode() + content + f"\r\n--{boundary}--\r\n".encode()
    
    resp = seeker_client.post("/resumes/upload", content=body, headers={
        "content-type": f"multipart/form-data; boundary={boundary}"
    })
    assert resp.status_code == 201
    return resp.json()["id"]

# Feature 1: Auth & Profile

def test_signup_invalid_email(api_client):
    resp = api_client.post("/auth/sign-up", json={
        "email": "invalid_email.com",
        "password": "password123",
        "role": "seeker",
        "fullName": "Bad Email"
    })
    assert resp.status_code in (400, 422)

def test_signup_weak_password(api_client):
    resp = api_client.post("/auth/sign-up", json={
        "email": "test@example.com",
        "password": "123",
        "role": "seeker",
        "fullName": "Weak Pwd"
    })
    assert resp.status_code in (400, 422)

def test_signin_wrong_password(api_client):
    email = f"user-{uuid.uuid4()}@example.com"
    api_client.post("/auth/sign-up", json={
        "email": email,
        "password": "password123",
        "role": "seeker",
        "fullName": "Test User"
    })
    
    resp = api_client.post("/auth/sign-in", json={
        "email": email,
        "password": "wrongpassword"
    })
    assert resp.status_code == 401

def test_unauthorized_access(api_client):
    resp = api_client.get("/auth/me")
    assert resp.status_code in (401, 403)

def test_update_profile_invalid_fields(employer_client):
    # Send empty company name
    resp = employer_client.put("/companies/profile", json={
        "name": ""
    })
    assert resp.status_code in (400, 422)

# Feature 2: Job Board & RAG

def test_search_empty_query(api_client):
    resp = api_client.get("/jobs/search", params={"q": "   "})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_jobs_invalid_pagination(api_client):
    resp = api_client.get("/jobs", params={"page": -1, "limit": -10})
    assert resp.status_code == 422

def test_recommendations_nonexistent_resume(api_client):
    resp = api_client.get("/jobs/recommended", params={"resumeId": str(uuid.uuid4())})
    assert resp.status_code == 404

def test_similar_nonexistent_job(api_client):
    resp = api_client.get(f"/jobs/{uuid.uuid4()}/similar")
    assert resp.status_code == 404

def test_search_extreme_length(api_client):
    long_q = "a" * 1005
    resp = api_client.get("/jobs/search", params={"q": long_q})
    assert resp.status_code in (400, 422)

# Feature 3: Job CRUD & Admin

def test_seeker_cannot_create_job(seeker_client):
    resp = seeker_client.post("/jobs", json={
        "title": "Malicious Job Posting",
        "description": "Seeker posting job."
    })
    assert resp.status_code == 403

def test_nonadmin_cannot_approve(employer_client):
    job_id = str(uuid.uuid4())
    resp = employer_client.post(f"/admin/jobs/{job_id}/approve")
    assert resp.status_code == 403

def test_job_negative_salary(employer_client):
    resp = employer_client.post("/jobs", json={
        "title": "Underpaid Dev",
        "description": "Must pay us to work.",
        "salaryMin": -50000
    })
    assert resp.status_code in (400, 422)

def test_job_invalid_status(employer_client, admin_client):
    job_id = create_live_job(employer_client, admin_client)
    resp = employer_client.patch(f"/jobs/{job_id}", json={
        "status": "unknown_status"
    })
    assert resp.status_code in (400, 422)

def test_non_admin_cannot_modify_job_status_or_featured(employer_client, admin_client):
    job_id = create_live_job(employer_client, admin_client)
    
    # Non-admin try to set status to live -> 403
    resp = employer_client.patch(f"/jobs/{job_id}", json={"status": "live"})
    assert resp.status_code == 403
    
    # Non-admin try to set status to rejected -> 403
    resp = employer_client.patch(f"/jobs/{job_id}", json={"status": "rejected"})
    assert resp.status_code == 403
    
    # Non-admin try to set status to pending -> allowed
    resp = employer_client.patch(f"/jobs/{job_id}", json={"status": "pending"})
    assert resp.status_code == 200
    
    # Non-admin try to modify featured -> 403
    resp = employer_client.patch(f"/jobs/{job_id}", json={"featured": True})
    assert resp.status_code == 403

def test_admin_can_modify_job_status_and_featured(employer_client, admin_client):
    job_id = create_live_job(employer_client, admin_client)
    
    # Admin can change status
    resp = admin_client.patch(f"/jobs/{job_id}", json={"status": "rejected"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"
    
    # Admin can change featured
    resp = admin_client.patch(f"/jobs/{job_id}", json={"featured": True})
    assert resp.status_code == 200
    assert resp.json()["featured"] is True

def test_job_create_missing_fields(employer_client):
    resp = employer_client.post("/jobs", json={
        # Missing title and description
        "salaryMin": 50000
    })
    assert resp.status_code in (400, 422)

# Feature 4: Resume RAG

def test_upload_unsupported_type(seeker_client):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="virus.exe"\r\n'
        "Content-Type: application/octet-stream\r\n\r\n"
        "Malicious executable content\r\n"
        f"--{boundary}--\r\n"
    )
    resp = seeker_client.post("/resumes/upload", content=body, headers={
        "content-type": f"multipart/form-data; boundary={boundary}"
    })
    assert resp.status_code == 400

def test_parse_nonexistent_resume(seeker_client):
    resp = seeker_client.post(f"/resumes/{uuid.uuid4()}/parse")
    assert resp.status_code == 404

def test_upload_oversized_file(seeker_client):
    # Create large body > 10MB
    large_content = b"0" * (11 * 1024 * 1024)
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="giant_resume.pdf"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
    ).encode() + large_content + f"\r\n--{boundary}--\r\n".encode()
    
    resp = seeker_client.post("/resumes/upload", content=body, headers={
        "content-type": f"multipart/form-data; boundary={boundary}"
    })
    assert resp.status_code in (400, 413)

def test_parse_empty_resume(seeker_client):
    resume_id = upload_resume(seeker_client, filename="empty_resume.pdf", content=b"")
    resp = seeker_client.post(f"/resumes/{resume_id}/parse")
    assert resp.status_code in (200, 202)
    # Check that parsed fields are empty
    parsed_resp = seeker_client.get(f"/resumes/{resume_id}/parsed-data")
    assert parsed_resp.status_code == 200
    parsed = parsed_resp.json()
    assert len(parsed["skills"]) == 0
    assert len(parsed["experience"]) == 0

def test_parse_concurrent_requests(seeker_client):
    resume_id = upload_resume(seeker_client, filename="normal_resume.pdf")
    
    # We will trigger parsing once
    resp1 = seeker_client.post(f"/resumes/{resume_id}/parse")
    assert resp1.status_code in (200, 202)
    
    # Send a concurrent/subsequent request right away (which will hit "parsing" state)
    # Note: Since this is mocked synchronous code, we manually set state to parsing
    # and trigger another call. The mock transport checks db.parsing_states.
    import conftest
    conftest.db.parsing_states[resume_id] = "parsing"
    
    resp2 = seeker_client.post(f"/resumes/{resume_id}/parse")
    assert resp2.status_code == 409

# Feature 5: Applications & Saved

def test_apply_twice(seeker_client, employer_client, admin_client):
    job_id = create_live_job(employer_client, admin_client)
    resume_id = upload_resume(seeker_client)
    
    resp1 = seeker_client.post(f"/jobs/{job_id}/apply", json={"resumeId": resume_id})
    assert resp1.status_code == 201
    
    resp2 = seeker_client.post(f"/jobs/{job_id}/apply", json={"resumeId": resume_id})
    assert resp2.status_code in (400, 409)

def test_seeker_cannot_view_others_applications(seeker_client, employer_client, admin_client, api_client):
    job_id = create_live_job(employer_client, admin_client)
    resume_id = upload_resume(seeker_client)
    
    # Seeker A applies
    app_resp = seeker_client.post(f"/jobs/{job_id}/apply", json={"resumeId": resume_id})
    app_id = app_resp.json()["id"]
    
    # Seeker B registers and signs in
    seeker_b = api_client
    email = f"seeker-b-{uuid.uuid4()}@example.com"
    seeker_b.post("/auth/sign-up", json={
        "email": email,
        "password": "password123",
        "role": "seeker",
        "fullName": "Seeker B"
    })
    token = seeker_b.post("/auth/sign-in", json={"email": email, "password": "password123"}).json()["token"]
    seeker_b.headers["Authorization"] = f"Bearer {token}"
    
    # Seeker B tries to view Seeker A's application
    resp = seeker_b.get(f"/applications/{app_id}")
    assert resp.status_code == 403

def test_apply_nonexistent_job(seeker_client):
    resume_id = upload_resume(seeker_client)
    resp = seeker_client.post(f"/jobs/{uuid.uuid4()}/apply", json={"resumeId": resume_id})
    assert resp.status_code == 404

def test_update_application_invalid_stage(seeker_client, employer_client, admin_client):
    job_id = create_live_job(employer_client, admin_client)
    resume_id = upload_resume(seeker_client)
    
    app_resp = seeker_client.post(f"/jobs/{job_id}/apply", json={"resumeId": resume_id})
    app_id = app_resp.json()["id"]
    
    resp = employer_client.patch(f"/applications/{app_id}", json={
        "stage": "hired_by_accident"
    })
    assert resp.status_code in (400, 422)

def test_apply_missing_resume_or_cover(seeker_client, employer_client, admin_client):
    job_id = create_live_job(employer_client, admin_client)
    # Missing resumeId
    resp = seeker_client.post(f"/jobs/{job_id}/apply", json={
        "coverNote": "Please look at me."
    })
    assert resp.status_code in (400, 422)
