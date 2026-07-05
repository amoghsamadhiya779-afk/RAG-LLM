from sqlalchemy import select, cast, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from app.db.models import Job
from app.db.schemas import JobFilters

stmt = select(Job)
filters = JobFilters(employment_type=['full-time'])

# Using overlap with cast to Text[]
stmt = stmt.where(Job.tags.overlap(cast(filters.employment_type, PG_ARRAY(Text))))

print(stmt.compile(dialect=postgresql.dialect()))