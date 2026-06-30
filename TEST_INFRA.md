# E2E Test Infra: DevBoard

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Auth & Profile | ORIGINAL_REQUEST §R1, R2 | 5 | 5 | Yes |
| 2 | Job Board & RAG | ORIGINAL_REQUEST §R1, R2 | 5 | 5 | Yes |
| 3 | Job Creation & Admin | ORIGINAL_REQUEST §R1, R2 | 5 | 5 | Yes |
| 4 | Resume Upload & Parsing | ORIGINAL_REQUEST §R1, R2 | 5 | 5 | Yes |
| 5 | Saved Jobs & Applications | ORIGINAL_REQUEST §R1, R2 | 5 | 5 | Yes |

## Test Architecture
- Test runner: pytest
- Invocation command: `pytest tests/e2e`
- Directory layout:
  - `tests/e2e/conftest.py`
  - `tests/e2e/test_tier1_features.py`
  - `tests/e2e/test_tier2_boundaries.py`
  - `tests/e2e/test_tier3_combinations.py`
  - `tests/e2e/test_tier4_scenarios.py`
  - `tests/e2e/test_ui_playwright.py`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Seeker Job Search & Apply Lifecycle | F1, F2, F4, F5 | High |
| 2 | Employer Hiring Flow | F1, F3, F5 | High |
| 3 | Job Moderation & Discovery | F1, F2, F3 | Medium |
| 4 | Multi-User Resume-Based Matching | F1, F2, F4 | High |
| 5 | Billing and Featured Job Flow | F1, F3 | Medium |

## Coverage Thresholds
- Tier 1: 25 test cases (5 per feature)
- Tier 2: 25 test cases (5 per feature)
- Tier 3: 5 cross-feature combination test cases
- Tier 4: 5 realistic application scenario test cases
- **Total: 60 test cases**

---

## Detailed Test Case Inventory

### Tier 1: Feature Coverage (Happy Path - 25 Test Cases)

#### Feature 1: Auth & Profile
1. **`test_seeker_signup`**
   - *Objective*: Verify successful sign-up for a job seeker.
   - *Steps*: Post seeker email, password, and fullName to `/auth/signup`.
   - *Assertions*: Check for status 201/200, returns valid user ID, name, role `seeker`, and token/session.
2. **`test_seeker_signin`**
   - *Objective*: Verify successful sign-in for a registered seeker.
   - *Steps*: Post valid seeker credentials to `/auth/signin`.
   - *Assertions*: Check status 200, returns valid JWT token and token type `bearer`.
3. **`test_employer_signup`**
   - *Objective*: Verify successful sign-up for an employer.
   - *Steps*: Post employer email, password, and company info to `/auth/signup`.
   - *Assertions*: Check status 201/200, returns role `employer` and active session.
4. **`test_auth_me`**
   - *Objective*: Verify current user info retrieval using JWT.
   - *Steps*: Send GET request to `/auth/me` with bearer token.
   - *Assertions*: Check status 200, verify email, roles, and ID match the logged-in user.
5. **`test_update_company`**
   - *Objective*: Verify employer can update their company profile.
   - *Steps*: Send PATCH/PUT request to `/companies/profile` with updated company details.
   - *Assertions*: Check status 200, verify returned company data matches update inputs.

#### Feature 2: Job Board & RAG
6. **`test_list_jobs`**
   - *Objective*: Verify retrieval of active jobs with pagination.
   - *Steps*: Send GET request to `/jobs` with query params `page=1&limit=10`.
   - *Assertions*: Check status 200, response contains list of jobs and pagination metadata (total, limit, page).
7. **`test_filter_jobs`**
   - *Objective*: Verify job list filtering by location and employment type.
   - *Steps*: Send GET to `/jobs` with `location=remote&type=full-time`.
   - *Assertions*: Check status 200, all returned jobs match the filter criteria.
8. **`test_search_jobs_lexical`**
   - *Objective*: Verify exact keyword matching (lexical search).
   - *Steps*: Send GET to `/jobs/search` with query text `React`.
   - *Assertions*: Check status 200, results contain "React" in title or description.
9. **`test_search_jobs_semantic`**
   - *Objective*: Verify natural language semantic search using vector embeddings.
   - *Steps*: Send GET/POST to `/jobs/search/semantic` with query "looking for cloud infrastructure engineer".
   - *Assertions*: Check status 200, results include relevant DevOps/AWS jobs even without exact string match.
10. **`test_similar_jobs`**
    - *Objective*: Verify retrieval of similar jobs for a selected job posting.
    - *Steps*: Send GET to `/jobs/{job_id}/similar`.
    - *Assertions*: Check status 200, returns a list of jobs with similar skill requirements or roles.

#### Feature 3: Job CRUD & Admin
11. **`test_employer_create_job`**
    - *Objective*: Verify employer can successfully post a new job.
    - *Steps*: Post job title, description, location, and salary to `/jobs` as authenticated employer.
    - *Assertions*: Check status 201, job is created, status defaults to `pending` review.
12. **`test_employer_update_job`**
    - *Objective*: Verify employer can modify their own job posting.
    - *Steps*: Send PUT/PATCH request to `/jobs/{job_id}` with updated description.
    - *Assertions*: Check status 200, verify updated description is saved.
13. **`test_employer_list_own_jobs`**
    - *Objective*: Verify employers can see only their own job postings.
    - *Steps*: Send GET to `/jobs/mine` as authenticated employer.
    - *Assertions*: Check status 200, all returned jobs belong to the employer's company.
14. **`test_admin_list_pending`**
    - *Objective*: Verify admin can view jobs awaiting moderation.
    - *Steps*: Send GET to `/admin/jobs/pending` as authenticated admin.
    - *Assertions*: Check status 200, all returned jobs have status `pending`.
15. **`test_admin_approve_job`**
    - *Objective*: Verify admin can approve a pending job posting.
    - *Steps*: Send POST to `/admin/jobs/{job_id}/approve` as authenticated admin.
    - *Assertions*: Check status 200, job status changes to `active` and it is now discoverable.

#### Feature 4: Resume RAG
16. **`test_upload_resume_pdf`**
    - *Objective*: Verify successful PDF resume upload.
    - *Steps*: Post a multipart form with a valid PDF file to `/resumes/upload`.
    - *Assertions*: Check status 201/200, returns resume metadata including generated ID and file path.
17. **`test_upload_resume_docx`**
    - *Objective*: Verify successful DOCX resume upload.
    - *Steps*: Post a multipart form with a valid DOCX file to `/resumes/upload`.
    - *Assertions*: Check status 201/200, returns valid metadata.
18. **`test_trigger_resume_parse`**
    - *Objective*: Verify triggering the background parsing engine.
    - *Steps*: Send POST to `/resumes/{resume_id}/parse`.
    - *Assertions*: Check status 202 (Accepted), background job ID is returned.
19. **`test_list_resumes`**
    - *Objective*: Verify seeker can view all of their uploaded resumes.
    - *Steps*: Send GET to `/resumes` as seeker.
    - *Assertions*: Check status 200, returns list of all uploaded resumes for this user.
20. **`test_verify_resume_parsed_fields`**
    - *Objective*: Validate structured data fields extracted during parsing.
    - *Steps*: Send GET to `/resumes/{resume_id}/parsed-data`.
    - *Assertions*: Check status 200, verify fields like `skills` (list), `experience` (list), and `education` are populated.

#### Feature 5: Applications & Saved
21. **`test_save_job`**
    - *Objective*: Verify seeker can save/bookmark a job.
    - *Steps*: Send POST to `/jobs/{job_id}/save` as seeker.
    - *Assertions*: Check status 200/201, verification message/flag confirms job is saved.
22. **`test_unsave_job`**
    - *Objective*: Verify seeker can remove a bookmarked job.
    - *Steps*: Send POST/DELETE to `/jobs/{job_id}/unsave` as seeker.
    - *Assertions*: Check status 200, job is removed from saved list.
23. **`test_list_saved_jobs`**
    - *Objective*: Verify seeker can view all their saved jobs.
    - *Steps*: Send GET to `/jobs/saved` as seeker.
    - *Assertions*: Check status 200, returns accurate list of saved job entities.
24. **`test_apply_job_with_resume`**
    - *Objective*: Verify applying to a job referencing an uploaded resume.
    - *Steps*: Post to `/jobs/{job_id}/apply` with `resume_id` and cover letter.
    - *Assertions*: Check status 201, application is recorded with status `submitted`.
25. **`test_list_applications_employer`**
    - *Objective*: Verify employer can view applications for their posted job.
    - *Steps*: Send GET to `/jobs/{job_id}/applications` as the job owner.
    - *Assertions*: Check status 200, returns applications list with applicant details.

---

### Tier 2: Boundary & Corner Cases (25 Test Cases)

#### Feature 1: Auth & Profile
26. **`test_signup_invalid_email`**
    - *Objective*: Verify sign-up fails with malformed email addresses.
    - *Steps*: Attempt sign-up with email `invalid_email.com`.
    - *Assertions*: Check status 422/400 (Bad Request), response details invalid format.
27. **`test_signup_weak_password`**
    - *Objective*: Verify validation rejects passwords that do not meet security criteria.
    - *Steps*: Attempt sign-up with password `123`.
    - *Assertions*: Check status 422/400, details password complexity requirements.
28. **`test_signin_wrong_password`**
    - *Objective*: Verify authentication failure on incorrect credentials.
    - *Steps*: Sign in with registered email but incorrect password.
    - *Assertions*: Check status 401 (Unauthorized), error message indicates invalid credentials.
29. **`test_unauthorized_access`**
    - *Objective*: Verify API endpoints are protected against unauthenticated requests.
    - *Steps*: Send GET to `/auth/me` without passing authorization headers.
    - *Assertions*: Check status 401 (Unauthorized) or 403 (Forbidden).
30. **`test_update_profile_invalid_fields`**
    - *Objective*: Verify profile updates validate fields correctly.
    - *Steps*: Send PATCH `/companies/profile` with empty company name.
    - *Assertions*: Check status 422/400, fields fail schema validation.

#### Feature 2: Job Board & RAG
31. **`test_search_empty_query`**
    - *Objective*: Verify search behavior when query is empty or just spaces.
    - *Steps*: Send GET to `/jobs/search` with query `   `.
    - *Assertions*: Check status 200, returns either default job list or an empty array without crashing.
32. **`test_jobs_invalid_pagination`**
    - *Objective*: Verify pagination handles invalid/negative numbers.
    - *Steps*: Send GET to `/jobs` with `page=-1&limit=-10`.
    - *Assertions*: Check status 422 or falls back gracefully to default values (`page=1`, `limit=10`).
33. **`test_recommendations_nonexistent_resume`**
    - *Objective*: Verify behavior when querying recommendations for missing resume.
    - *Steps*: Send GET to `/jobs/recommendations` with fake UUID `00000000-0000-0000-0000-000000000000`.
    - *Assertions*: Check status 404 (Not Found).
34. **`test_similar_nonexistent_job`**
    - *Objective*: Verify behavior when querying similar jobs for invalid job ID.
    - *Steps*: Send GET to `/jobs/99999/similar`.
    - *Assertions*: Check status 404 (Not Found).
35. **`test_search_extreme_length`**
    - *Objective*: Verify search handles inputs of extreme length safely.
    - *Steps*: Send GET to `/jobs/search` with query string exceeding 1000 characters.
    - *Assertions*: Check status 400 (Bad Request) or handles query gracefully without internal error.

#### Feature 3: Job CRUD & Admin
36. **`test_seeker_cannot_create_job`**
    - *Objective*: Verify RBAC restricts seekers from posting jobs.
    - *Steps*: Post a job to `/jobs` using a seeker bearer token.
    - *Assertions*: Check status 403 (Forbidden).
37. **`test_nonadmin_cannot_approve`**
    - *Objective*: Verify RBAC restricts non-admins from approving jobs.
    - *Steps*: Post to `/admin/jobs/{job_id}/approve` using employer or seeker token.
    - *Assertions*: Check status 403 (Forbidden).
38. **`test_job_negative_salary`**
    - *Objective*: Verify validation rules prevent posting jobs with negative salaries.
    - *Steps*: Post to `/jobs` with `salary_min=-50000`.
    - *Assertions*: Check status 422/400 (Validation Error).
39. **`test_job_invalid_status`**
    - *Objective*: Verify status state transitions are restricted to allowed states.
    - *Steps*: Post patch to `/jobs/{job_id}` with status `unknown_status`.
    - *Assertions*: Check status 422/400 (Validation Error).
40. **`test_job_create_missing_fields`**
    - *Objective*: Verify schema constraints require mandatory fields.
    - *Steps*: Post to `/jobs` omitting the `title` and `description` fields.
    - *Assertions*: Check status 422/400 (Validation Error).

#### Feature 4: Resume RAG
41. **`test_upload_unsupported_type`**
    - *Objective*: Verify only allowed document types can be uploaded.
    - *Steps*: Post a `.txt` or `.exe` file to `/resumes/upload`.
    - *Assertions*: Check status 400 (Bad Request), message rejects file type.
42. **`test_parse_nonexistent_resume`**
    - *Objective*: Verify error handling when parsing invalid resume ID.
    - *Steps*: Post `/resumes/99999/parse`.
    - *Assertions*: Check status 404 (Not Found).
43. **`test_upload_oversized_file`**
    - *Objective*: Verify file size limits are enforced.
    - *Steps*: Upload a mock PDF larger than 10MB to `/resumes/upload`.
    - *Assertions*: Check status 413 (Payload Too Large) or 400 (Bad Request).
44. **`test_parse_empty_resume`**
    - *Objective*: Verify parsing handles blank/unreadable files without failing.
    - *Steps*: Upload empty/corrupt PDF, trigger parsing.
    - *Assertions*: Check status 200/400, parses without error but returns empty structured fields.
45. **`test_parse_concurrent_requests`**
    - *Objective*: Verify parallel triggers on the same resume handle locks or queues safely.
    - *Steps*: Send multiple POST requests to `/resumes/{resume_id}/parse` concurrently.
    - *Assertions*: Verifies safe queueing or rejects secondary request with status 409 (Conflict).

#### Feature 5: Applications & Saved
46. **`test_apply_twice`**
    - *Objective*: Verify duplicate applications are rejected.
    - *Steps*: Post to `/jobs/{job_id}/apply` twice for the same job and seeker.
    - *Assertions*: Check status 400 or 409, message indicates application already exists.
47. **`test_seeker_cannot_view_others_applications`**
    - *Objective*: Verify data privacy is maintained across seekers.
    - *Steps*: Attempt to read `/applications/{application_id}` using a different seeker's token.
    - *Assertions*: Check status 403 (Forbidden).
48. **`test_apply_nonexistent_job`**
    - *Objective*: Verify application fails for invalid jobs.
    - *Steps*: Post to `/jobs/99999/apply` with a valid resume ID.
    - *Assertions*: Check status 404 (Not Found).
49. **`test_update_application_invalid_stage`**
    - *Objective*: Verify stage updates are validated.
    - *Steps*: Post patch to update application stage to `hired_by_accident`.
    - *Assertions*: Check status 422/400 (Validation Error).
50. **`test_apply_missing_resume_or_cover`**
    - *Objective*: Verify application fails when missing mandatory credentials.
    - *Steps*: Post to `/jobs/{job_id}/apply` without a `resume_id`.
    - *Assertions*: Check status 422/400 (Validation Error).

---

### Tier 3: Cross-Feature Combinations (Pairwise - 5 Test Cases)

51. **`test_combo_employer_post_seeker_recommend`**
    - *Description*: Employer posts a job with specific skill requirements -> Seeker uploads resume matching those skills -> Seeker requests job recommendations.
    - *Assertions*: Job posted by the employer must appear in the seeker's RAG recommendation list, showing the RAG pipeline is working end-to-end.
52. **`test_combo_saved_job_archived`**
    - *Description*: Seeker bookmarks/saves an active job posting -> Employer archives/deletes that job posting.
    - *Assertions*: Seeker's saved jobs list indicates the job is no longer active or removes it, resolving database foreign key relations gracefully.
53. **`test_combo_application_stage_tracking`**
    - *Description*: Seeker submits application -> Employer views applications for their job -> Employer transitions the candidate's application stage (e.g. from `applied` to `interviewing`).
    - *Assertions*: Seeker queries their applications list and immediately observes the updated status (`interviewing`).
54. **`test_combo_company_profile_updates_job_results`**
    - *Description*: Employer changes company display name -> Seeker performs a job search matching that company's jobs.
    - *Assertions*: Search results immediately display the updated company display name across all active job postings, verifying denormalized synchronization or clean joins.
55. **`test_combo_resume_deletion_flow`**
    - *Description*: Seeker uploads a resume -> Seeker applies to a job using that resume -> Seeker deletes the resume from their profile.
    - *Assertions*: Application is preserved and either stores a snapshot or is reference-locked, maintaining integrity without cascading deletion failures.

---

### Tier 4: Real-World Application Scenarios (Workloads - 5 Test Cases)

56. **`test_scenario_seeker_job_search_apply` (Seeker Job Search & Apply Lifecycle)**
    - *Description*: Simulates the comprehensive journey of a job seeker.
      1. Seeker registers and logs in.
      2. Seeker uploads a PDF resume.
      3. Seeker triggers background RAG parsing and verifies extraction.
      4. Seeker conducts semantic search for a specific role and filters by location.
      5. Seeker fetches RAG job recommendations.
      6. Seeker bookmarks one job.
      7. Seeker submits application to the best-matching job with the parsed resume.
    - *Assertions*: Successful status codes returned for each step; application state is logged correctly in database.
57. **`test_scenario_employer_hiring_flow` (Employer Hiring Flow)**
    - *Description*: Simulates an employer's hiring lifecycle.
      1. Employer registers and logs in.
      2. Employer populates and saves company profile.
      3. Employer posts a new job (which gets approved by mock/admin).
      4. Employer waits and then lists applications received for the job.
      5. Employer downloads/inspects applicant's resume parsed details.
      6. Employer moves applicant to `interviewing` stage, then to `offered`.
    - *Assertions*: All CRUD and updates succeed, status changes persist.
58. **`test_scenario_job_moderation_discovery` (Job Moderation & Discovery)**
    - *Description*: Simulates moderation gatekeeping workflow.
      1. Employer posts a new job.
      2. Seeker searches for jobs; verifies this job is NOT visible (pending status).
      3. Admin logs in and retrieves list of pending jobs.
      4. Admin approves the job posting.
      5. Seeker searches again; verifies job IS visible, bookmarked, and open for application.
    - *Assertions*: Pending jobs are invisible to search; admin moderation actions immediately toggle public search visibility.
59. **`test_scenario_multi_user_rag_matching` (Multi-User Resume-Based Matching)**
    - *Description*: Verifies RAG search ranking logic for multiple seekers.
      1. Seeker A (React Specialist), Seeker B (Python Backend Dev), and Seeker C (Sales Lead) upload resumes.
      2. RAG processing completes for all three.
      3. Employer posts a job seeking a "Senior Python Engineer with FastAPI experience".
      4. Recommendations query is run against the job by the system.
    - *Assertions*: Seeker B must be ranked highest in recommendation match scores compared to Seeker A and Seeker C.
60. **`test_scenario_billing_featured_job` (Billing and Featured Job Flow)**
    - *Description*: Verifies billing integration for job promotions.
      1. Employer posts a job.
      2. Employer requests to feature the job (sends payment mock trigger).
      3. Payment processor sends callback verifying payment status.
      4. Job status updates to `featured=True`.
      5. Seeker performs search; featured job appears at the top of results.
    - *Assertions*: Payment callback updates job record; search algorithm prioritizes featured listings.

---

### UI Playwright E2E Test
- **`tests/e2e/test_ui_playwright.py`**
  - *Objective*: Validate UI user flow with Playwright.
  - *Steps*: 
    1. Launch browser to DevBoard homepage.
    2. Input search keyword in search bar.
    3. Click on a job card to view details.
    4. Fill application form (name, email) and click submit.
  - *Assertions*: DOM elements render correctly, search action populates list, detail page displays specific job attributes, success notification appears on application submit.
