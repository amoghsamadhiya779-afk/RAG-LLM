FROM python:3.11-slim

# Non-root user for security
RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app

# Install deps first (layer-cached)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Hugging Face Spaces requires port 7860
EXPOSE 7860

USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "2"]
