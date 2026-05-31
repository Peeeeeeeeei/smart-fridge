from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from src.database import database
from src.services import recipe_service

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
    return await recipe_service.get_home_recipes(database, limit=limit, user_id=user_id)


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