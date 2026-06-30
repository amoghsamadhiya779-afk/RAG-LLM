# E2E Test Suite Ready

## Test Runner
- Command: `$env:MOCK_E2E="true"; .venv/Scripts/pytest tests/e2e` or `.venv\Scripts\python -m pytest tests/e2e`
- Expected: All 62 E2E tests pass, with the Playwright UI test skipped gracefully (total 63 tests collected).

## Coverage Summary
| Tier | Count | Description |
|------|------:|-------------|
| 1. Feature Coverage | 25 | 5 test cases per core feature |
| 2. Boundary & Corner | 27 | Edge cases including authorization, negative validations, size limits |
| 3. Cross-Feature | 5 | Multi-step integration of related features |
| 4. Real-World Application | 5 | Seeker and employer end-to-end flow workloads |
| Playwright UI Test | 1 | Basic UI search, view, and apply flow (skipped locally) |
| **Total** | **63** | |

## Feature Checklist
| Feature | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---------|:------:|:------:|:------:|:------:|
| F1. Auth & Profile | 5 | 5 | ✓ | ✓ |
| F2. Job Board & RAG | 5 | 5 | ✓ | ✓ |
| F3. Job Creation & Admin | 5 | 7 | ✓ | ✓ |
| F4. Resume Upload & Parsing | 5 | 5 | ✓ | ✓ |
| F5. Saved Jobs & Applications | 5 | 5 | ✓ | ✓ |
