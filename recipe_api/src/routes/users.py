from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
import sqlalchemy as sa
from src.database import database
from src.models import users # 💡 請確保妳的 models.py 裡面有 users 這個資料表

router = APIRouter()

# 接收前端傳來的新程度的結構
class SkillUpdate(BaseModel):
    skill_level: str

@router.get("/{user_id}", summary="取得使用者個人資料")
async def get_user_profile(user_id: str):
    # 假設妳的 users 表格裡有 user_id, username, password, skill_level 欄位
    query = sa.select(
        users.c.user_id, 
        users.c.username, 
        users.c.skill_level
        # 💡 資安防護：實務上絕對不要把資料庫的 password 用 API 傳回給前端！
    ).where(users.c.user_id == user_id)
    
    record = await database.fetch_one(query)
    
    if not record:
        raise HTTPException(status_code=404, detail="找不到該使用者")
        
    return dict(record)

@router.put("/{user_id}/skill", summary="修改使用者的廚藝程度")
async def update_user_skill(user_id: str, payload: SkillUpdate):
    try:
        query = (
            sa.update(users)
            .where(users.c.user_id == user_id)
            .values(skill_level=payload.skill_level)
        )
        await database.execute(query)
        return {"message": "廚藝程度更新成功", "status": "success"}
    except Exception as e:
        print(f"🚨 更新廚藝程度失敗: {str(e)}")
        raise HTTPException(status_code=500, detail="更新失敗")