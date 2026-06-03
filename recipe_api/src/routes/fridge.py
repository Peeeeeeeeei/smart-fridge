from fastapi import APIRouter, HTTPException, Query
import sqlalchemy as sa
import uuid # 🚀 引入 uuid 模組，用來幫新食材自動產生代號

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
        # 🚀 關鍵修改：加上排序功能，即將過期排前面，沒設定日期的排最後面
        .order_by(
            user_ingredients.c.expiration_date.is_(None), # 1. 讓 NULL(沒日期) 的項目沉到最下面
            user_ingredients.c.expiration_date.asc()      # 2. 剩下的依照日期「由近到遠」升冪排序
        )
    )
    rows = await database.fetch_all(query)
    return [dict(r) for r in rows]


@router.post("/", summary="新增食材到冰箱", status_code=201)
async def add_to_fridge(
    item: FridgeItemIn,
    user_id: str = Query(..., description="目前登入的使用者ID")
):
    # 💡 拿前端當誘餌傳來的名稱來搜尋
    search_name = getattr(item, 'ingredient_name', None) or getattr(item, 'ingredient_id', '')
    
    # 1. 先去 ingredients 表格中尋找這個中文字對應的代號
    query_id = sa.select(ingredients.c.ingredient_id).where(ingredients.c.name == search_name)
    record = await database.fetch_one(query_id)
    
    # 2. 🚀 【自動新增 (Upsert) 核心邏輯】
    if not record:
        # 如果字典裡沒有，我們就幫它創造一個新的 ID！
        # 產生一個以 "U" 開頭的隨機 5 碼 ID (例如: U9a2b)，避免與原本爬蟲的數字 ID 衝突
        new_ing_id = f"U{uuid.uuid4().hex[:4]}" 
        
        try:
            # 悄悄把新食材寫入系統的 ingredients 字典中
            insert_dict_query = sa.insert(ingredients).values(
                ingredient_id=new_ing_id,
                name=search_name,
                category="使用者自訂" # 給它一個預設分類
            )
            await database.execute(insert_dict_query)
            
            # 將真正要寫入冰箱的 ID 設為剛剛新產生的 ID
            real_ing_id = new_ing_id
            print(f"✨ 系統已自動學習新食材：「{search_name}」，代號為：{real_ing_id}")
            
        except Exception as e:
            print(f"🚨 自動擴充字典失敗: {str(e)}")
            raise HTTPException(status_code=500, detail="自動學習新食材時發生錯誤，請稍後再試！")
    else:
        # 如果字典裡有，就乖乖用字典裡的代號
        real_ing_id = record["ingredient_id"]
    
    # 3. 寫入使用者的專屬冰箱
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