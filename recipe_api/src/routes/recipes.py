from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from src.database import database
from src.services import recipe_service

import sqlalchemy as sa

router = APIRouter()

@router.get("/", summary="查看全部食譜")
async def list_recipes(
    page: int = Query(1, ge=1),
    # 🚀 這裡就是解開封印的關鍵：把 le=100 改成 le=1000
    page_size: int = Query(20, ge=1, le=1000), 
):
    import sqlalchemy as sa
    from src.models import recipes, recipe_label, recipe_cook_methods
    
    offset = (page - 1) * page_size
    
    stmt = (
        sa.select(
            recipes,
            sa.func.group_concat(sa.distinct(recipe_label.c.label)).label("labels"),
            sa.func.group_concat(sa.distinct(recipe_cook_methods.c.cook_methods)).label("cook_methods"),
        )
        .select_from(
            recipes
            .outerjoin(recipe_label, recipes.c.recipe_id == recipe_label.c.recipe_id)
            .outerjoin(recipe_cook_methods, recipes.c.recipe_id == recipe_cook_methods.c.recipe_id)
        )
        .group_by(recipes.c.recipe_id)
        .order_by(recipes.c.recipe_id.asc())
        .limit(page_size)
        .offset(offset)
    )

    rows = await database.fetch_all(stmt)
    
    return {
        "page": page, 
        "page_size": page_size, 
        "results": [dict(r) for r in rows]
    }


@router.get("/home", summary="首頁推薦與熱門食譜")
async def home_recipes(
    user_id: Optional[str] = Query(None, description="使用者的 ID"),
    limit: int = Query(10, ge=1, le=50)
):
    import sqlalchemy as sa
    from src.models import recipes, recipe_label, recipe_cook_methods

    # 1. 取得原本 service 算出來的推薦結果 (根據冰箱食材)
    result = await recipe_service.get_home_recipes(database, limit=limit, user_id=user_id)

    # 2. 自動判斷回傳格式，抓出推薦食譜的陣列
    target_list = None
    is_dict = False
    dict_key = None

    if isinstance(result, list):
        target_list = result
    elif isinstance(result, dict):
        is_dict = True
        for key in ["recommend_recipes", "recommendations", "recipes", "data"]:
            if key in result and isinstance(result[key], list):
                target_list = result[key]
                dict_key = key
                break

    # 3. 🚀【修改一核心】：如果不滿 limit (10個)，去資料庫隨機抓來湊滿！
    if target_list is not None:
        current_count = len(target_list)
        if current_count < limit:
            shortage = limit - current_count
            # 收集已經推薦的食譜 ID，避免隨機抓到重複的
            existing_ids = [r.get("recipe_id") for r in target_list if isinstance(r, dict) and "recipe_id" in r]

            # 建立隨機抓取 Query (確保包含 labels 和 cook_methods，讓前端不會報錯)
            stmt = (
                sa.select(
                    recipes,
                    sa.func.group_concat(sa.distinct(recipe_label.c.label)).label("labels"),
                    sa.func.group_concat(sa.distinct(recipe_cook_methods.c.cook_methods)).label("cook_methods"),
                )
                .select_from(
                    recipes
                    .outerjoin(recipe_label, recipes.c.recipe_id == recipe_label.c.recipe_id)
                    .outerjoin(recipe_cook_methods, recipes.c.recipe_id == recipe_cook_methods.c.recipe_id)
                )
                .group_by(recipes.c.recipe_id)
            )

            # 排除已經在清單裡的食譜
            if existing_ids:
                stmt = stmt.where(sa.not_(recipes.c.recipe_id.in_(existing_ids)))

            # MySQL 的隨機排序，並限制抓取不足的數量
            stmt = stmt.order_by(sa.func.rand()).limit(shortage)

            random_rows = await database.fetch_all(stmt)
            random_recipes = [dict(r) for r in random_rows]

            # 把隨機抓到的補進原本的清單裡
            target_list.extend(random_recipes)

            if is_dict and dict_key:
                result[dict_key] = target_list
                return result
            return target_list

    return result


@router.get("/search", summary="食譜名稱關鍵字搜尋")
async def search_recipes(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    return await recipe_service.search_recipes(database, q, page, page_size)


@router.get("/advanced", summary="食譜進階篩選與排序")
async def advanced_filter(
    keyword: Optional[str] = Query(None),
    label: Optional[str] = Query(None, description="標籤，如：湯品與鍋物、肉類料理"),
    difficulty: Optional[str] = Query(None, description="易 / 中 / 難"),
    max_time: Optional[int] = Query(None, description="最長烹飪時間（分鐘）"),
    is_vegetarian: Optional[bool] = Query(None, description="true=素食"),
    sort_by: str = Query("recipe_id", description="cook_time / servings / title"),
    order: str = Query("asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    return await recipe_service.advanced_filter(
        database, keyword, label, difficulty, max_time,
        is_vegetarian, sort_by, order, page, page_size
    )


@router.get("/by-ingredients", summary="輸入食材查詢食譜")
async def recipes_by_ingredients(
    ingredient_names: str = Query(..., description="逗號分隔，如：雞蛋,番茄"),
    match_all: bool = Query(False),
):
    names = [n.strip() for n in ingredient_names.split(",") if n.strip()]
    return await recipe_service.get_recipes_by_ingredients(database, names, match_all)


@router.get("/{recipe_id}", summary="取得單一食譜詳細資訊")
async def get_recipe(
    recipe_id: str,
    # 🚀 加上這行，接收查詢參數中的 user_id
    user_id: Optional[str] = Query(None, description="目前登入的使用者ID")
):
    # 🚀 將 user_id 傳遞給 service
    result = await recipe_service.get_recipe_detail(database, recipe_id, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="食譜不存在")
    return result