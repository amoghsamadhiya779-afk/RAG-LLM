from sqlalchemy import select
from sqlalchemy.dialects import postgresql
from app.db.models import Job
from app.db.schemas import JobFilters

stmt = select(Job)
filters = JobFilters(employment_type=['full-time'])
stmt = stmt.where(Job.tags.overlap(filters.employment_type))

print(stmt.compile(dialect=postgresql.dialect()))