import uuid

import pytest


# Helper to create a live job
def create_live_job(employer_client, admin_client, title="Software Engineer", tags=None, location="Remote", remote=True, job_type="full_time", level="mid", salary_min=80000):
    # Employer creates job
    resp = employer_client.post("/jobs", json={
        "title": title,
        "description": "We need a professional developer.",
        "requirements": ["Experience with Python", "FastAPI knowledge"],
        "location": location,
        "remote": remote,
        "jobType": job_type,
        "level": level,
        "salaryMin": salary_min,
        "tags": tags or ["python", "fastapi"]
    })
    assert resp.status_code == 201
    job_id = resp.json()["id"]
    
    # Admin approves job
    app_resp = admin_client.post(f"/admin/jobs/{job_id}/approve")
    assert app_resp.status_code == 200
    return job_id

# Feature 1: Auth & Profile

def test_seeker_signup(api_client):
    email = f"seeker-{uuid.uuid4()}@example.com"
    resp = api_client.post("/auth/sign-up", json={
        "email": email,
        "password": "password123",
        "role": "seeker",
        "fullName": "Alice Seeker"
    })
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert "token" in data
    assert data["profile"]["role"] == "seeker"
    assert data["profile"]["fullName"] == "Alice Seeker"

def test_seeker_signin(api_client):
    email = f"seeker-{uuid.uuid4()}@example.com"
    password = "password123"
    api_client.post("/auth/sign-up", json={
        "email": email,
        "password": password,
        "role": "seeker",
        "fullName": "Bob Seeker"
    })
    
    resp = api_client.post("/auth/sign-in", json={
        "email": email,
        "password": password
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["email"] == email

def test_employer_signup(api_client):
    email = f"employer-{uuid.uuid4()}@example.com"
    resp = api_client.post("/auth/sign-up", json={
        "email": email,
        "password": "password123",
        "role": "employer",
        "fullName": "Charlie Employer",
        "companyName": "Tech Solutions Inc."
    })
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert "token" in data
    assert data["profile"]["role"] == "employer"

def test_auth_me(seeker_client):
    resp = seeker_client.get("/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["email"] == seeker_client.email
    assert data["profile"]["role"] == "seeker"

def test_update_company(employer_client):
    resp = employer_client.put("/companies/profile", json={
        "name": "Updated Solutions Inc.",
        "website": "http://updatedsolutions.com",
        "about": "An updated corporate overview.",
        "location": "Boston, MA"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Updated Solutions Inc."
    assert data["location"] == "Boston, MA"
    assert data["website"] == "http://updatedsolutions.com"

# Feature 2: Job Board & RAG

def test_list_jobs(api_client, employer_client, admin_client):
    create_live_job(employer_client, admin_client, "DevOps Engineer")
    
    resp = api_client.get("/jobs", params={"page": 1, "limit": 10})
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert len(data["items"]) >= 1
    assert data["page"] == 1

def test_filter_jobs(api_client, employer_client, admin_client):
    create_live_job(employer_client, admin_client, "Remote Python Dev", remote=True, job_type="full_time")
    create_live_job(employer_client, admin_client, "Onsite Backend Dev", remote=False, job_type="contract")
    
    resp = api_client.get("/jobs", params={"remote": "true", "jobType": "full-time"})
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) >= 1
    for item in items:
        assert item["remote"] is True
        assert item["jobType"] == "full_time"

def test_search_jobs_lexical(api_client, employer_client, admin_client):
    create_live_job(employer_client, admin_client, "React UI Engineer")
    
    resp = api_client.get("/jobs/search", params={"q": "React"})
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 1
    assert any("React" in r["title"] for r in results)

def test_search_jobs_semantic(api_client, employer_client, admin_client):
    create_live_job(employer_client, admin_client, "Cloud Infrastructure Architect", tags=["aws", "kubernetes"])
    
    resp = api_client.get("/jobs/search/semantic", params={"q": "looking for cloud infrastructure engineer"})
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 1
    assert any("Cloud Infrastructure" in r["title"] for r in results)

def test_similar_jobs(api_client, employer_client, admin_client):
    job1 = create_live_job(employer_client, admin_client, "Frontend Specialist", tags=["react", "typescript"])
    create_live_job(employer_client, admin_client, "React Developer", tags=["react", "typescript"])
    
    resp = api_client.get(f"/jobs/{job1}/similar")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 1
    assert any("React Developer" in r["title"] for r in results)

# Feature 3: Job CRUD & Admin

def test_employer_create_job(employer_client):
    resp = employer_client.post("/jobs", json={
        "title": "Machine Learning Engineer",
        "description": "Work on state-of-the-art NLP models.",
        "requirements": ["Python", "PyTorch"],
        "salaryMin": 120000,
        "salaryMax": 160000
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Machine Learning Engineer"
    assert data["status"] == "pending"

def test_employer_update_job(employer_client):
    # Create job
    resp = employer_client.post("/jobs", json={
        "title": "Data Analyst",
        "description": "Analyze datasets.",
        "requirements": ["SQL", "Excel"]
    })
    assert resp.status_code == 201
    job_id = resp.json()["id"]
    
    # Update job
    update_resp = employer_client.patch(f"/jobs/{job_id}", json={
        "description": "Analyze datasets and build dashboards."
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["description"] == "Analyze datasets and build dashboards."

def test_employer_list_own_jobs(employer_client):
    employer_client.post("/jobs", json={
        "title": "Staff Backend Engineer",
        "description": "System architecture.",
        "requirements": ["Go", "Kubernetes"]
    })
    
    resp = employer_client.get("/jobs/mine")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 1
    assert all(r["company"]["ownerId"] == employer_client.user_id for r in results)

def test_admin_list_pending(employer_client, admin_client):
    employer_client.post("/jobs", json={
        "title": "Ruby on Rails Dev",
        "description": "Legacy systems maintenance.",
        "requirements": ["Ruby"]
    })
    
    resp = admin_client.get("/admin/jobs/pending")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 1
    assert any(r["title"] == "Ruby on Rails Dev" for r in results)

def test_admin_approve_job(employer_client, admin_client):
    # Create
    resp = employer_client.post("/jobs", json={
        "title": "Rust System Developer",
        "description": "Low-level coding.",
        "requirements": ["Rust"]
    })
    job_id = resp.json()["id"]
    
    # Approve
    app_resp = admin_client.post(f"/admin/jobs/{job_id}/approve")
    assert app_resp.status_code == 200
    assert app_resp.json()["status"] == "live"

# Feature 4: Resume RAG

def test_upload_resume_pdf(seeker_client):
    # Send PDF multipart form data
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="resume.pdf"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
        "%PDF-1.4 Mock PDF Content...\r\n"
        f"--{boundary}--\r\n"
    )
    resp = seeker_client.post("/resumes/upload", content=body, headers={
        "content-type": f"multipart/form-data; boundary={boundary}"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["fileName"] == "resume.pdf"
    assert data["parsed"] is None

def test_upload_resume_docx(seeker_client):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="resume.docx"\r\n'
        "Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n"
        "Mock DOCX Content...\r\n"
        f"--{boundary}--\r\n"
    )
    resp = seeker_client.post("/resumes/upload", content=body, headers={
        "content-type": f"multipart/form-data; boundary={boundary}"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["fileName"] == "resume.docx"

def test_trigger_resume_parse(seeker_client):
    # Upload
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="resume.pdf"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
        "Mock PDF Content...\r\n"
        f"--{boundary}--\r\n"
    )
    up_resp = seeker_client.post("/resumes/upload", content=body, headers={
        "content-type": f"multipart/form-data; boundary={boundary}"
    })
    resume_id = up_resp.json()["id"]
    
    # Parse
    parse_resp = seeker_client.post(f"/resumes/{resume_id}/parse")
    assert parse_resp.status_code == 202
    assert "jobId" in parse_resp.json()

def test_list_resumes(seeker_client):
    # Upload
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="my_resume.pdf"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
        "Mock PDF Content...\r\n"
        f"--{boundary}--\r\n"
    )
    seeker_client.post("/resumes/upload", content=body, headers={
        "content-type": f"multipart/form-data; boundary={boundary}"
    })
    
    # List
    list_resp = seeker_client.get("/resumes")
    assert list_resp.status_code == 200
    resumes = list_resp.json()
    assert len(resumes) >= 1
    assert any(r["fileName"] == "my_resume.pdf" for r in resumes)

def test_verify_resume_parsed_fields(seeker_client):
    # Upload
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="skills_resume.pdf"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
        "Mock PDF Content...\r\n"
        f"--{boundary}--\r\n"
    )
    up_resp = seeker_client.post("/resumes/upload", content=body, headers={
        "content-type": f"multipart/form-data; boundary={boundary}"
    })
    resume_id = up_resp.json()["id"]
    
    # Parse
    seeker_client.post(f"/resumes/{resume_id}/parse")
    
    # Fetch parsed data
    data_resp = seeker_client.get(f"/resumes/{resume_id}/parsed-data")
    assert data_resp.status_code == 200
    parsed = data_resp.json()
    assert isinstance(parsed["skills"], list)
    assert len(parsed["skills"]) >= 1
    assert isinstance(parsed["experience"], list)
    assert isinstance(parsed["education"], list)

# Feature 5: Applications & Saved

def test_save_job(seeker_client, employer_client, admin_client):
    job_id = create_live_job(employer_client, admin_client, "React Dev to Save")
    
    # Save
    save_resp = seeker_client.post(f"/jobs/{job_id}/save")
    assert save_resp.status_code == 200
    assert save_resp.json()["saved"] is True

def test_unsave_job(seeker_client, employer_client, admin_client):
    job_id = create_live_job(employer_client, admin_client, "Dev to Unsave")
    seeker_client.post(f"/jobs/{job_id}/save")
    
    # Unsave
    unsave_resp = seeker_client.post(f"/jobs/{job_id}/unsave")
    assert unsave_resp.status_code == 200
    assert unsave_resp.json()["saved"] is False

def test_list_saved_jobs(seeker_client, employer_client, admin_client):
    job_id = create_live_job(employer_client, admin_client, "Dev to List Saved")
    seeker_client.post(f"/jobs/{job_id}/save")
    
    resp = seeker_client.get("/saved-jobs")
    assert resp.status_code == 200
    saved = resp.json()
    assert len(saved) >= 1
    assert any(s["id"] == job_id for s in saved)

def test_apply_job_with_resume(seeker_client, employer_client, admin_client):
    job_id = create_live_job(employer_client, admin_client, "Dev to Apply With Resume")
    
    # Upload resume
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="apply_resume.pdf"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
        "Mock PDF Content...\r\n"
        f"--{boundary}--\r\n"
    )
    up_resp = seeker_client.post("/resumes/upload", content=body, headers={
        "content-type": f"multipart/form-data; boundary={boundary}"
    })
    resume_id = up_resp.json()["id"]
    
    # Apply
    apply_resp = seeker_client.post(f"/jobs/{job_id}/apply", json={
        "resumeId": resume_id,
        "coverNote": "Please hire me!"
    })
    assert apply_resp.status_code == 201
    assert apply_resp.json()["stage"] == "applied"

def test_list_applications_employer(seeker_client, employer_client, admin_client):
    job_id = create_live_job(employer_client, admin_client, "Dev for Employer Application List")
    
    # Seeker uploads & applies
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="seeker_cv.pdf"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
        "Mock PDF Content...\r\n"
        f"--{boundary}--\r\n"
    )
    up_resp = seeker_client.post("/resumes/upload", content=body, headers={
        "content-type": f"multipart/form-data; boundary={boundary}"
    })
    resume_id = up_resp.json()["id"]
    
    apply_resp = seeker_client.post(f"/jobs/{job_id}/apply", json={
        "resumeId": resume_id
    })
    assert apply_resp.status_code == 201
    
    # Employer lists applications
    list_resp = employer_client.get(f"/jobs/{job_id}/applications")
    assert list_resp.status_code == 200
    apps = list_resp.json()
    assert len(apps) == 1
    assert apps[0]["userId"] == seeker_client.user_id
    assert apps[0]["applicant"]["fullName"] == "John Seeker"
