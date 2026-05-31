from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.database import database
import sqlalchemy as sa
from src.models import users 
import random
import string # ✅ 修復了這裡的縮排錯誤

router = APIRouter()

# 接收前端登入的資料格式
class LoginRequest(BaseModel):
    email: str
    password: str

# 接收前端註冊的資料格式
class RegisterRequest(BaseModel):
    email: str
    password: str
    username: str # 初次註冊時輸入的暱稱
    cooking_level: str

@router.post("/register", summary="使用者註冊")
async def register(request: RegisterRequest):
    # 1. 檢查信箱是否已經被註冊過
    check_query = sa.select(users).where(users.c.email == request.email)
    existing_user = await database.fetch_one(check_query)
    if existing_user:
        raise HTTPException(status_code=400, detail="這個信箱已經註冊過囉！")
    
    # 2. 生成一個不重複的隨機 3 碼 user_id
    while True:
        new_user_id = "".join(random.choices(string.digits, k=3))
        id_check_query = sa.select(users).where(users.c.user_id == new_user_id)
        id_exists = await database.fetch_one(id_check_query)
        if not id_exists:
            break
    
    # 3. 寫入資料庫 (💡 這裡要把原本寫死的 "新手"，改成 request 傳來的)
    insert_query = users.insert().values(
        user_id=new_user_id,
        email=request.email,
        password=request.password,
        username=request.username,
        cooking_level=request.cooking_level # 👈 改成這行！
    )
    await database.execute(insert_query)
    
    return {"message": "註冊成功！請重新登入"}

@router.post("/login", summary="使用者登入")
async def login(request: LoginRequest):
    # 1. 用 email 尋找使用者
    query = sa.select(users).where(users.c.email == request.email)
    user = await database.fetch_one(query)
    
    # 2. 檢查帳號是否存在，以及密碼是否正確
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="信箱或密碼錯誤")
    
    # 3. 登入成功，回傳真實資料
    return {
        "message": "登入成功",
        "user": {
            "user_id": user["user_id"],
            "username": user["username"],
            "cooking_level": user["cooking_level"]
        }
    }