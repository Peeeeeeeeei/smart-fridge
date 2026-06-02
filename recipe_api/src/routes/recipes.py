from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import sqlalchemy as sa

from src.database import database
from src.services import recipe_service
from src.schemas import FridgeItemIn, FridgeItemUpdate, FridgeBatchIn

router = APIRouter()

@router.get("/", summary="查看全部食譜")
async def list_recipes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000), 
):
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
    from src.models import recipes, recipe_label, recipe_cook_methods

    result = await recipe_service.get_home_recipes(database, limit=limit, user_id=user_id)

    target_list = None
    is_dict = False
    dict_key = None

    if isinstance(result, list):
        target_list = result
    elif isinstance(result, dict):
        is_dict = True
        for key in ["recommend_recipes", "recommendations", "recipes", "data", "recommended"]:
            if key in result and isinstance(result[key], list):
                target_list = result[key]
                dict_key = key
                break

    if target_list is not None:
        current_count = len(target_list)
        if current_count < limit:
            shortage = limit - current_count
            existing_ids = [r.get("recipe_id") for r in target_list if isinstance(r, dict) and "recipe_id" in r]

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

            if existing_ids:
                stmt = stmt.where(sa.not_(recipes.c.recipe_id.in_(existing_ids)))

            stmt = stmt.order_by(sa.func.rand()).limit(shortage)
            random_rows = await database.fetch_all(stmt)
            random_recipes = [dict(r) for r in random_rows]
            target_list.extend(random_recipes)

            if is_dict and dict_key:
                result[dict_key] = target_list
                return result
            return target_list

    return result


@router.get("/search", summary="食譜名稱關鍵字搜尋")
async def search_recipes(
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(1000, ge=1, le=1000), 
):
    from src.models import recipes, recipe_label, recipe_cook_methods
    
    # 如果沒給關鍵字，就回傳全部食譜
    if not q or q.strip() == "":
        return await list_recipes(page, page_size)
    
    search_term = f"%{q}%"
    
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
        .where(
            # 💡 終極安全修復：拿掉容易出錯的 or_，只搜尋 title 食譜名稱！
            recipes.c.title.like(search_term)
        )
        .group_by(recipes.c.recipe_id)
        .order_by(recipes.c.recipe_id.asc()) # 🚀 加上排序，防止分頁崩潰
        .limit(page_size)
        .offset((page - 1) * page_size)
    )
    
    rows = await database.fetch_all(stmt)
    return {"results": [dict(r) for r in rows]}


@router.get("/advanced", summary="食譜進階篩選與排序")
async def advanced_filter(
    keyword: Optional[str] = Query(None),
    label: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    max_time: Optional[int] = Query(None),
    is_vegetarian: Optional[bool] = Query(None),
    sort_by: str = Query("recipe_id"),
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
    user_id: Optional[str] = Query(None)
):
    result = await recipe_service.get_recipe_detail(database, recipe_id, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="食譜不存在")
    return result