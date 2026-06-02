import databases
import sqlalchemy

# 🚀 把 76b2 後面的字母改成 a ！！！
SYNC_DB_URL = "mysql+pymysql://avnadmin:AVNS_0VdpgfC676hdRVeecM3@mysql-2c8679e9-p39757323-76b2.a.aivencloud.com:10217/recipe_db"
ASYNC_DB_URL = "mysql+aiomysql://avnadmin:AVNS_0VdpgfC676hdRVeecM3@mysql-2c8679e9-p39757323-76b2.a.aivencloud.com:10217/recipe_db"

database = databases.Database(ASYNC_DB_URL)

engine = sqlalchemy.create_engine(
    SYNC_DB_URL,
    connect_args={}
)