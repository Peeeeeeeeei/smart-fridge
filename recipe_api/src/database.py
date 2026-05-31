import databases
import sqlalchemy
from src.config import settings

# 🚀 給 databases 用的非同步連線 (維持原樣)
database = databases.Database(settings.DATABASE_URL)

# 💡 破案關鍵：將 +aiomysql 替換成 +pymysql，讓 sqlalchemy 可以使用同步引擎建立資料表
sync_db_url = settings.DATABASE_URL.replace("+aiomysql", "+pymysql")

engine = sqlalchemy.create_engine(
    sync_db_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)