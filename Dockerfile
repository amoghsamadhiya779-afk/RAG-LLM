FROM python:3.11-slim

WORKDIR /app

# Create a non-root user (Hugging Face requirement for some spaces, good practice regardless)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

COPY --chown=user pyproject.toml README.md ./
COPY --chown=user src ./src

ENV PYTHONPATH=/app/src

RUN pip install --user --no-cache-dir .

# Hugging Face Spaces exposes port 7860 by default for Docker containers
EXPOSE 7860

CMD ["uvicorn", "resume_rag.api:app", "--host", "0.0.0.0", "--port", "7860"]
