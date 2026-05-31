from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    
    DATABASE_URL: str= "mysql+aiomysql://avnadmin:YOUR_PASSWORD_HERE@mysql-2c8679e9-p39757323-76b2.l.aivencloud.com:10217/recipe_db"
    APP_ENV: str = "development"
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
