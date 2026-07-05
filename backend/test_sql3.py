import asyncio
from sqlalchemy import select, cast, String, ARRAY
from sqlalchemy.dialects import postgresql
from app.db.models import Job
from app.db.schemas import JobSearchFilters

stmt = select(Job)
filters = JobSearchFilters(employment_type=['full-time'])

# The code in jobs_repo.py:
stmt = stmt.where(Job.tags.op('&&')(cast(filters.employment_type, ARRAY(String))))

print(stmt.compile(dialect=postgresql.dialect()))