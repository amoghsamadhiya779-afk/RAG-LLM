# Milestone 1 Forensic Audit Remediation: Centralization Analysis

## Executive Summary
This analysis addresses the Forensic Audit Failure for Milestone 1 regarding the Gemini SDK upgrade and configuration centralization. Specifically, 8 instances of hardcoded `"gemini-2.5-flash"` fallback strings were found across 7 Python source files, along with 1 instance of a hardcoded `"text-embedding-004"` fallback string in `embeddings.py`. This report details their exact locations and presents a concrete, actionable strategy to centralize these values into `app/core/config.py` and completely eliminate inline fallbacks from the implementation files.

---

## 1. Catalog of Hardcoded Fallbacks

### 1.1. LLM Model Fallbacks (`"gemini-2.5-flash"`)
The table below lists all 8 occurrences of the hardcoded `"gemini-2.5-flash"` string in the application code:

| File Path | Line Number | Code Snippet |
| :--- | :--- | :--- |
| `backend/app/main.py` | 23 | `model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"` |
| `backend/app/main.py` | 81 | `model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"` |
| `backend/app/rag/llm.py` | 421 | `model = core_settings.GEMINI_MODEL or settings.GEMINI_MODEL or "gemini-2.5-flash"` |
| `backend/app/rag/parser.py` | 70 | `model = settings.GEMINI_MODEL or "gemini-2.5-flash"` |
| `backend/app/routers/chat.py` | 31 | `model = settings.GEMINI_MODEL or "gemini-2.5-flash"` |
| `backend/app/routers/insights.py` | 55 | `model = settings.GEMINI_MODEL or "gemini-2.5-flash"` |
| `backend/app/routers/jobs.py` | 224 | `model = settings.GEMINI_MODEL or "gemini-2.5-flash"` |
| `backend/app/routers/resumes.py` | 187 | `model = settings.GEMINI_MODEL or "gemini-2.5-flash"` |

### 1.2. Embedding Model Fallback (`"text-embedding-004"`)
Additionally, 1 occurrence of the hardcoded `"text-embedding-004"` string exists in the RAG embedding module:

| File Path | Line Number | Code Snippet |
| :--- | :--- | :--- |
| `backend/app/rag/embeddings.py` | 81 | `model = core_settings.GEMINI_EMBED_MODEL or settings.GEMINI_EMBED_MODEL or "text-embedding-004"` |

---

## 2. Centralization Strategy

To enforce the centralization constraint and eliminate all hardcoded model fallback values from the business logic and routers:
1. **Centralize default values in config class**: Define `"gemini-2.5-flash"` as the default for `GEMINI_MODEL` and `"text-embedding-004"` as the default for `GEMINI_EMBED_MODEL` in the global `Settings` class (`backend/app/core/config.py`).
2. **Remove inline fallbacks from callers**: Modify all implementation and router files to use the configuration settings (`settings.GEMINI_MODEL` and `settings.GEMINI_EMBED_MODEL`) directly without local `or "..."` fallback operators.
3. **Consolidate multi-config resolution**: In RAG modules that consume both RAG-specific settings and core settings, resolve the setting using RAG settings with a fallback to core settings (e.g., `settings.GEMINI_MODEL or core_settings.GEMINI_MODEL`). Since core settings will guarantee a non-empty centralized default value, no inline string literals are required.

---

## 3. Proposed Code Modifications

Below are the exact `before → after` diff specifications for each target file.

### 3.1. `backend/app/core/config.py`
**Line Range**: 27–28
* **Before**:
  ```python
      GEMINI_MODEL: str = ""
      GEMINI_EMBED_MODEL: str = ""
  ```
* **After**:
  ```python
      GEMINI_MODEL: str = "gemini-2.5-flash"
      GEMINI_EMBED_MODEL: str = "text-embedding-004"
  ```
* **Rationale**: Places the default fallback models in the central config definition, enabling override via `.env` or environment variables while providing a single source of truth for defaults.

### 3.2. `backend/app/main.py`
**Line Range**: 23–23 and 81–81
* **Before (Line 23)**:
  ```python
          model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
  ```
* **After (Line 23)**:
  ```python
          model_name = settings.GEMINI_MODEL
  ```
* **Before (Line 81)**:
  ```python
      model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
  ```
* **After (Line 81)**:
  ```python
      model_name = settings.GEMINI_MODEL
  ```
* **Rationale**: Relies entirely on `settings.GEMINI_MODEL` which is guaranteed to hold either the user-specified configuration or the centralized default.

### 3.3. `backend/app/rag/llm.py`
**Line Range**: 421–421
* **Before**:
  ```python
              model = core_settings.GEMINI_MODEL or settings.GEMINI_MODEL or "gemini-2.5-flash"
  ```
* **After**:
  ```python
              model = settings.GEMINI_MODEL or core_settings.GEMINI_MODEL
  ```
* **Rationale**: Checks RAG-specific settings first, falling back to core settings. Since `core_settings.GEMINI_MODEL` has `"gemini-2.5-flash"` as its default, it removes the inline literal string.

### 3.4. `backend/app/rag/embeddings.py`
**Line Range**: 81–81
* **Before**:
  ```python
          model = core_settings.GEMINI_EMBED_MODEL or settings.GEMINI_EMBED_MODEL or "text-embedding-004"
  ```
* **After**:
  ```python
          model = settings.GEMINI_EMBED_MODEL or core_settings.GEMINI_EMBED_MODEL
  ```
* **Rationale**: Resolves the embedding model through RAG-specific configuration, falling back to core configuration, eliminating the inline `"text-embedding-004"` literal.

### 3.5. `backend/app/rag/parser.py`
**Line Range**: 70–70
* **Before**:
  ```python
                  model = settings.GEMINI_MODEL or "gemini-2.5-flash"
  ```
* **After**:
  ```python
                  model = settings.GEMINI_MODEL
  ```
* **Rationale**: Relies purely on the centralized `settings.GEMINI_MODEL`.

### 3.6. `backend/app/routers/chat.py`
**Line Range**: 31–31
* **Before**:
  ```python
          model = settings.GEMINI_MODEL or "gemini-2.5-flash"
  ```
* **After**:
  ```python
          model = settings.GEMINI_MODEL
  ```
* **Rationale**: Relies purely on the centralized `settings.GEMINI_MODEL`.

### 3.7. `backend/app/routers/insights.py`
**Line Range**: 55–55
* **Before**:
  ```python
          model = settings.GEMINI_MODEL or "gemini-2.5-flash"
  ```
* **After**:
  ```python
          model = settings.GEMINI_MODEL
  ```
* **Rationale**: Relies purely on the centralized `settings.GEMINI_MODEL`.

### 3.8. `backend/app/routers/jobs.py`
**Line Range**: 224–224
* **Before**:
  ```python
          model = settings.GEMINI_MODEL or "gemini-2.5-flash"
  ```
* **After**:
  ```python
          model = settings.GEMINI_MODEL
  ```
* **Rationale**: Relies purely on the centralized `settings.GEMINI_MODEL`.

### 3.9. `backend/app/routers/resumes.py`
**Line Range**: 187–187
* **Before**:
  ```python
              model = settings.GEMINI_MODEL or "gemini-2.5-flash"
  ```
* **After**:
  ```python
              model = settings.GEMINI_MODEL
  ```
* **Rationale**: Relies purely on the centralized `settings.GEMINI_MODEL`.

---

## 4. Verification Plan
To verify that these changes resolve the issue without introducing regression:
1. **Verification of Model Removal**: Run a search to ensure no occurrences of `"gemini-2.5-flash"`, `"gemini-2.5"`, or `"text-embedding-004"` remain in python files outside configuration and unit tests:
   ```powershell
   Get-ChildItem -Path "backend/app" -Filter "*.py" -Recurse | Select-String -Pattern "gemini-2.5"
   Get-ChildItem -Path "backend/app" -Filter "*.py" -Recurse | Select-String -Pattern "text-embedding-004"
   ```
   Only `backend/app/core/config.py` should show matches.
2. **Execute Project Tests**: Run pytest to check that the test suite continues to pass:
   ```powershell
   pytest backend/tests
   ```
   This ensures that using settings defaults correctly matches mocked values.
