FROM python:3.11-slim

# Create a non-root user
RUN useradd -m -u 1000 user
RUN mkdir -p /app && chown user:user /app

USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

COPY --chown=user backend/requirements.txt ./
RUN pip install --user --no-cache-dir -r requirements.txt

COPY --chown=user backend/app ./app

ENV PYTHONPATH=/app

# Hugging Face Spaces exposes port 7860 by default for Docker containers
EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
