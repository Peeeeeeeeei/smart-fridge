from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlalchemy as sa
from src.database import database

# 💡 依照妳們專案的設計，從 models 或是 tables 引入 users 表格
try:
    from src.models import users
except ImportError:
    from src.tables import users

router = APIRouter()

# 接收前端傳來的新程度的結構
class SkillUpdate(BaseModel):
    skill_level: str

@router.get("/{user_id}", summary="取得使用者個人資料")
async def get_user_profile(user_id: str):
    # 🚀 關鍵修復：把資料庫的 cooking_level 拿出來，並幫它貼上 skill_level 的標籤騙過前端
    query = sa.select(
        users.c.user_id, 
        users.c.username, 
        users.c.cooking_level.label("skill_level") 
    ).where(users.c.user_id == user_id)
    
    record = await database.fetch_one(query)
    
    if not record:
        raise HTTPException(status_code=404, detail="找不到該使用者")
        
    return dict(record)

@router.put("/{user_id}/skill", summary="修改使用者的廚藝程度")
async def update_user_skill(user_id: str, payload: SkillUpdate):
    try:
        # 🚀 關鍵修復：將前端傳來的 skill_level，存進資料庫正確的 cooking_level 欄位
        query = (
            sa.update(users)
            .where(users.c.user_id == user_id)
            .values(cooking_level=payload.skill_level)
        )
        await database.execute(query)
        return {"message": "廚藝程度更新成功", "status": "success"}
    except Exception as e:
        print(f"🚨 更新廚藝程度失敗: {str(e)}")
        raise HTTPException(status_code=500, detail="更新失敗")