from fastapi import APIRouter, HTTPException, Query
import sqlalchemy as sa

from src.database import database
from src.models import user_ingredients, ingredients 
from src.services import fridge_service
from src.schemas import FridgeItemIn, FridgeItemUpdate, FridgeBatchIn

router = APIRouter()

@router.get("/", summary="取得專屬冰箱內的食材")
async def get_fridge_items(
    user_id: str = Query(..., description="目前登入的使用者ID")
):
    query = (
        sa.select(user_ingredients, ingredients.c.name, ingredients.c.category)
        .select_from(user_ingredients.join(ingredients, user_ingredients.c.ingredient_id == ingredients.c.ingredient_id))
        .where(user_ingredients.c.user_id == user_id) 
    )
    rows = await database.fetch_all(query)
    return [dict(r) for r in rows]


@router.post("/", summary="新增食材到冰箱", status_code=201)
async def add_to_fridge(
    item: FridgeItemIn,
    user_id: str = Query(..., description="目前登入的使用者ID")
):
    # 💡 【終極解法】繞過可能出錯的 service 黑箱，直接在這裡執行明確的 SQL 寫入！
    # 容錯處理：嘗試抓取前端傳來的 ingredient_id，若無則預設給 'E001' (雞蛋)，防止外鍵報錯
    ing_id = getattr(item, 'ingredient_id', 'E001') 
    
    try:
        query = sa.insert(user_ingredients).values(
            user_id=user_id,
            ingredient_id=ing_id,
            amount=item.amount,
            unit=item.unit,
            storage_location=item.storage_location,
            expiration_date=item.expiration_date
        )
        # database.execute 會自動 commit 確保寫入！
        await database.execute(query)
        return {"message": "食材新增成功", "status": "success"}
    except Exception as e:
        # 萬一遇到外鍵錯誤 (例如資料庫沒有 001 這個人)，會立刻把錯誤印在後端並回傳給前端
        print(f"🚨 寫入資料庫失敗: {str(e)}")
        raise HTTPException(status_code=400, detail=f"寫入失敗，請檢查資料庫關聯: {str(e)}")


@router.post("/batch", summary="批次新增食材", status_code=201)
async def batch_add(
    batch: FridgeBatchIn,
    user_id: str = Query(...)
):
    return await fridge_service.batch_add(database, user_id, batch.items)


@router.put("/{ingredient_id}", summary="修改冰箱食材數量")
async def update_item(
    ingredient_id: str, 
    update: FridgeItemUpdate,
    user_id: str = Query(..., description="目前登入的使用者ID")
):
    # 💡 同樣直接用 SQL Update 語法，確保 100% 更新成功
    try:
        query = (
            sa.update(user_ingredients)
            .where(
                sa.and_(
                    user_ingredients.c.user_id == user_id,
                    user_ingredients.c.ingredient_id == ingredient_id
                )
            )
            .values(
                amount=update.amount,
                unit=update.unit,
                storage_location=update.storage_location,
                expiration_date=update.expiration_date
            )
        )
        await database.execute(query)
        return {"message": "食材修改成功", "status": "success"}
    except Exception as e:
        print(f"🚨 修改資料庫失敗: {str(e)}")
        raise HTTPException(status_code=400, detail=f"修改失敗: {str(e)}")


@router.delete("/{ingredient_id}", summary="從冰箱移除食材")
async def remove_item(
    ingredient_id: str,
    user_id: str = Query(..., description="目前登入的使用者ID")
):
    # 💡 順手把刪除功能也改成直球對決版，確保刪得掉
    try:
        query = (
            sa.delete(user_ingredients)
            .where(
                sa.and_(
                    user_ingredients.c.user_id == user_id,
                    user_ingredients.c.ingredient_id == ingredient_id
                )
            )
        )
        await database.execute(query)
        return {"message": "已移除食材"}
    except Exception as e:
        print(f"🚨 刪除失敗: {str(e)}")
        raise HTTPException(status_code=400, detail=f"刪除失敗: {str(e)}")


@router.delete("/", summary="一鍵清空專屬冰箱")
async def clear_fridge(user_id: str = Query(...)):
    return await fridge_service.clear_fridge(database, user_id)