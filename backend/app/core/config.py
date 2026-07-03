from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "jOBiON API"
    TESTING: bool = False
    
    # Supabase / DB
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str | None = None
    DATABASE_URL: str
    
    # AI
    GEMINI_API_KEY: str
    HF_TOKEN: str | None = None
    DAILY_AI_BUDGET: int = 200
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Job Sources
    ADZUNA_APP_ID: str
    ADZUNA_APP_KEY: str
    SERPER_API_KEY: str | None = None
    TAVILY_API_KEY: str | None = None
    
    # Infra / Utilities
    UPSTASH_REDIS_REST_URL: str
    UPSTASH_REDIS_REST_TOKEN: str
    RESEND_API_KEY: str
    TURNSTILE_SECRET_KEY: str
    SENTRY_DSN: str
    CRON_SECRET: str
    ADZUNA_API_URL: str = "https://api.adzuna.com/v1/api/jobs"
    SERPER_API_URL: str = "https://google.serper.dev/search"
    LANGSEARCH_API_URL: str = "https://api.langsearch.com/v1/rerank"
    TURNSTILE_API_URL: str = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    RESEND_API_URL: str = "https://api.resend.com/emails"
    
    # Security / CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174,https://rag-llm-iota.vercel.app"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
