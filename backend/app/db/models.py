import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import List, Optional, Any

from sqlalchemy import String, Boolean, Integer, Float, ForeignKey, DateTime, Enum, JSON, Uuid, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.db.base import Base

class RoleEnum(str, PyEnum):
    seeker = "seeker"
    recruiter = "recruiter"
    admin = "admin"

class JobStatusEnum(str, PyEnum):
    pending = "pending"
    live = "live"
    closed = "closed"

class JobTypeEnum(str, PyEnum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    internship = "internship"

class JobLevelEnum(str, PyEnum):
    intern = "intern"
    junior = "junior"
    mid = "mid"
    senior = "senior"
    staff = "staff"
    principal = "principal"

class ApplicationStageEnum(str, PyEnum):
    applied = "applied"
    reviewing = "reviewing"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"
    withdrawn = "withdrawn"

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    profile: Mapped["Profile"] = relationship("Profile", back_populates="user", uselist=False)

class Profile(Base):
    __tablename__ = "profiles"
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), primary_key=True)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    headline: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    @property
    def id(self):
        return self.user_id

    user: Mapped["User"] = relationship("User", back_populates="profile")

class Company(Base):
    __tablename__ = "companies"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    website: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    about: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    size: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    source: Mapped[str] = mapped_column(String, nullable=False)
    external_id: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    company: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    remote: Mapped[bool] = mapped_column(Boolean, default=False)
    seniority: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tags: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    salary_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    salary_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description_html: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    apply_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    posted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    embedding = mapped_column(Vector(768), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Application(Base):
    __tablename__ = "applications"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("jobs.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    resume_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("resumes.id"), nullable=True)
    cover_note: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    stage: Mapped[ApplicationStageEnum] = mapped_column(Enum(ApplicationStageEnum), default=ApplicationStageEnum.applied)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Resume(Base):
    __tablename__ = "resumes"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), nullable=False)
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    storage_path: Mapped[str] = mapped_column(String, nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    parsed: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # embedding
    embedding = mapped_column(Vector(768), nullable=True)

class SavedJob(Base):
    __tablename__ = "saved_jobs"
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), primary_key=True)
    job_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("jobs.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String, nullable=False)
    entity_type: Mapped[str] = mapped_column(String, nullable=False)
    entity_id: Mapped[str] = mapped_column(String, nullable=False)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
