from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.database import database, engine
from src.models import metadata
# 💡 1. 這裡補上 users，把個人資料的路由引入！
from src.routes import recipes, fridge, favorites, ingredients, auth, users

@asynccontextmanager
async def lifespan(app: FastAPI):
    metadata.create_all(engine)
    await database.connect()
    # ensure a default test user exists to satisfy FK constraints in tests
    # 💡 為了避免跟上面的路由 users 撞名，這裡幫模型取個小名 db_users
    from src.models import users as db_users
    existing = await database.fetch_one(db_users.select().where(db_users.c.user_id == "001"))
    if not existing:
        await database.execute(db_users.insert().values(user_id="001", username="tester"))
    yield
    await database.disconnect()


app = FastAPI(
    title="食譜管理 API",
    description="提供食譜查詢、冰箱管理、收藏功能的後端 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 💡 每個路由都只註冊一次，不會打架
app.include_router(recipes.router, prefix="/api/recipes", tags=["食譜"])
app.include_router(fridge.router, prefix="/api/fridge", tags=["冰箱"])
app.include_router(favorites.router, prefix="/api/favorites", tags=["收藏"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["食材"])
app.include_router(auth.router, prefix="/api/auth", tags=["身分驗證"])

# 🚀 2. 關鍵修復：把 users 註冊進來！這樣 404 就會消失了
app.include_router(users.router, prefix="/api/users", tags=["會員"])


@app.get("/", tags=["健康檢查"])
async def root():
    return {"message": "食譜 API 運作中", "docs": "/docs"}


@app.get("/health", tags=["健康檢查"])
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}