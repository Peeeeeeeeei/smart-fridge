from datetime import date, datetime
from typing import Optional

from src.models import user_ingredients, ingredients

# ❌ 這裡原本寫死的 USER_ID = "001" 已經被刪除了！

async def _get_ingredient_id(db, name: str) -> Optional[str]:
    """查詢食材 ID，資料庫食材為固定清單，不自動新增"""
    row = await db.fetch_one(ingredients.select().where(ingredients.c.name == name))
    return row["ingredient_id"] if row else None

# 👇 所有操作都加入了 user_id 參數
async def get_fridge(db, user_id: str) -> list:
    query = (
        user_ingredients.join(ingredients, user_ingredients.c.ingredient_id == ingredients.c.ingredient_id)
        .select()
        .where(user_ingredients.c.user_id == user_id)
        .order_by(user_ingredients.c.purchase_date.desc())
    )
    rows = await db.fetch_all(query)
    return [
        {
            "ingredient_id": r["ingredient_id"],
            "ingredient_name": r["name"],
            "category": r["category"],
            "amount": r["amount"],
            "unit": r["unit"],
            "expiration_date": r["expiration_date"],
            "purchase_date": r["purchase_date"],
            "storage_location": r["storage_location"],
        }
        for r in rows
    ]

async def add_item(db, user_id: str, ingredient_name: str, amount: float, unit: Optional[str],
                   expiration_date, storage_location: Optional[str]) -> dict:
    ing_id = await _get_ingredient_id(db, ingredient_name)
    if not ing_id:
        return {"error": f"找不到食材「{ingredient_name}」，請先確認食材名稱是否正確"}
    
    existing = await db.fetch_one(
        user_ingredients.select().where(
            (user_ingredients.c.user_id == user_id) & (user_ingredients.c.ingredient_id == ing_id)
        )
    )
    if existing:
        new_amount = (existing["amount"] or 0) + (amount or 1)
        await db.execute(
            user_ingredients.update()
            .where(
                (user_ingredients.c.user_id == user_id) &
                (user_ingredients.c.ingredient_id == ing_id)
            )
            .values(amount=new_amount)
        )
        return {"message": f"已更新 {ingredient_name} 數量為 {new_amount}", "action": "updated"}

    await db.execute(
        user_ingredients.insert().values(
            user_id=user_id,
            ingredient_id=ing_id,
            amount=amount or 1,
            unit=unit,
            expiration_date=expiration_date,
            storage_location=storage_location,
            purchase_date=date.today(),
        )
    )
    return {"message": f"已新增 {ingredient_name} 到冰箱", "ingredient_id": ing_id, "action": "created"}


async def batch_add(db, user_id: str, items: list) -> dict:
    results = []
    for item in items:
        result = await add_item(db, user_id, item.ingredient_name, item.amount, item.unit, item.expiration_date, item.storage_location)
        results.append({"name": item.ingredient_name, **result})
    return {"message": f"批次處理 {len(results)} 項食材", "results": results}


async def update_item(db, user_id: str, ingredient_id: str, amount: float, unit: Optional[str],
                      expiration_date, storage_location: Optional[str]) -> dict:
    existing = await db.fetch_one(
        user_ingredients.select().where(
            (user_ingredients.c.user_id == user_id) &
            (user_ingredients.c.ingredient_id == ingredient_id)
        )
    )
    if not existing:
        return None

    values = {"amount": amount}
    if unit is not None:
        values["unit"] = unit
    if expiration_date is not None:
        values["expiration_date"] = expiration_date
    if storage_location is not None:
        values["storage_location"] = storage_location

    await db.execute(
        user_ingredients.update()
        .where(
            (user_ingredients.c.user_id == user_id) &
            (user_ingredients.c.ingredient_id == ingredient_id)
        )
        .values(**values)
    )
    return {"message": "更新成功", "ingredient_id": ingredient_id, "amount": amount}


async def remove_item(db, user_id: str, ingredient_id: str) -> bool:
    existing = await db.fetch_one(
        user_ingredients.select().where(
            (user_ingredients.c.user_id == user_id) &
            (user_ingredients.c.ingredient_id == ingredient_id)
        )
    )
    if not existing:
        return False
    await db.execute(
        user_ingredients.delete().where(
            (user_ingredients.c.user_id == user_id) &
            (user_ingredients.c.ingredient_id == ingredient_id)
        )
    )
    return True


async def clear_fridge(db, user_id: str) -> dict:
    await db.execute(user_ingredients.delete().where(user_ingredients.c.user_id == user_id))
    return {"message": "冰箱已清空"}