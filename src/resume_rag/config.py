from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    app_name: str = "Resume RAG Command Center"
    environment: str = "local"
    data_dir: Path = Field(default=Path("data"))
    index_path: Path = Field(default=Path("data/index/vector_store.json"))
    embedding_provider: Literal["local", "openai", "gemini"] = "gemini"
    llm_provider: Literal["local", "openai", "gemini"] = "gemini"
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    openai_embedding_model: str = "text-embedding-3-small"
    openai_chat_model: str = "gpt-4.1-mini"
    chunk_size: int = 900
    chunk_overlap: int = 150
    top_k: int = 5
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="RESUME_RAG_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
