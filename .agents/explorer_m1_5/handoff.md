# Forensic Audit failure Remediation Analysis Handoff Report

## 1. Observation

A grep search for `"gemini-2.5"` and `"text-embedding-004"` across Python source code in the `backend/app/` directory revealed 8 instances of hardcoded `"gemini-2.5-flash"` fallbacks across 7 files, and 1 instance of a hardcoded `"text-embedding-004"` fallback in `embeddings.py`:

1. **`backend/app/main.py`** (Line 23):
   ```python
   model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```
2. **`backend/app/main.py`** (Line 81):
   ```python
   model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```
3. **`backend/app/rag/llm.py`** (Line 421):
   ```python
   model = core_settings.GEMINI_MODEL or settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```
4. **`backend/app/rag/embeddings.py`** (Line 81):
   ```python
   model = core_settings.GEMINI_EMBED_MODEL or settings.GEMINI_EMBED_MODEL or "text-embedding-004"
   ```
5. **`backend/app/rag/parser.py`** (Line 70):
   ```python
   model = settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```
6. **`backend/app/routers/chat.py`** (Line 31):
   ```python
   model = settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```
7. **`backend/app/routers/insights.py`** (Line 55):
   ```python
   model = settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```
8. **`backend/app/routers/jobs.py`** (Line 224):
   ```python
   model = settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```
9. **`backend/app/routers/resumes.py`** (Line 187):
   ```python
   model = settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```

No other instances of `"gemini-2.5"` or `"gemini-1.5"` were found in `backend/app`.

In `backend/app/core/config.py` (Line 27-28), the configuration variables are declared without defaults:
```python
    GEMINI_MODEL: str = ""
    GEMINI_EMBED_MODEL: str = ""
```

In `backend/app/rag/config.py` (Line 20-21), RAG configuration variables are declared:
```python
    GEMINI_MODEL: str | None = Field(default=None, validation_alias="GEMINI_MODEL")
    GEMINI_EMBED_MODEL: str | None = Field(default=None, validation_alias="GEMINI_EMBED_MODEL")
```

---

## 2. Logic Chain

1. **Observation 1**: Under task constraint **R1**, no hardcoded model strings (`"gemini-1.5"`, `"gemini-2.5"`) or stale fallback defaults should be present in implementation/business logic files.
2. **Observation 2**: Hardcoded `"gemini-2.5-flash"` and `"text-embedding-004"` strings exist as fallback values inline across 8 application and router files.
3. **Inference 1**: These inline fallbacks duplicate the default model definitions across the codebase, making changes difficult and violating configuration centralization.
4. **Inference 2**: By defining the default values centrally in `backend/app/core/config.py` (e.g., `GEMINI_MODEL: str = "gemini-2.5-flash"` and `GEMINI_EMBED_MODEL: str = "text-embedding-004"`), we can supply defaults through the settings class itself.
5. **Inference 3**: Since the configuration settings will always provide these defaults when the environment variables are empty, all implementation and router files can safely use `settings.GEMINI_MODEL` and `settings.GEMINI_EMBED_MODEL` directly, and we can remove the inline `"or ..."` fallback operators completely.
6. **Conclusion**: Modifying these 9 files to centralize the default configuration and clean all call sites achieves full remediation of the integrity violation.

---

## 3. Caveats

- Unit tests in `backend/tests/` still contain hardcoded `"gemini-2.5-flash"` values for mocking and test environment verification. The Forensic Auditor explicitly noted this is standard practice and not a violation.
- The RAG configuration `backend/app/rag/config.py` defaults to `None`, which resolves correctly by falling back to core settings `core_settings.GEMINI_MODEL` or `core_settings.GEMINI_EMBED_MODEL` when the specific RAG setting is unset.

---

## 4. Conclusion

The hardcoded fallbacks across the 7 router/service files bypass the centralization constraint. By moving the defaults to `backend/app/core/config.py` and removing the inline fallbacks in the routers and services, the centralization constraint is satisfied and all hardcoded model fallbacks are removed from the application logic.

---

## 5. Verification Method

1. **Check for Hardcoded Strings in Application Code**:
   Execute the following PowerShell commands in the `backend/` directory:
   ```powershell
   Get-ChildItem -Path "app" -Filter "*.py" -Recurse | Select-String -Pattern "gemini-2.5"
   Get-ChildItem -Path "app" -Filter "*.py" -Recurse | Select-String -Pattern "text-embedding-004"
   ```
   **Verification Condition**: Only `app/core/config.py` should show matches for these patterns. No router or business logic file should match.
2. **Run Unit Tests**:
   Ensure that the pytest suite executes and passes successfully:
   ```powershell
   pytest backend/tests
   ```
