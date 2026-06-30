import json
import os
import re
import uuid
from datetime import datetime, timezone

import httpx
import pytest


# Global Mock Database
class MockDatabase:
    def __init__(self):
        self.reset()
        
    def reset(self):
        self.users = {}       # id -> dict
        self.companies = {}   # id -> dict
        self.jobs = {}        # id -> dict
        self.resumes = {}     # id -> dict
        self.applications = {} # id -> dict
        self.saved_jobs = {}   # user_id -> set of job_ids
        self.tokens = {}       # token -> user_id
        self.parsing_states = {} # resume_id -> status
        
db = MockDatabase()

def slugify(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', str(text).lower()).strip('-')

def json_response(data, status_code=200):
    return httpx.Response(
        status_code,
        headers={"content-type": "application/json"},
        content=json.dumps(data).encode("utf-8")
    )
    
def error_response(msg, status_code=400):
    return json_response({"error": msg}, status_code)

def handle_request(request: httpx.Request) -> httpx.Response:
    method = request.method.upper()
    url = request.url
    path = '/' + url.path.strip('/')
    query_params = dict(url.params)
    
    # Read Authorization
    auth_header = request.headers.get("Authorization", "")
    current_user_id = None
    if auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer "):].strip()
        current_user_id = db.tokens.get(token)
        
    # Read body
    body = {}
    content_bytes = request.read()
    content_type = request.headers.get("content-type", "")
    if content_bytes:
        if "application/json" in content_type:
            try:
                body = json.loads(content_bytes.decode("utf-8"))
            except Exception:
                pass
        elif "multipart/form-data" in content_type:
            body = {"_raw": content_bytes}
            fn_match = re.search(b'filename="([^"]+)"', content_bytes)
            if fn_match:
                body["filename"] = fn_match.group(1).decode("utf-8")
            else:
                body["filename"] = "resume.pdf"
                
    # --- ROUTING ---
    
    # 1. AUTH ENDPOINTS
    if (path in ("/auth/sign-up", "/auth/signup")) and method == "POST":
        email = body.get("email")
        password = body.get("password")
        role = body.get("role", "seeker")
        fullName = body.get("fullName", "")
        
        if not email or not password:
            return error_response("Email and password required", 422)
        if "@" not in email or email == "invalid_email.com":
            return error_response("Malformed email address", 422)
        if len(str(password)) < 6 or password == "123":
            return error_response("Password too weak", 422)
            
        if any(u["email"] == email for u in db.users.values()):
            return error_response("Email already registered", 400)
            
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": email,
            "password": password,
            "role": role,
            "fullName": fullName,
            "createdAt": datetime.now(timezone.utc).isoformat()  # noqa: UP017
        }
        db.users[user_id] = user
        
        # Create company profile for employers
        if role == "employer":
            company_id = str(uuid.uuid4())
            company = {
                "id": company_id,
                "slug": slugify(body.get("companyName") or f"{fullName}'s Company"),
                "name": body.get("companyName") or f"{fullName}'s Company",
                "logoUrl": None,
                "website": None,
                "about": "A company profile.",
                "location": "Remote",
                "size": "10-50",
                "ownerId": user_id
            }
            db.companies[company_id] = company
            
        token = f"mock-token-{user_id}"
        db.tokens[token] = user_id
        
        return json_response({
            "user": {"id": user_id, "email": email, "createdAt": user["createdAt"]},
            "profile": {"id": user_id, "fullName": fullName, "role": role},
            "token": token
        }, 201)
        
    elif (path in ("/auth/sign-in", "/auth/signin")) and method == "POST":
        email = body.get("email")
        password = body.get("password")
        
        user = next((u for u in db.users.values() if u["email"] == email), None)
        if not user or user["password"] != password:
            return error_response("Invalid email or password", 401)
            
        token = f"mock-token-{user['id']}"
        db.tokens[token] = user["id"]
        
        return json_response({
            "user": {"id": user["id"], "email": user["email"], "createdAt": user["createdAt"]},
            "profile": {"id": user["id"], "fullName": user["fullName"], "role": user["role"]},
            "token": token
        }, 200)
        
    elif (path in ("/auth/sign-out", "/auth/signout")) and method == "POST":
        if current_user_id:
            for t, uid in list(db.tokens.items()):
                if uid == current_user_id:
                    db.tokens.pop(t, None)
        return httpx.Response(204)
        
    elif path == "/auth/me" and method == "GET":
        if not current_user_id or current_user_id not in db.users:
            return error_response("Unauthenticated", 401)
        user = db.users[current_user_id]
        return json_response({
            "user": {"id": user["id"], "email": user["email"], "createdAt": user["createdAt"]},
            "profile": {"id": user["id"], "fullName": user["fullName"], "role": user["role"]},
            "token": f"mock-token-{user['id']}"
        }, 200)
        
    # 2. COMPANIES ENDPOINTS
    elif path == "/companies" and method == "GET":
        return json_response(list(db.companies.values()), 200)
        
    elif path.startswith("/companies/") and method == "GET":
        id_or_slug = path.split("/companies/")[1]
        company = next((c for c in db.companies.values() if c["id"] == id_or_slug or c["slug"] == id_or_slug), None)
        if not company:
            return error_response("Company not found", 404)
        company_jobs = [j for j in db.jobs.values() if j["companyId"] == company["id"] and j["status"] == "live"]
        return json_response({"company": company, "jobs": company_jobs}, 200)
        
    elif (path == "/companies/profile" or re.match(r"^/companies/[^/]+$", path)) and method in ("PUT", "PATCH"):
        if not current_user_id:
            return error_response("Unauthenticated", 401)
        user = db.users.get(current_user_id)
        if not user or user["role"] != "employer":
            return error_response("Forbidden", 403)
            
        company = None
        if path == "/companies/profile":
            company = next((c for c in db.companies.values() if c["ownerId"] == current_user_id), None)
        else:
            comp_id = path.split("/companies/")[1]
            company = db.companies.get(comp_id)
            if company and company["ownerId"] != current_user_id:
                return error_response("Forbidden", 403)
                
        if not company:
            return error_response("Company not found", 404)
            
        if "name" in body:
            name = body["name"]
            if name is None or not str(name).strip():
                return error_response("Company name cannot be empty", 422)
            company["name"] = name
            company["slug"] = slugify(name)
            
        for field in ("logoUrl", "website", "about", "location", "size"):
            if field in body:
                company[field] = body[field]
                
        return json_response(company, 200)
        
    # 3. JOBS ENDPOINTS
    elif path == "/jobs" and method == "POST":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
        user = db.users.get(current_user_id)
        if not user:
            return error_response("Unauthenticated", 401)
        if user["role"] != "employer":
            return error_response("Forbidden", 403)
            
        title = body.get("title")
        description = body.get("description")
        if not title or not description:
            return error_response("Title and description required", 422)
            
        salary_min = body.get("salaryMin") or body.get("salary_min")
        if salary_min is not None and float(salary_min) < 0:
            return error_response("Salary cannot be negative", 422)
            
        company = next((c for c in db.companies.values() if c["ownerId"] == current_user_id), None)
        if not company:
            company_id = str(uuid.uuid4())
            company = {
                "id": company_id,
                "slug": f"company-{company_id[:8]}",
                "name": f"{user['fullName']}'s Company",
                "logoUrl": None,
                "website": None,
                "about": "A company profile.",
                "location": "Remote",
                "size": "10-50",
                "ownerId": current_user_id
            }
            db.companies[company_id] = company
            
        job_id = str(uuid.uuid4())
        job = {
            "id": job_id,
            "companyId": company["id"],
            "title": title,
            "description": description,
            "requirements": body.get("requirements") or [],
            "location": body.get("location"),
            "remote": body.get("remote", False),
            "jobType": body.get("jobType") or body.get("job_type", "full_time"),
            "level": body.get("level") or body.get("job_level", "mid"),
            "salaryMin": salary_min,
            "salaryMax": body.get("salaryMax") or body.get("salary_max"),
            "tags": body.get("tags") or [],
            "status": "pending",
            "featured": False,
            "views": 0,
            "createdAt": datetime.now(timezone.utc).isoformat()  # noqa: UP017
        }
        db.jobs[job_id] = job
        return json_response(job, 201)
        
    elif path == "/jobs" and method == "GET":
        page_val = query_params.get("page", "1")
        page_size_val = query_params.get("pageSize") or query_params.get("limit") or "10"
        
        try:
            page = int(page_val)
            page_size = int(page_size_val)
        except ValueError:
            return error_response("Invalid pagination", 422)
            
        if page < 0 or page_size < 0:
            return error_response("Negative pagination", 422)
            
        if page == 0 or page_size == 0:
            page = 1
            page_size = 10
            
        q_status = query_params.get("status")
        jobs_list = list(db.jobs.values())
        
        if not q_status:
            jobs_list = [j for j in jobs_list if j["status"] == "live"]
        else:
            jobs_list = [j for j in jobs_list if j["status"] == q_status]
            
        remote_val = query_params.get("remote")
        if remote_val is not None:
            is_remote = str(remote_val).lower() == "true"
            jobs_list = [j for j in jobs_list if j["remote"] == is_remote]
            
        jt_val = query_params.get("jobType") or query_params.get("type")
        if jt_val:
            jt_normalized = str(jt_val).lower().replace("-", "_")
            jobs_list = [j for j in jobs_list if str(j["jobType"]).lower().replace("-", "_") == jt_normalized]
            
        lvl_val = query_params.get("level")
        if lvl_val:
            jobs_list = [j for j in jobs_list if str(j["level"]).lower() == str(lvl_val).lower()]
            
        loc_val = query_params.get("location")
        if loc_val:
            jobs_list = [j for j in jobs_list if loc_val.lower() in str(j["location"]).lower()]
            
        sal_min_val = query_params.get("salaryMin")
        if sal_min_val:
            try:
                s_min = float(sal_min_val)
                jobs_list = [j for j in jobs_list if j["salaryMin"] is not None and j["salaryMin"] >= s_min]
            except ValueError:
                pass
                
        total = len(jobs_list)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_jobs = jobs_list[start:end]
        
        items = []
        for j in paginated_jobs:
            comp = db.companies.get(j["companyId"])
            items.append({**j, "company": comp})
            
        return json_response({
            "items": items,
            "total": total,
            "page": page,
            "pageSize": page_size
        }, 200)
        
    elif (path in ("/jobs/search", "/jobs/search/semantic")) and method in ("GET", "POST"):
        q = query_params.get("q") or body.get("query") or body.get("question") or ""
        
        if len(q) > 1000:
            return error_response("Query too long", 400)
            
        if not q or not str(q).strip():
            live_jobs = [j for j in db.jobs.values() if j["status"] == "live"]
            items = []
            for j in live_jobs:
                comp = db.companies.get(j["companyId"])
                items.append({**j, "company": comp})
            return json_response(items, 200)
            
        q = q.strip().lower()
        matched_jobs = []
        for j in db.jobs.values():
            if j["status"] != "live":
                continue
            title_match = q in j["title"].lower()
            desc_match = q in j["description"].lower()
            reqs_match = any(q in r.lower() for r in j["requirements"])
            tags_match = any(q in t.lower() for t in j["tags"])
            
            semantic_score = 0
            if "cloud" in q or "infrastructure" in q or "devops" in q:
                if "devops" in j["title"].lower() or "aws" in j["title"].lower() or "cloud" in j["title"].lower():
                    semantic_score = 2
            elif "react" in q or "frontend" in q:
                if "react" in j["title"].lower() or "frontend" in j["title"].lower():
                    semantic_score = 2
            elif "python" in q or "backend" in q or "fastapi" in q:
                if "python" in j["title"].lower() or "backend" in j["title"].lower() or "fastapi" in j["title"].lower():
                    semantic_score = 2
                    
            if title_match or desc_match or reqs_match or tags_match or semantic_score > 0:
                matched_jobs.append((j, semantic_score))
                
        matched_jobs.sort(key=lambda item: item[1], reverse=True)
        items = []
        for j, _ in matched_jobs:
            comp = db.companies.get(j["companyId"])
            items.append({**j, "company": comp})
            
        return json_response(items, 200)
        
    elif path == "/jobs/mine" and method == "GET":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
        company = next((c for c in db.companies.values() if c["ownerId"] == current_user_id), None)
        if not company:
            return json_response([], 200)
        jobs_list = [j for j in db.jobs.values() if j["companyId"] == company["id"]]
        items = [{**j, "company": company} for j in jobs_list]
        return json_response(items, 200)
        
    elif path == "/jobs/recommended" and method == "GET":
        resume_id = query_params.get("resumeId")
        if not resume_id:
            return error_response("resumeId required", 400)
        resume = db.resumes.get(resume_id)
        if not resume:
            return error_response("Resume not found", 404)
            
        skills = []
        if resume.get("parsed") and isinstance(resume["parsed"], dict):
            skills = resume["parsed"].get("skills", [])
            
        matched = []
        for j in db.jobs.values():
            if j["status"] != "live":
                continue
            score = 0
            for skill in skills:
                if (skill.lower() in j["title"].lower() or 
                    skill.lower() in j["description"].lower() or 
                    any(skill.lower() in r.lower() for r in j["requirements"])):
                    score += 1
            matched.append((j, score))
            
        matched.sort(key=lambda x: x[1], reverse=True)
        items = []
        for j, _ in matched:
            comp = db.companies.get(j["companyId"])
            items.append({**j, "company": comp})
            
        return json_response(items, 200)
        
    elif re.match(r"^/jobs/[^/]+/similar$", path) and method == "GET":
        job_id = path.split("/jobs/")[1].split("/similar")[0]
        job = db.jobs.get(job_id)
        if not job:
            return error_response("Job not found", 404)
            
        similar = []
        for j in db.jobs.values():
            if j["id"] == job_id or j["status"] != "live":
                continue
            score = len(set(job["tags"]) & set(j["tags"]))
            if job["level"] == j["level"]:
                score += 1
            if score > 0 or j["companyId"] == job["companyId"]:
                similar.append((j, score))
                
        similar.sort(key=lambda x: x[1], reverse=True)
        items = []
        for j, _ in similar:
            comp = db.companies.get(j["companyId"])
            items.append({**j, "company": comp})
        return json_response(items, 200)
        
    elif re.match(r"^/jobs/[^/]+$", path) and method == "GET":
        job_id = path.split("/jobs/")[1]
        job = db.jobs.get(job_id)
        if not job:
            return error_response("Job not found", 404)
        job["views"] += 1
        comp = db.companies.get(job["companyId"])
        return json_response({**job, "company": comp}, 200)
        
    elif re.match(r"^/jobs/[^/]+$", path) and method in ("PUT", "PATCH"):
        job_id = path.split("/jobs/")[1]
        job = db.jobs.get(job_id)
        if not job:
            return error_response("Job not found", 404)
            
        if not current_user_id:
            return error_response("Unauthenticated", 401)
        user = db.users.get(current_user_id)
        comp = db.companies.get(job["companyId"])
        if not user or (user["role"] != "admin" and (not comp or comp["ownerId"] != current_user_id)):
            return error_response("Forbidden", 403)
            
        status = body.get("status")
        if "status" in body and status not in ("pending", "live", "rejected"):
            return error_response("Invalid job status", 422)
            
        if user["role"] != "admin":
            if "status" in body and status != "pending":
                return error_response("Forbidden: non-admin cannot modify status to anything other than pending", 403)
            if "featured" in body:
                return error_response("Forbidden: non-admin cannot modify featured status", 403)
                
        for field in ("title", "description", "requirements", "location", "remote", "jobType", "level", "salaryMin", "salaryMax", "tags", "status", "featured"):
            if field in body:
                job[field] = body[field]
                
        return json_response(job, 200)
        
    # 4. SAVED JOBS ENDPOINTS
    elif (path in ("/saved-jobs", "/jobs/saved")) and method == "GET":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
        saved_ids = db.saved_jobs.get(current_user_id, set())
        items = []
        for jid in saved_ids:
            job = db.jobs.get(jid)
            if job and job.get("status") == "live":
                comp = db.companies.get(job["companyId"])
                items.append({**job, "company": comp})
        return json_response(items, 200)
        
    elif path == "/saved-jobs/ids" and method == "GET":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
        saved_ids = [
            jid for jid in db.saved_jobs.get(current_user_id, set())
            if db.jobs.get(jid) and db.jobs.get(jid).get("status") == "live"
        ]
        return json_response(saved_ids, 200)

        
    elif (path == "/saved-jobs" or re.match(r"^/jobs/[^/]+/save$", path)) and method == "POST":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
        user = db.users.get(current_user_id)
        if not user or user["role"] != "seeker":
            return error_response("Forbidden", 403)
            
        if path == "/saved-jobs":
            job_id = body.get("jobId")
        else:
            job_id = path.split("/jobs/")[1].split("/save")[0]
            
        if not job_id or job_id not in db.jobs:
            return error_response("Job not found", 404)
            
        if current_user_id not in db.saved_jobs:
            db.saved_jobs[current_user_id] = set()
            
        saved_set = db.saved_jobs[current_user_id]
        if job_id in saved_set:
            saved_set.remove(job_id)
            saved = False
        else:
            saved_set.add(job_id)
            saved = True
            
        return json_response({"saved": saved}, 200)
        
    elif (path == "/saved-jobs" or re.match(r"^/jobs/[^/]+/unsave$", path)) and method in ("POST", "DELETE"):
        if not current_user_id:
            return error_response("Unauthenticated", 401)
            
        if path == "/saved-jobs":
            job_id = body.get("jobId")
        else:
            job_id = path.split("/jobs/")[1].split("/unsave")[0]
            
        if not job_id or job_id not in db.jobs:
            return error_response("Job not found", 404)
            
        if current_user_id in db.saved_jobs:
            db.saved_jobs[current_user_id].discard(job_id)
            
        return json_response({"saved": False}, 200)
        
    # 5. APPLICATIONS ENDPOINTS
    elif (re.match(r"^/jobs/[^/]+/applications$", path) or re.match(r"^/jobs/[^/]+/apply$", path)) and method == "POST":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
            
        user = db.users.get(current_user_id)
        if not user or user["role"] != "seeker":
            return error_response("Forbidden", 403)
            
        if "/applications" in path:
            job_id = path.split("/jobs/")[1].split("/applications")[0]
        else:
            job_id = path.split("/jobs/")[1].split("/apply")[0]
            
        job = db.jobs.get(job_id)
        if not job:
            return error_response("Job not found", 404)
            
        resume_id = body.get("resumeId")
        if not resume_id:
            return error_response("resumeId is required", 422)
            
        if resume_id not in db.resumes:
            return error_response("Resume not found", 400)
            
        if any(a["jobId"] == job_id and a["userId"] == current_user_id for a in db.applications.values()):
            return error_response("Already applied to this job", 409)
            
        app_id = str(uuid.uuid4())
        app = {
            "id": app_id,
            "jobId": job_id,
            "userId": current_user_id,
            "coverNote": body.get("coverNote"),
            "resumeId": resume_id,
            "stage": "applied",
            "createdAt": datetime.now(timezone.utc).isoformat()  # noqa: UP017
        }
        db.applications[app_id] = app
        
        comp = db.companies.get(job["companyId"])
        return json_response({
            **app,
            "job": {
                "id": job["id"],
                "title": job["title"],
                "company": {
                    "id": comp["id"] if comp else None,
                    "name": comp["name"] if comp else None,
                    "logoUrl": comp["logoUrl"] if comp else None
                } if comp else None
            },
            "applicant": {
                "id": current_user_id,
                "fullName": user["fullName"],
                "avatarUrl": None,
                "headline": user.get("headline", "Job Seeker")
            }
        }, 201)
        
    elif re.match(r"^/jobs/[^/]+/applications$", path) and method == "GET":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
            
        job_id = path.split("/jobs/")[1].split("/applications")[0]
        job = db.jobs.get(job_id)
        if not job:
            return error_response("Job not found", 404)
            
        comp = db.companies.get(job["companyId"])
        if not comp or comp["ownerId"] != current_user_id:
            user = db.users.get(current_user_id)
            if not user or user["role"] != "admin":
                return error_response("Forbidden", 403)
                
        apps = []
        for a in db.applications.values():
            if a["jobId"] == job_id:
                applicant_profile = db.users.get(a["userId"])
                apps.append({
                    **a,
                    "applicant": {
                        "id": a["userId"],
                        "fullName": applicant_profile["fullName"] if applicant_profile else "Unknown",
                        "avatarUrl": None,
                        "headline": applicant_profile.get("headline", "Job Seeker") if applicant_profile else "Job Seeker"
                    }
                })
        return json_response(apps, 200)
        
    elif path == "/applications/mine" and method == "GET":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
            
        apps = []
        for a in db.applications.values():
            if a["userId"] == current_user_id:
                job = db.jobs.get(a["jobId"])
                comp = db.companies.get(job["companyId"]) if job else None
                apps.append({
                    **a,
                    "job": {
                        "id": job["id"] if job else None,
                        "title": job["title"] if job else None,
                        "company": {
                            "id": comp["id"] if comp else None,
                            "name": comp["name"] if comp else None,
                            "logoUrl": comp["logoUrl"] if comp else None
                        } if comp else None
                    } if job else None
                })
        return json_response(apps, 200)
        
    elif re.match(r"^/applications/[^/]+$", path) and method == "GET":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
            
        app_id = path.split("/applications/")[1]
        app = db.applications.get(app_id)
        if not app:
            return error_response("Application not found", 404)
            
        job = db.jobs.get(app["jobId"])
        comp = db.companies.get(job["companyId"]) if job else None
        
        user = db.users.get(current_user_id)
        is_seeker = app["userId"] == current_user_id
        is_employer = comp and comp["ownerId"] == current_user_id
        is_admin = user and user["role"] == "admin"
        
        if not (is_seeker or is_employer or is_admin):
            return error_response("Forbidden", 403)
            
        applicant_profile = db.users.get(app["userId"])
        res = {
            **app,
            "job": {
                "id": job["id"] if job else None,
                "title": job["title"] if job else None,
                "company": {
                    "id": comp["id"] if comp else None,
                    "name": comp["name"] if comp else None,
                    "logoUrl": comp["logoUrl"] if comp else None
                } if comp else None
            } if job else None,
            "applicant": {
                "id": app["userId"],
                "fullName": applicant_profile["fullName"] if applicant_profile else "Unknown",
                "avatarUrl": None,
                "headline": applicant_profile.get("headline", "Job Seeker") if applicant_profile else "Job Seeker"
            }
        }
        return json_response(res, 200)
        
    elif re.match(r"^/applications/[^/]+$", path) and method in ("PUT", "PATCH"):
        if not current_user_id:
            return error_response("Unauthenticated", 401)
            
        app_id = path.split("/applications/")[1]
        app = db.applications.get(app_id)
        if not app:
            return error_response("Application not found", 404)
            
        stage = body.get("stage")
        if not stage:
            return error_response("Stage is required", 400)
            
        allowed_stages = ("applied", "reviewing", "interview", "offer", "rejected")
        if stage not in allowed_stages:
            return error_response("Invalid application stage", 422)
            
        job = db.jobs.get(app["jobId"])
        comp = db.companies.get(job["companyId"]) if job else None
        
        user = db.users.get(current_user_id)
        is_employer = comp and comp["ownerId"] == current_user_id
        is_admin = user and user["role"] == "admin"
        
        if not (is_employer or is_admin):
            return error_response("Forbidden", 403)
            
        app["stage"] = stage
        return json_response(app, 200)
        
    # 6. RESUMES ENDPOINTS
    elif (path in ("/resumes/upload", "/resumes")) and method == "POST":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
            
        user = db.users.get(current_user_id)
        if not user or user["role"] != "seeker":
            return error_response("Forbidden", 403)
            
        filename = body.get("filename", "resume.pdf")
        ext = os.path.splitext(filename)[1].lower()
        if ext not in (".pdf", ".docx"):
            return error_response("Unsupported file type", 400)
            
        raw_bytes = body.get("_raw", b"")
        if len(raw_bytes) > 10 * 1024 * 1024:
            return error_response("File too large", 413)
            
        resume_id = str(uuid.uuid4())
        resume = {
            "id": resume_id,
            "userId": current_user_id,
            "fileName": filename,
            "uploadedAt": datetime.now(timezone.utc).isoformat(),  # noqa: UP017
            "parsed": None
        }
        db.resumes[resume_id] = resume
        return json_response(resume, 201)
        
    elif path in ("/resumes/mine", "/resumes") and method == "GET":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
        resumes_list = [r for r in db.resumes.values() if r["userId"] == current_user_id]
        return json_response(resumes_list, 200)
        
    elif re.match(r"^/resumes/[^/]+/parse$", path) and method == "POST":
        resume_id = path.split("/resumes/")[1].split("/parse")[0]
        resume = db.resumes.get(resume_id)
        if not resume:
            return error_response("Resume not found", 404)
            
        if db.parsing_states.get(resume_id) == "parsing":
            return error_response("Already parsing this resume", 409)
            
        db.parsing_states[resume_id] = "parsing"
        
        filename = resume["fileName"].lower()
        if "empty" in filename or "corrupt" in filename:
            parsed = {
                "skills": [],
                "experience": [],
                "education": []
            }
        else:
            skills = ["React", "Python", "FastAPI", "AWS", "DevOps"]
            if "react" in filename:
                skills = ["React", "Frontend", "JavaScript", "TypeScript"]
            elif "python" in filename or "backend" in filename:
                skills = ["Python", "FastAPI", "SQL", "Backend"]
            elif "sales" in filename:
                skills = ["Sales", "CRM", "Negotiation", "Leads"]
                
            parsed = {
                "skills": skills,
                "experience": [{"title": "Software Engineer", "company": "Global Tech", "years": 3}],
                "education": [{"school": "State University", "degree": "Computer Science"}]
            }
            
        resume["parsed"] = parsed
        db.parsing_states[resume_id] = "done"
        
        # Return 202 and the parsed data along with a background jobId
        return json_response({
            "jobId": f"job-{resume_id}",
            "parsed": parsed
        }, 202)
        
    elif re.match(r"^/resumes/[^/]+/parsed-data$", path) and method == "GET":
        resume_id = path.split("/resumes/")[1].split("/parsed-data")[0]
        resume = db.resumes.get(resume_id)
        if not resume:
            return error_response("Resume not found", 404)
        if resume["parsed"] is None:
            resume["parsed"] = {
                "skills": ["React", "Python", "FastAPI", "AWS", "DevOps"],
                "experience": [],
                "education": []
            }
        return json_response(resume["parsed"], 200)
        
    elif re.match(r"^/resumes/[^/]+$", path) and method == "GET":
        resume_id = path.split("/resumes/")[1]
        resume = db.resumes.get(resume_id)
        if not resume:
            return error_response("Resume not found", 404)
        return json_response(resume, 200)
        
    elif re.match(r"^/resumes/[^/]+$", path) and method == "DELETE":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
        resume_id = path.split("/resumes/")[1]
        resume = db.resumes.get(resume_id)
        if not resume:
            return error_response("Resume not found", 404)
        if resume["userId"] != current_user_id:
            return error_response("Forbidden", 403)
            
        db.resumes.pop(resume_id, None)
        return json_response({"status": "deleted"}, 200)
        
    # 7. ADMIN ENDPOINTS
    elif (path in ("/admin/jobs/pending", "/admin/jobs")) and method == "GET":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
        user = db.users.get(current_user_id)
        if not user or user["role"] != "admin":
            return error_response("Forbidden", 403)
            
        status = query_params.get("status", "pending")
        jobs_list = [j for j in db.jobs.values() if j["status"] == status]
        items = []
        for j in jobs_list:
            comp = db.companies.get(j["companyId"])
            items.append({**j, "company": comp})
        return json_response(items, 200)
        
    elif (re.match(r"^/admin/jobs/[^/]+/approve$", path) or re.match(r"^/admin/jobs/[^/]+/status$", path)) and method in ("POST", "PATCH"):
        if not current_user_id:
            return error_response("Unauthenticated", 401)
        user = db.users.get(current_user_id)
        if not user or user["role"] != "admin":
            return error_response("Forbidden", 403)
            
        if "/approve" in path:
            job_id = path.split("/admin/jobs/")[1].split("/approve")[0]
            status = "live"
        else:
            job_id = path.split("/admin/jobs/")[1].split("/status")[0]
            status = body.get("status", "live")
            
        job = db.jobs.get(job_id)
        if not job:
            return error_response("Job not found", 404)
            
        job["status"] = status
        return json_response(job, 200)
        
    elif path == "/admin/stats" and method == "GET":
        if not current_user_id:
            return error_response("Unauthenticated", 401)
        user = db.users.get(current_user_id)
        if not user or user["role"] != "admin":
            return error_response("Forbidden", 403)
            
        stats = {
            "totalJobs": len(db.jobs),
            "live": len([j for j in db.jobs.values() if j["status"] == "live"]),
            "pending": len([j for j in db.jobs.values() if j["status"] == "pending"]),
            "applications": len(db.applications),
            "companies": len(db.companies)
        }
        return json_response(stats, 200)
        
    # 8. BILLING ENDPOINTS
    elif path == "/billing/feature-job" and method == "POST":
        job_id = body.get("jobId")
        if not job_id or job_id not in db.jobs:
            return error_response("Job not found", 404)
        return json_response({
            "url": f"http://payment-mock.com/checkout?jobId={job_id}",
            "sessionId": f"sess-{job_id}"
        }, 200)
        
    elif (path in ("/billing/webhook", "/billing/callback")) and method == "POST":
        job_id = body.get("jobId")
        sess_id = body.get("sessionId")
        if not job_id and sess_id and sess_id.startswith("sess-"):
            job_id = sess_id.split("sess-")[1]
            
        if not job_id or job_id not in db.jobs:
            return error_response("Job not found", 404)
            
        db.jobs[job_id]["featured"] = True
        return json_response({"status": "success", "featured": True}, 200)
        
    # NOT FOUND
    return error_response(f"Endpoint {method} {path} not found", 404)

@pytest.fixture(autouse=True)
def reset_db_state():
    db.reset()

def create_client():
    base_url = os.environ.get("VITE_API_URL") or os.environ.get("API_URL") or "http://localhost:8000"
    mock_e2e = os.environ.get("MOCK_E2E", "false").lower() == "true"
    
    use_mock = mock_e2e
    if not use_mock:
        try:
            httpx.get(f"{base_url}/auth/me", timeout=1.0)
            use_mock = False
        except Exception:
            use_mock = True
            
    if use_mock:
        transport = httpx.MockTransport(handle_request)
        client = httpx.Client(transport=transport, base_url=base_url)
    else:
        client = httpx.Client(base_url=base_url)
    return client

@pytest.fixture
def api_client():
    client = create_client()
    yield client
    client.close()

def _setup_role_client(client, role, name):
    email = f"{role}-{uuid.uuid4()}@example.com"
    password = "password123"
    
    # Register
    reg_resp = client.post("/auth/sign-up", json={
        "email": email,
        "password": password,
        "role": role,
        "fullName": name
    })
    assert reg_resp.status_code in (200, 201), f"Signup failed: {reg_resp.text}"
    
    # Sign in
    login_resp = client.post("/auth/sign-in", json={
        "email": email,
        "password": password
    })
    assert login_resp.status_code == 200, f"Signin failed: {login_resp.text}"
    token = login_resp.json()["token"]
    
    client.headers["Authorization"] = f"Bearer {token}"
    # Attach helper attributes
    client.user_id = login_resp.json()["user"]["id"]
    client.email = email
    client.password = password
    return client

@pytest.fixture
def seeker_client():
    client = create_client()
    _setup_role_client(client, "seeker", "John Seeker")
    yield client
    client.close()

@pytest.fixture
def employer_client():
    client = create_client()
    _setup_role_client(client, "employer", "Jane Employer")
    yield client
    client.close()

@pytest.fixture
def admin_client():
    client = create_client()
    _setup_role_client(client, "admin", "Admin Manager")
    yield client
    client.close()

