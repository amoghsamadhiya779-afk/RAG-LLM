import sys
import sqlalchemy
from sqlalchemy import select, cast, String
from sqlalchemy.dialects.postgresql import ARRAY, array
from app.db.models import Job

try:
    stmt1 = select(Job).where(Job.tags.op('&&')(cast(['full-time'], ARRAY(String))))
    print('cast works:', str(stmt1.compile(dialect=sqlalchemy.dialects.postgresql.dialect())))
except Exception as e:
    print('cast failed:', repr(e))

try:
    stmt2 = select(Job).where(Job.tags.op('&&')(array(['full-time'])))
    print('array works:', str(stmt2.compile(dialect=sqlalchemy.dialects.postgresql.dialect())))
except Exception as e:
    print('array failed:', repr(e))