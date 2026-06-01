.PHONY: install test lint run dashboard demo

install:
	python -m pip install -e ".[dev]"

test:
	pytest

lint:
	ruff check src tests

run:
	uvicorn resume_rag.api:app --reload

dashboard:
	streamlit run streamlit_app.py

demo:
	python scripts/demo.py
