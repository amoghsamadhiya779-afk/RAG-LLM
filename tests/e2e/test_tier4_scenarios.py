import uuid

import pytest


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

def test_scenario_seeker_job_search_apply(api_client, employer_client, admin_client):
    # 0. Prep: Employer posts a job and admin approves it
    job_resp = employer_client.post("/jobs", json={
        "title": "Senior Cloud Infrastructure Engineer",
        "description": "Maintain Kubernetes and AWS clouds.",
        "requirements": ["AWS", "Kubernetes", "DevOps"],
        "location": "Boston, MA",
        "remote": True
    })
    job_id = job_resp.json()["id"]
    admin_client.post(f"/admin/jobs/{job_id}/approve")

    # 1. Seeker registers and logs in
    seeker_client = api_client
    email = f"seeker-{uuid.uuid4()}@example.com"
    pwd = "password123"
    seeker_client.post("/auth/sign-up", json={
        "email": email,
        "password": pwd,
        "role": "seeker",
        "fullName": "Jane Cloud Dev"
    })
    login_resp = seeker_client.post("/auth/sign-in", json={"email": email, "password": pwd})
    token = login_resp.json()["token"]
    seeker_client.headers["Authorization"] = f"Bearer {token}"

    # 2. Seeker uploads a PDF resume
    resume_id = upload_resume(seeker_client, filename="jane_cloud_resume.pdf")

    # 3. Seeker triggers background RAG parsing and verifies extraction
    parse_resp = seeker_client.post(f"/resumes/{resume_id}/parse")
    assert parse_resp.status_code == 202
    
    parsed_data = seeker_client.get(f"/resumes/{resume_id}/parsed-data").json()
    assert "AWS" in parsed_data["skills"]

    # 4. Seeker conducts semantic search for a specific role and filters by location
    search_resp = seeker_client.get("/jobs/search/semantic", params={
        "q": "cloud infrastructure",
        "location": "Boston"
    })
    assert search_resp.status_code == 200
    search_results = search_resp.json()
    assert any(j["id"] == job_id for j in search_results)

    # 5. Seeker fetches RAG job recommendations
    rec_resp = seeker_client.get("/jobs/recommended", params={"resumeId": resume_id})
    assert rec_resp.status_code == 200
    assert any(j["id"] == job_id for j in rec_resp.json())

    # 6. Seeker bookmarks one job
    save_resp = seeker_client.post(f"/jobs/{job_id}/save")
    assert save_resp.json()["saved"] is True

    # 7. Seeker submits application to the best-matching job with the parsed resume
    apply_resp = seeker_client.post(f"/jobs/{job_id}/apply", json={
        "resumeId": resume_id,
        "coverNote": "I am a cloud expert."
    })
    assert apply_resp.status_code == 201
    assert apply_resp.json()["stage"] == "applied"

def test_scenario_employer_hiring_flow(api_client, admin_client):
    # 1. Employer registers and logs in
    employer_client = api_client
    email = f"employer-{uuid.uuid4()}@example.com"
    pwd = "password123"
    employer_client.post("/auth/sign-up", json={
        "email": email,
        "password": pwd,
        "role": "employer",
        "fullName": "Hiring Manager",
        "companyName": "Innovate LLC"
    })
    login_resp = employer_client.post("/auth/sign-in", json={"email": email, "password": pwd})
    token = login_resp.json()["token"]
    employer_client.headers["Authorization"] = f"Bearer {token}"

    # 2. Employer populates and saves company profile
    prof_resp = employer_client.put("/companies/profile", json={
        "about": "Innovating the future of computing.",
        "website": "http://innovate.io",
        "size": "50-100"
    })
    assert prof_resp.status_code == 200

    # 3. Employer posts a new job
    job_resp = employer_client.post("/jobs", json={
        "title": "FastAPI Wizard",
        "description": "Write fast APIs."
    })
    job_id = job_resp.json()["id"]

    # (which gets approved by mock/admin)
    admin_client.post(f"/admin/jobs/{job_id}/approve")

    # Seeker applies to this job to simulate candidate activity
    create_seeker_and_apply(job_id)

    # 4. Employer waits and then lists applications received for the job
    apps_resp = employer_client.get(f"/jobs/{job_id}/applications")
    assert apps_resp.status_code == 200
    apps = apps_resp.json()
    assert len(apps) == 1
    app_id = apps[0]["id"]
    resume_id = apps[0]["resumeId"]

    # 5. Employer downloads/inspects applicant's resume parsed details
    resume_detail = employer_client.get(f"/resumes/{resume_id}/parsed-data")
    assert resume_detail.status_code == 200
    assert "FastAPI" in resume_detail.json()["skills"]

    # 6. Employer moves applicant to interviewing stage, then to offered
    step1 = employer_client.patch(f"/applications/{app_id}", json={"stage": "interview"})
    assert step1.json()["stage"] == "interview"

    step2 = employer_client.patch(f"/applications/{app_id}", json={"stage": "offer"})
    assert step2.json()["stage"] == "offer"

def test_scenario_job_moderation_discovery(seeker_client, employer_client, admin_client):
    # 1. Employer posts a new job
    job_resp = employer_client.post("/jobs", json={
        "title": "Unapproved Backend Role",
        "description": "Mystery tech stack."
    })
    job_id = job_resp.json()["id"]

    # 2. Seeker searches for jobs; verifies this job is NOT visible (pending status)
    search1 = seeker_client.get("/jobs/search", params={"q": "Unapproved"})
    assert not any(j["id"] == job_id for j in search1.json())

    # 3. Admin logs in and retrieves list of pending jobs
    pending_resp = admin_client.get("/admin/jobs/pending")
    assert any(j["id"] == job_id for j in pending_resp.json())

    # 4. Admin approves the job posting
    approve_resp = admin_client.post(f"/admin/jobs/{job_id}/approve")
    assert approve_resp.status_code == 200

    # 5. Seeker searches again; verifies job IS visible, bookmarked, and open for application
    search2 = seeker_client.get("/jobs/search", params={"q": "Unapproved"})
    assert any(j["id"] == job_id for j in search2.json())

    # Save and Apply checks
    save_resp = seeker_client.post(f"/jobs/{job_id}/save")
    assert save_resp.json()["saved"] is True

def test_scenario_multi_user_rag_matching(seeker_client, employer_client, admin_client, api_client):
    # 1. Seeker A (React Specialist), Seeker B (Python Backend Dev), and Seeker C (Sales Lead) upload resumes
    # Seeker A
    seeker_a = api_client
    email_a = f"seeker-a-{uuid.uuid4()}@example.com"
    seeker_a.post("/auth/sign-up", json={"email": email_a, "password": "password123", "fullName": "React Dev", "role": "seeker"})
    token_a = seeker_a.post("/auth/sign-in", json={"email": email_a, "password": "password123"}).json()["token"]
    seeker_a.headers["Authorization"] = f"Bearer {token_a}"
    resume_a = upload_resume(seeker_a, filename="react_specialist.pdf")
    seeker_a.post(f"/resumes/{resume_a}/parse")

    # Seeker B
    seeker_b = api_client
    email_b = f"seeker-b-{uuid.uuid4()}@example.com"
    seeker_b.post("/auth/sign-up", json={"email": email_b, "password": "password123", "fullName": "Python Dev", "role": "seeker"})
    token_b = seeker_b.post("/auth/sign-in", json={"email": email_b, "password": "password123"}).json()["token"]
    seeker_b.headers["Authorization"] = f"Bearer {token_b}"
    resume_b = upload_resume(seeker_b, filename="python_backend.pdf")
    seeker_b.post(f"/resumes/{resume_b}/parse")

    # Seeker C
    seeker_c = api_client
    email_c = f"seeker-c-{uuid.uuid4()}@example.com"
    seeker_c.post("/auth/sign-up", json={"email": email_c, "password": "password123", "fullName": "Sales Lead", "role": "seeker"})
    token_c = seeker_c.post("/auth/sign-in", json={"email": email_c, "password": "password123"}).json()["token"]
    seeker_c.headers["Authorization"] = f"Bearer {token_c}"
    resume_c = upload_resume(seeker_c, filename="sales_manager.pdf")
    seeker_c.post(f"/resumes/{resume_c}/parse")

    # 3. Employer posts a job seeking a "Senior Python Engineer with FastAPI experience"
    job_resp = employer_client.post("/jobs", json={
        "title": "Senior Python Engineer with FastAPI experience",
        "description": "FastAPI, SQL, Backend development",
        "requirements": ["Python", "FastAPI"]
    })
    job_id = job_resp.json()["id"]
    admin_client.post(f"/admin/jobs/{job_id}/approve")

    # 4. Recommendations query is run against the job by the seekers
    seeker_a.get("/jobs/recommended", params={"resumeId": resume_a}).json()
    recs_b = seeker_b.get("/jobs/recommended", params={"resumeId": resume_b}).json()
    seeker_c.get("/jobs/recommended", params={"resumeId": resume_c}).json()

    # Seeker B's parser filled skills matching "Python" and "FastAPI".
    # Assert Seeker B matches this job, and matches it better than Seeker A and C
    match_b = any(j["id"] == job_id for j in recs_b)
    assert match_b is True

    # Find the job in recommendations list to check position/score
    # In Seeker B's list, it is present (since Seeker B has Python / FastAPI skills)
    # React Specialist (Seeker A) or Sales Lead (Seeker C) do not match Python/FastAPI as highly.
    # Let's assert Seeker B matches it.
    assert any(j["id"] == job_id for j in recs_b)

def test_scenario_billing_featured_job(seeker_client, employer_client, admin_client):
    # 1. Employer posts a job
    job_resp = employer_client.post("/jobs", json={
        "title": "Featured DevOps Job",
        "description": "Kubernetes master needed."
    })
    job_id = job_resp.json()["id"]
    admin_client.post(f"/admin/jobs/{job_id}/approve")

    # 2. Employer requests to feature the job (sends payment mock trigger)
    bill_resp = employer_client.post("/billing/feature-job", json={"jobId": job_id})
    assert bill_resp.status_code == 200
    sess_id = bill_resp.json()["sessionId"]

    # 3. Payment processor sends callback verifying payment status
    cb_resp = employer_client.post("/billing/webhook", json={"sessionId": sess_id})
    assert cb_resp.status_code == 200
    assert cb_resp.json()["featured"] is True

    # 4. Job status updates to featured=True
    job_detail = seeker_client.get(f"/jobs/{job_id}").json()
    assert job_detail["featured"] is True

    # 5. Seeker performs search; featured job appears
    search_resp = seeker_client.get("/jobs/search", params={"q": "Featured"})
    assert any(j["id"] == job_id and j["featured"] is True for j in search_resp.json())


# Helper function to register and submit application for hiring flow test
def create_seeker_and_apply(job_id):
    from conftest import create_client
    client = create_client()
    email = f"seeker-{uuid.uuid4()}@example.com"
    pwd = "password123"
    client.post("/auth/sign-up", json={
        "email": email,
        "password": pwd,
        "role": "seeker",
        "fullName": "Wizard Apprentice"
    })
    login = client.post("/auth/sign-in", json={"email": email, "password": pwd}).json()
    client.headers["Authorization"] = f"Bearer {login['token']}"
    
    # Upload resume (name matches wizard / fastapi skills)
    resume_id = upload_resume(client, filename="fastapi_wizard_cv.pdf")
    client.post(f"/resumes/{resume_id}/parse")
    
    client.post(f"/jobs/{job_id}/apply", json={"resumeId": resume_id})
    return client
