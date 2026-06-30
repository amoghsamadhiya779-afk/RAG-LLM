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

def test_combo_employer_post_seeker_recommend(seeker_client, employer_client, admin_client):
    # 1. Employer posts a job with specific skill requirements
    resp = employer_client.post("/jobs", json={
        "title": "React Frontend Master",
        "description": "Must have React and TypeScript experience.",
        "requirements": ["React", "TypeScript"],
        "tags": ["react", "typescript"]
    })
    assert resp.status_code == 201
    job_id = resp.json()["id"]
    
    # Approve job
    admin_client.post(f"/admin/jobs/{job_id}/approve")
    
    # 2. Seeker uploads a resume with matching skills
    resume_id = upload_resume(seeker_client, filename="react_cv.pdf")
    
    # Parse the resume (will fill skills like React, Frontend, etc.)
    seeker_client.post(f"/resumes/{resume_id}/parse")
    
    # 3. Seeker requests job recommendations
    rec_resp = seeker_client.get("/jobs/recommended", params={"resumeId": resume_id})
    assert rec_resp.status_code == 200
    recommended_jobs = rec_resp.json()
    
    assert len(recommended_jobs) >= 1
    assert any(j["id"] == job_id for j in recommended_jobs)

def test_combo_saved_job_archived(seeker_client, employer_client, admin_client):
    # 1. Seeker bookmarks/saves an active job posting
    resp = employer_client.post("/jobs", json={
        "title": "Disposable Dev",
        "description": "Will be archived soon."
    })
    job_id = resp.json()["id"]
    admin_client.post(f"/admin/jobs/{job_id}/approve")
    
    # Save job
    seeker_client.post(f"/jobs/{job_id}/save")
    
    # Verify saved
    saved_resp1 = seeker_client.get("/saved-jobs")
    assert any(s["id"] == job_id for s in saved_resp1.json())
    
    # 2. Admin archives/rejects that job posting
    admin_client.patch(f"/jobs/{job_id}", json={
        "status": "rejected"
    })
    
    # 3. Seeker's saved jobs list indicates it's no longer active (or removed)
    saved_resp2 = seeker_client.get("/saved-jobs")
    # Verify it does not return inactive jobs
    assert not any(s["id"] == job_id for s in saved_resp2.json())

def test_combo_application_stage_tracking(seeker_client, employer_client, admin_client):
    # 1. Seeker submits application
    resp = employer_client.post("/jobs", json={
        "title": "Stage Tracking Role",
        "description": "Track my application."
    })
    job_id = resp.json()["id"]
    admin_client.post(f"/admin/jobs/{job_id}/approve")
    
    resume_id = upload_resume(seeker_client)
    app_resp = seeker_client.post(f"/jobs/{job_id}/apply", json={"resumeId": resume_id})
    app_id = app_resp.json()["id"]
    
    # 2. Employer views applications for their job
    list_resp = employer_client.get(f"/jobs/{job_id}/applications")
    assert any(a["id"] == app_id for a in list_resp.json())
    
    # 3. Employer transitions the candidate's application stage (applied -> interview)
    patch_resp = employer_client.patch(f"/applications/{app_id}", json={"stage": "interview"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["stage"] == "interview"
    
    # 4. Seeker queries their applications list and observes updated status
    my_apps = seeker_client.get("/applications/mine").json()
    seeker_app = next(a for a in my_apps if a["id"] == app_id)
    assert seeker_app["stage"] == "interview"

def test_combo_company_profile_updates_job_results(seeker_client, employer_client, admin_client, api_client):
    # 1. Employer changes company display name
    resp = employer_client.post("/jobs", json={
        "title": "Dynamic Company Role",
        "description": "Job description."
    })
    job_id = resp.json()["id"]
    admin_client.post(f"/admin/jobs/{job_id}/approve")
    
    # Update profile
    employer_client.put("/companies/profile", json={
        "name": "Super Mega Corp"
    })
    
    # 2. Seeker performs a job search matching that company's jobs
    search_resp = api_client.get("/jobs/search", params={"q": "Dynamic"})
    assert search_resp.status_code == 200
    results = search_resp.json()
    assert len(results) >= 1
    
    # 3. Search results display the updated company name
    job_result = next(r for r in results if r["id"] == job_id)
    assert job_result["company"]["name"] == "Super Mega Corp"

def test_combo_resume_deletion_flow(seeker_client, employer_client, admin_client):
    # 1. Seeker uploads a resume
    resume_id = upload_resume(seeker_client)
    
    # 2. Seeker applies to a job using that resume
    resp = employer_client.post("/jobs", json={
        "title": "Robust Application Dev",
        "description": "Test resume deletion."
    })
    job_id = resp.json()["id"]
    admin_client.post(f"/admin/jobs/{job_id}/approve")
    
    app_resp = seeker_client.post(f"/jobs/{job_id}/apply", json={"resumeId": resume_id})
    app_id = app_resp.json()["id"]
    
    # 3. Seeker deletes the resume from their profile
    del_resp = seeker_client.delete(f"/resumes/{resume_id}")
    assert del_resp.status_code == 200
    
    # 4. Application is preserved, maintaining integrity without crashing
    app_detail = seeker_client.get(f"/applications/{app_id}")
    assert app_detail.status_code == 200
    assert app_detail.json()["resumeId"] == resume_id
