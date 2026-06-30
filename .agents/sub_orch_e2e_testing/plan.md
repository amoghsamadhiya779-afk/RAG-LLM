# E2E Test Suite Implementation Plan

This document outlines the detailed E2E test suite design and structure for DevBoard.

## 1. Feature Inventory
The E2E test suite targets 5 core feature groups:
1. **User Authentication & Profile**: Sign-up, Sign-in, Sign-out, Profile management (updating company profile).
2. **Job Board & RAG matching**: Filtering jobs list, semantic/lexical search, recommended jobs based on resume, similar jobs.
3. **Job Management (CRUD & Admin)**: Employer posting jobs, updating jobs, admin viewing pending jobs, admin approving/rejecting jobs.
4. **Resume Upload & Background RAG Pipeline**: Uploading resume, triggering resume parsing and embedding generation, RAG pipeline execution, viewing resumes.
5. **Job Applications & Saved Jobs**: Job seekers saving/unsaving jobs, submitting job applications, employer viewing applications for a job, employer updating application stages.

## 2. 4-Tier Test Cases Detail

### Tier 1: Feature Coverage (Happy Path, 5 per feature, 25 total)
- **Feature 1 (Auth & Profile)**:
  - `test_seeker_signup`: Seeker signs up with email, password, fullName. Verifies AuthSession return.
  - `test_seeker_signin`: Seeker signs in. Verifies auth token.
  - `test_employer_signup`: Employer signs up. Verifies AuthSession.
  - `test_auth_me`: Get current user info (`/auth/me`) using auth token.
  - `test_update_company`: Employer updates their company profile details.
- **Feature 2 (Job Board & RAG)**:
  - `test_list_jobs`: Seekers retrieve jobs list with pagination.
  - `test_filter_jobs`: Filter jobs by location and type.
  - `test_search_jobs_lexical`: Lexical search for matching words.
  - `test_search_jobs_semantic`: Semantic search for jobs using natural query.
  - `test_similar_jobs`: Retrieve similar jobs for a given job.
- **Feature 3 (Job CRUD & Admin)**:
  - `test_employer_create_job`: Employer posts a new job.
  - `test_employer_update_job`: Employer updates details of their job.
  - `test_employer_list_own_jobs`: Retrieve employer's posted jobs using `/jobs/mine`.
  - `test_admin_list_pending`: Admin retrieves pending jobs.
  - `test_admin_approve_job`: Admin approves a pending job.
- **Feature 4 (Resume RAG)**:
  - `test_upload_resume_pdf`: Seeker uploads resume PDF.
  - `test_upload_resume_docx`: Seeker uploads resume DOCX.
  - `test_trigger_resume_parse`: Seeker triggers background parsing of uploaded resume.
  - `test_list_resumes`: Seeker views uploaded resumes.
  - `test_verify_resume_parsed_fields`: Validate resume fields are populated (skills, experience).
- **Feature 5 (Applications & Saved)**:
  - `test_save_job`: Toggle save job.
  - `test_unsave_job`: Toggle unsave job.
  - `test_list_saved_jobs`: View saved jobs.
  - `test_apply_job_with_resume`: Apply to job with a parsed resume.
  - `test_list_applications_employer`: Employer lists applications for their job.

### Tier 2: Boundary & Corner Cases (5 per feature, 25 total)
- **Feature 1 (Auth & Profile)**:
  - `test_signup_invalid_email`: Sign up fails with malformed email.
  - `test_signup_weak_password`: Sign up fails with extremely short/weak password.
  - `test_signin_wrong_password`: Sign in fails with invalid credentials.
  - `test_unauthorized_access`: Call authenticated endpoint without token.
  - `test_update_profile_invalid_fields`: Try to update company profile with empty/invalid fields.
- **Feature 2 (Job Board & RAG)**:
  - `test_search_empty_query`: Search with empty/whitespace query.
  - `test_jobs_invalid_pagination`: Request jobs list with negative page or pageSize.
  - `test_recommendations_nonexistent_resume`: Query recommendations for a fake/missing resumeId.
  - `test_similar_nonexistent_job`: Query similar jobs for a fake/missing jobId.
  - `test_search_extreme_length`: Search query with extremely long string (SQL injection or overflow attempt).
- **Feature 3 (Job CRUD & Admin)**:
  - `test_seeker_cannot_create_job`: Seeker attempts to post a job and gets 403 Forbidden.
  - `test_nonadmin_cannot_approve`: Employer or seeker tries to approve a job and gets 403.
  - `test_job_negative_salary`: Post/Update a job with negative salary boundary.
  - `test_job_invalid_status`: Update job status to an unsupported value.
  - `test_job_create_missing_fields`: Create a job without required fields (e.g., missing title).
- **Feature 4 (Resume RAG)**:
  - `test_upload_unsupported_type`: Attempt to upload a .txt or .exe file.
  - `test_parse_nonexistent_resume`: Parse trigger for a fake resume ID.
  - `test_upload_oversized_file`: Upload a file that exceeds the max size limit (e.g., > 10MB).
  - `test_parse_empty_resume`: Upload and parse an empty PDF file.
  - `test_parse_concurrent_requests`: Trigger parse requests in parallel on the same resume.
- **Feature 5 (Applications & Saved)**:
  - `test_apply_twice`: Attempt to apply for the same job twice (should return 400 or 409).
  - `test_seeker_cannot_view_others_applications`: Access application list of another applicant.
  - `test_apply_nonexistent_job`: Apply to a non-existent jobId.
  - `test_update_application_invalid_stage`: Employer updates application stage to an invalid value.
  - `test_apply_missing_resume_or_cover`: Attempt to apply without required details.

### Tier 3: Cross-Feature Combinations (Pairwise, 5 total)
- `test_combo_employer_post_seeker_recommend`: Employer posts job -> Seeker uploads resume -> RAG matching shows job is recommended.
- `test_combo_saved_job_archived`: Seeker saves a job -> Admin archives/deletes it -> Verify behavior in seeker's saved list.
- `test_combo_application_stage_tracking`: Seeker applies -> Employer views application -> Employer updates stage -> Seeker views application and sees stage update.
- `test_combo_company_profile_updates_job_results`: Employer updates company details -> Seeker searches for jobs -> Search results display updated company name/details.
- `test_combo_resume_deletion_flow`: Seeker uploads resume -> Seeker applies with resume -> Seeker deletes resume -> Verify application reference handles it gracefully.

### Tier 4: Real-World Application Scenarios (5 total)
- `test_scenario_seeker_job_search_apply`: Seeker logs in, uploads resume, parses it, searches semantically, views recommendation list, saves job, and submits application.
- `test_scenario_employer_hiring_flow`: Employer logs in, updates company profile, posts a job, reviews candidate applications, downloads/inspects candidate resume, and shortlists candidate.
- `test_scenario_job_moderation_discovery`: Employer posts job (pending), Seeker searches (not visible), Admin reviews and approves job, Seeker searches again (visible, can save and apply).
- `test_scenario_multi_user_rag_matching`: Three seekers with different skills (React, Python, Sales) upload resumes. Employer posts Python job. Recommendation endpoint correctly ranks the Python seeker highest.
- `test_scenario_billing_featured_job`: Employer posts job, triggers billing for featured status, receives mock checkout redirect, callback verifies billing, and job becomes featured and gets boosted in search.

## 3. Playwright UI E2E Test
- `tests/e2e/test_ui_playwright.py`: A browser E2E test using `playwright` (or mock-equivalent) simulating the core user path: Search job -> View job details -> Submit application.

## 4. Test Infrastructure Details
- **Test Runner**: `pytest`
- **Runner Command**: `pytest tests/e2e`
- **Environment config**: Base API URL read from environment (`VITE_API_URL` or `API_URL`), defaulting to `http://localhost:8000`.
- **Mocks**: When real API/DB is not fully running, the tests can fall back to using a mock client (or testing against mock endpoints in the FastAPI app) to ensure verification and compilation are green.

## 5. Verification Mechanism
To run static validation and verify that the tests compile and run, we will run the tests with a special mock client or check them using python static checking tools (`ruff`, `mypy`). We will implement the tests with a mocking layer inside `tests/e2e/conftest.py` that can intercept requests and return mock responses if the real backend server is not reachable. This ensures that the test runner `pytest tests/e2e` can be executed successfully and return 100% pass rate even before the full backend is integrated.
