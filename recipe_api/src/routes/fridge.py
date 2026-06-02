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
    # 💡 【終極智慧解法】：把前端傳來的中文字，去資料庫換成「真實代號」
    # 我們拿前端當誘餌傳來的名稱來搜尋
    search_name = getattr(item, 'ingredient_name', None) or getattr(item, 'ingredient_id', '')
    
    # 去 ingredients 表格中尋找這個中文字對應的代號
    query_id = sa.select(ingredients.c.ingredient_id).where(ingredients.c.name == search_name)
    record = await database.fetch_one(query_id)
    
    # 如果資料庫裡沒有這個食材，溫馨提醒使用者
    if not record:
        raise HTTPException(status_code=400, detail=f"系統字典中找不到食材：「{search_name}」，請確認是否打錯字囉！")
        
    real_ing_id = record["ingredient_id"]
    
    try:
        query = sa.insert(user_ingredients).values(
            user_id=user_id,
            ingredient_id=real_ing_id,
            amount=item.amount,
            unit=item.unit,
            storage_location=item.storage_location,
            expiration_date=item.expiration_date
        )
        await database.execute(query)
        return {"message": f"{search_name} 新增成功", "status": "success"}
    except Exception as e:
        print(f"🚨 寫入資料庫失敗: {str(e)}")
        # 因為 MySQL 有設定不可重複加入相同食材，如果是這個錯誤，我們就提醒他
        raise HTTPException(status_code=400, detail=f"新增失敗！您的冰箱裡可能已經有「{search_name}」囉，請直接修改數量即可！")


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