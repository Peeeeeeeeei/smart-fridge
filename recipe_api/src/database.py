import databases
import sqlalchemy

# 🚀 終極核彈版：正確的小寫 l + 預設資料庫 defaultdb
SYNC_DB_URL = "mysql+pymysql://avnadmin:AVNS_0VdpgfC676hdRVeecM3@mysql-2c8679e9-p39757323-76b2.l.aivencloud.com:10217/defaultdb"
ASYNC_DB_URL = "mysql+aiomysql://avnadmin:AVNS_0VdpgfC676hdRVeecM3@mysql-2c8679e9-p39757323-76b2.l.aivencloud.com:10217/defaultdb"

database = databases.Database(ASYNC_DB_URL)

engine = sqlalchemy.create_engine(
    SYNC_DB_URL,
    connect_args={}
)