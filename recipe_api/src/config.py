from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # 這裡留著原本的預設值沒關係
    DATABASE_URL: str = "mysql+aiomysql://avnadmin:YOUR_PASSWORD_HERE@mysql-2c8679e9-p39757323-76b2.l.aivencloud.com:10217/recipe_db"
    APP_ENV: str = "development"
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# 🚀 終極護身符大絕招：
# 不管 Render 環境變數怎麼設，也不管有沒有 .env 檔案，
# 強制將資料庫連線網址設定為這串「小寫 l + 真實密碼」的完美網址！
settings.DATABASE_URL = "mysql+aiomysql://avnadmin:AVNS_0VdpgfC676hdRVeecM3@mysql-2c8679e9-p39757323-76b2.l.aivencloud.com:10217/recipe_db"