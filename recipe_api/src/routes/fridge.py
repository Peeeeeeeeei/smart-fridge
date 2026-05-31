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
    user_id: str = Query(..., description="目前登入的使用者ID") # 💡 加上這行擷取身分
):
    # 💡 傳遞給 service
    return await fridge_service.add_item(
        database, user_id, item.ingredient_name, item.amount,
        item.unit, item.expiration_date, item.storage_location
    )


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
    result = await fridge_service.update_item(
        database, user_id, ingredient_id, update.amount,
        update.unit, update.expiration_date, update.storage_location
    )
    if not result:
        raise HTTPException(status_code=404, detail="冰箱中找不到此食材")
    return result


@router.delete("/{ingredient_id}", summary="從冰箱移除食材")
async def remove_item(
    ingredient_id: str,
    user_id: str = Query(..., description="目前登入的使用者ID")
):
    success = await fridge_service.remove_item(database, user_id, ingredient_id)
    if not success:
        raise HTTPException(status_code=404, detail="冰箱中找不到此食材")
    return {"message": "已移除食材", "ingredient_id": ingredient_id}


@router.delete("/", summary="一鍵清空專屬冰箱")
async def clear_fridge(user_id: str = Query(...)):
    return await fridge_service.clear_fridge(database, user_id)