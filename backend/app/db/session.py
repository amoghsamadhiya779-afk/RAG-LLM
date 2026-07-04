from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import event
import logging

logger = logging.getLogger("sqlalchemy.pool")
logger.setLevel(logging.INFO)

from app.core.config import settings

engine = create_async_engine(
    settings.async_database_url, 
    echo=False,
    pool_size=5,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_timeout=30,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0
    }
)

@event.listens_for(engine.sync_engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    print(f"[POOL] Checked OUT connection: {id(dbapi_connection)}")

@event.listens_for(engine.sync_engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    print(f"[POOL] Checked IN connection: {id(dbapi_connection)}")

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
