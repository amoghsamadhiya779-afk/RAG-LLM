from sqlalchemy import select, cast, String
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import ARRAY
from app.db.models import Job
from app.db.schemas import JobFilters

stmt = select(Job)
filters = JobFilters(employment_type=['full-time'])
stmt = stmt.where(Job.tags.op('&&')(cast(filters.employment_type, ARRAY(String))))
compiled = stmt.compile(dialect=postgresql.dialect())
print(compiled.params)
for bindparam in compiled.binds.values():
    print(f"Bind: {bindparam.key}, Type: {bindparam.type}")