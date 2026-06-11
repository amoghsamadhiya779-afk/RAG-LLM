FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt README.md ./
COPY src ./src

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 7860

CMD ["uvicorn", "resume_rag.api:app", "--host", "0.0.0.0", "--port", "7860"]
