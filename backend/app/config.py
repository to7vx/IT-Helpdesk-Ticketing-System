from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/helpdesk_db"
    SECRET_KEY: str = "changeme-super-secret-key-replace-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    @model_validator(mode="before")
    @classmethod
    def strip_bom_from_strings(cls, data: dict) -> dict:
        return {
            k: v.lstrip("﻿").strip() if isinstance(v, str) else v
            for k, v in data.items()
        }

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8-sig"


settings = Settings()