import json
import os
from pathlib import Path
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, Field
from functools import lru_cache


class Settings(BaseSettings):
    # Environment detection
    ENVIRONMENT: str = "development"
    
    # Audio processing settings
    chunk_duration: float = 5.0
    overlap_duration: float = 1.0
    model_size: str = 'tiny'
    sample_rate: int = 16000
    channels: int = 1
    sliding_window: int = 30
    sentiment_window: int = 10
    
    # Server configuration
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # API Keys
    SPEECHMATICS_API_KEY: Optional[str] = None
    LLM_PROVIDER: str = "openai"
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-4.1-mini"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 2000
    LLM_TIMEOUT: int = 120
    LLM_MAX_RETRIES: int = 3
    
    # Firebase Configuration
    FIREBASE_API_KEY: Optional[str] = None
    FIREBASE_AUTH_DOMAIN: str = "ilqaa-402a3.firebaseapp.com"
    FIREBASE_PROJECT_ID: str = "ilqaa-402a3"
    FIREBASE_STORAGE_BUCKET: str = "ilqaa-402a3.firebasestorage.app"
    FIREBASE_MESSAGING_SENDER_ID: Optional[str] = None
    FIREBASE_APP_ID: Optional[str] = None
    
    # Firebase Service Account (for backend verification)
    FIREBASE_PRIVATE_KEY: Optional[str] = None
    FIREBASE_CLIENT_EMAIL: Optional[str] = None
    
    # Security
    JWT_SECRET: str = "change-this-in-production"

    ALLOWED_USERS: Optional[str] = None

    @property
    def allowed_users_list(self) -> list:
        if not self.ALLOWED_USERS:
            return []

        # If already a list, normalize and return
        if isinstance(self.ALLOWED_USERS, list):
            return [email.strip().lower() for email in self.ALLOWED_USERS if isinstance(email, str) and email.strip()]

        # If it's a string, try JSON array first, then comma-separated
        if isinstance(self.ALLOWED_USERS, str):
            try:
                parsed = json.loads(self.ALLOWED_USERS)
                if isinstance(parsed, list):
                    return [email.strip().lower() for email in parsed if isinstance(email, str) and email.strip()]
            except Exception:
                # Fall through to comma-separated parsing
                pass

            return [email.strip().lower() for email in self.ALLOWED_USERS.split(",") if email.strip()]

        # Fallback: empty list
        return []
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Keep original `ALLOWED_USERS` type (str or list). Use `allowed_users_list`
        # property to get a normalized list (lowercased, stripped).
    
    # Computed properties
    @property
    def backend_url(self) -> str:
        if self.ENVIRONMENT == "production":
            prod_url = os.getenv("BACKEND_URL", "")
            if prod_url:
                return prod_url
            return f"https://{os.getenv('CLOUD_RUN_SERVICE_NAME', 'localhost')}.a.run.app"
        return f"http://{self.HOST}:{self.PORT}"
    
    @property
    def frontend_url(self) -> str:
        if self.ENVIRONMENT == "production":
            return "https://ilqaa-402a3.web.app"
        return "http://localhost:3000"
    
    @property
    def websocket_protocol(self) -> str:
        return "wss" if self.ENVIRONMENT == "production" else "ws"
    
    @property
    def websocket_url(self) -> str:
        base = self.backend_url.replace("http://", "ws://").replace("https://", "wss://")
        if self.ENVIRONMENT == "production" and not base.startswith("ws"):
            base = f"wss://{base.split('://')[-1]}"
        return base
    
    @property
    def allowed_origins(self) -> list:
        origins = [
            self.frontend_url,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            f"http://{self.HOST}:{self.PORT}",
            f"http://localhost:{self.PORT}",
        ]
        
        if self.ENVIRONMENT == "production":
            origins.extend([
                "https://ilqaa-402a3.web.app",
                "https://*.web.app",
                "https://*.firebaseapp.com",
            ])
        
        # Remove duplicates
        return list(set([o for o in origins if o]))
    
    @property
    def is_firebase_configured(self) -> bool:
        """Check if Firebase is properly configured"""
        return all([
            self.FIREBASE_API_KEY,
            self.FIREBASE_AUTH_DOMAIN,
            self.FIREBASE_PROJECT_ID,
            self.FIREBASE_PRIVATE_KEY,
            self.FIREBASE_CLIENT_EMAIL
        ])


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()