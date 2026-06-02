import databases
import sqlalchemy

# 🚀 終極核彈版：已經把空房間 defaultdb 換成真正有 300 多道食譜的 recipe_db 囉！
SYNC_DB_URL = "mysql+pymysql://avnadmin:AVNS_0VdpgfC676hdRVeecM3@mysql-2c8679e9-p39757323-76b2.l.aivencloud.com:10217/recipe_db"
ASYNC_DB_URL = "mysql+aiomysql://avnadmin:AVNS_0VdpgfC676hdRVeecM3@mysql-2c8679e9-p39757323-76b2.l.aivencloud.com:10217/recipe_db"

database = databases.Database(ASYNC_DB_URL)

engine = sqlalchemy.create_engine(
    SYNC_DB_URL,
    connect_args={}
)