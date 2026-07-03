# Analysis Report: Gemini Model Centralization

## Executive Summary
A Forensic Audit of Milestone 1 identified an integrity violation: eight instances of the hardcoded `"gemini-2.5-flash"` model string were used as fallback values across seven Python source files. This violates Constraint R1 ("Ensure there are NO hardcoded 'gemini-1.5' or 'gemini-2.5' strings or stale defaults. Remove them from the codebase") and defeats the goal of centralizing configuration management.

To resolve this issue while preserving the system's ability to override model names via environment variables and run isolated tests (which monkeypatch config values), we propose a strategy to define all default models strictly inside the configuration (`app/core/config.py` and `app/rag/config.py`) and replace all point-of-call fallbacks with direct references to the centralized configuration setting.

---

## 1. Current Findings & Evidence

### Hardcoded Fallbacks in Application Code
A recursive grep search for `"gemini-2.5"` found eight occurrences of hardcoded `"gemini-2.5-flash"` fallback strings across seven files:

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
4. **`backend/app/rag/parser.py`** (Line 70):
   ```python
   model = settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```
5. **`backend/app/routers/chat.py`** (Line 31):
   ```python
   model = settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```
6. **`backend/app/routers/insights.py`** (Line 55):
   ```python
   model = settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```
7. **`backend/app/routers/jobs.py`** (Line 224):
   ```python
   model = settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```
8. **`backend/app/routers/resumes.py`** (Line 187):
   ```python
   model = settings.GEMINI_MODEL or "gemini-2.5-flash"
   ```

### Additional Stale Fallbacks (Embedding Models)
Additionally, we found one hardcoded fallback for the embedding model in **`backend/app/rag/embeddings.py`** (Line 81):
```python
model = core_settings.GEMINI_EMBED_MODEL or settings.GEMINI_EMBED_MODEL or "text-embedding-004"
```
To be consistent and prevent future failures, this should also be centralized.

---

## 2. Configuration Settings State

Currently, the configuration default values are empty or None:
- **`backend/app/core/config.py`**:
  ```python
  GEMINI_MODEL: str = ""
  GEMINI_EMBED_MODEL: str = ""
  ```
- **`backend/app/rag/config.py`**:
  ```python
  GEMINI_MODEL: str | None = Field(default=None, validation_alias="GEMINI_MODEL")
  GEMINI_EMBED_MODEL: str | None = Field(default=None, validation_alias="GEMINI_EMBED_MODEL")
  ```

---

## 3. Proposed Resolution Strategy

To achieve zero hardcoded fallback strings at the point of call, avoid duplication, and retain support for environment overrides and unit testing monkeypatching:

1. **Centralize Core Defaults**:
   Set default values in `backend/app/core/config.py`:
   - `GEMINI_MODEL: str = "gemini-2.5-flash"`
   - `GEMINI_EMBED_MODEL: str = "text-embedding-004"`

2. **Link RAG Defaults dynamically**:
   To prevent duplicating the defaults in `backend/app/rag/config.py` and to ensure they dynamically read from `app/core/config.py`'s instantiated settings (crucial for unit test monkeypatching), define them with `default_factory`:
   ```python
   from app.core.config import settings as core_settings

   # inside Settings(BaseSettings) class:
   GEMINI_MODEL: str | None = Field(default_factory=lambda: core_settings.GEMINI_MODEL, validation_alias="GEMINI_MODEL")
   GEMINI_EMBED_MODEL: str | None = Field(default_factory=lambda: core_settings.GEMINI_EMBED_MODEL, validation_alias="GEMINI_EMBED_MODEL")
   ```

3. **Simplify Point-Of-Call Usages**:
   Remove the `or "gemini-2.5-flash"` and `or "text-embedding-004"` fallbacks, relying strictly on the configuration variables.

---

## 4. Proposed Code Modifications (Diff Patch)

A clean diff representation of the proposed changes:

```diff
diff --git a/backend/app/core/config.py b/backend/app/core/config.py
--- a/backend/app/core/config.py
+++ b/backend/app/core/config.py
@@ -27,4 +27,4 @@
-    GEMINI_MODEL: str = ""
-    GEMINI_EMBED_MODEL: str = ""
+    GEMINI_MODEL: str = "gemini-2.5-flash"
+    GEMINI_EMBED_MODEL: str = "text-embedding-004"

diff --git a/backend/app/rag/config.py b/backend/app/rag/config.py
--- a/backend/app/rag/config.py
+++ b/backend/app/rag/config.py
@@ -7,4 +7,5 @@
+from app.core.config import settings as core_settings
 
 class Settings(BaseSettings):
@@ -20,4 +21,4 @@
-    GEMINI_MODEL: str | None = Field(default=None, validation_alias="GEMINI_MODEL")
-    GEMINI_EMBED_MODEL: str | None = Field(default=None, validation_alias="GEMINI_EMBED_MODEL")
+    GEMINI_MODEL: str | None = Field(default_factory=lambda: core_settings.GEMINI_MODEL, validation_alias="GEMINI_MODEL")
+    GEMINI_EMBED_MODEL: str | None = Field(default_factory=lambda: core_settings.GEMINI_EMBED_MODEL, validation_alias="GEMINI_EMBED_MODEL")

diff --git a/backend/app/main.py b/backend/app/main.py
--- a/backend/app/main.py
+++ b/backend/app/main.py
@@ -23,1 +23,1 @@
-        model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
+        model_name = settings.GEMINI_MODEL
@@ -81,1 +81,1 @@
-    model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
+    model_name = settings.GEMINI_MODEL

diff --git a/backend/app/rag/llm.py b/backend/app/rag/llm.py
--- a/backend/app/rag/llm.py
+++ b/backend/app/rag/llm.py
@@ -421,1 +421,1 @@
-            model = core_settings.GEMINI_MODEL or settings.GEMINI_MODEL or "gemini-2.5-flash"
+            model = settings.GEMINI_MODEL or core_settings.GEMINI_MODEL

diff --git a/backend/app/rag/embeddings.py b/backend/app/rag/embeddings.py
--- a/backend/app/rag/embeddings.py
+++ b/backend/app/rag/embeddings.py
@@ -81,1 +81,1 @@
-        model = core_settings.GEMINI_EMBED_MODEL or settings.GEMINI_EMBED_MODEL or "text-embedding-004"
+        model = settings.GEMINI_EMBED_MODEL or core_settings.GEMINI_EMBED_MODEL

diff --git a/backend/app/rag/parser.py b/backend/app/rag/parser.py
--- a/backend/app/rag/parser.py
+++ b/backend/app/rag/parser.py
@@ -70,1 +70,1 @@
-                model = settings.GEMINI_MODEL or "gemini-2.5-flash"
+                model = settings.GEMINI_MODEL

diff --git a/backend/app/routers/chat.py b/backend/app/routers/chat.py
--- a/backend/app/routers/chat.py
+++ b/backend/app/routers/chat.py
@@ -31,1 +31,1 @@
-        model = settings.GEMINI_MODEL or "gemini-2.5-flash"
+        model = settings.GEMINI_MODEL

diff --git a/backend/app/routers/insights.py b/backend/app/routers/insights.py
--- a/backend/app/routers/insights.py
+++ b/backend/app/routers/insights.py
@@ -55,1 +55,1 @@
-        model = settings.GEMINI_MODEL or "gemini-2.5-flash"
+        model = settings.GEMINI_MODEL

diff --git a/backend/app/routers/jobs.py b/backend/app/routers/jobs.py
--- a/backend/app/routers/jobs.py
+++ b/backend/app/routers/jobs.py
@@ -224,1 +224,1 @@
-        model = settings.GEMINI_MODEL or "gemini-2.5-flash"
+        model = settings.GEMINI_MODEL

diff --git a/backend/app/routers/resumes.py b/backend/app/routers/resumes.py
--- a/backend/app/routers/resumes.py
+++ b/backend/app/routers/resumes.py
@@ -187,1 +187,1 @@
-            model = settings.GEMINI_MODEL or "gemini-2.5-flash"
+            model = settings.GEMINI_MODEL
```

---

## 5. Verification Plan

1. **Verify No Fallbacks Remain**:
   Ensure `grep -rn "gemini-2.5" backend/app/` returns zero occurrences of `"gemini-2.5-flash"` inside the application source files (excluding configuration defaults and unit tests).
2. **Execute backend test suite**:
   Run `pytest` to confirm that all existing unit tests pass:
   ```bash
   cd backend
   $env:PYTHONPATH="."
   python -m pytest
   ```
