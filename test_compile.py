from sqlalchemy import select, cast, String
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import ARRAY
from app.db.models import Job, JobTypeEnum
from app.db.schemas import JobFilters

stmt = select(Job)
filters = JobFilters(employment_type=[JobTypeEnum.full_time])

# This is what's currently in jobs_repo.py:
stmt = stmt.where(Job.tags.op('&&')(cast(filters.employment_type, ARRAY(String))))

print(stmt.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}))