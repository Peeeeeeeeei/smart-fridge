import json
import sqlalchemy as sa
from typing import Optional
from collections import Counter

# 🚀 1. 記得在這裡引入 users 資料表！
from src.models import recipes, recipe_ingredients, ingredients, user_recipes, recipe_label, recipe_cook_methods, users

# (原本寫死的 USER_ID = "001" 建議可以直接刪除，避免未來不小心用到)

async def get_home_recipes(db, limit: int = 10, user_id: str = None) -> dict:
    recommended = []
    preferred_difficulty = "" # 預設值

    if user_id:
        # 1. 先去資料庫看這個人的烹飪等級
        user_info = await db.fetch_one(users.select().where(users.c.user_id == user_id))
        if user_info and user_info["cooking_level"]:
            level_map = {"新手": "易", "一般": "中", "熟練": "難"}
            preferred_difficulty = level_map.get(user_info["cooking_level"], "")

        # 2. 冰箱食材比對 (有食材的情況)
        query = """
            SELECT r.*, 
                   COUNT(ri.ingredient_id) as match_count,
                   (CASE WHEN r.difficulty = :preferred_difficulty THEN 1 ELSE 0 END) as difficulty_bonus
            FROM recipes r
            JOIN recipe_ingredients ri ON r.recipe_id = ri.recipe_id
            JOIN user_ingredients ui ON ri.ingredient_id = ui.ingredient_id
            WHERE ui.user_id = :user_id
            GROUP BY r.recipe_id
            ORDER BY match_count DESC, difficulty_bonus DESC, r.recipe_id DESC
            LIMIT :limit
        """
        try:
            recommended = await db.fetch_all(
                query=query, 
                values={
                    "user_id": user_id, 
                    "limit": limit, 
                    "preferred_difficulty": preferred_difficulty
                }
            )
        except Exception as e:
            print("⚠️ 匹配食譜發生錯誤:", e)

    # 🚀 3. 修復防呆機制：如果冰箱空空，直接撈出符合他「專屬難度」的食譜！
    if not recommended:
        stmt = recipes.select()
        
        if preferred_difficulty:
            # 嚴格篩選出符合他程度的食譜
            stmt = stmt.where(recipes.c.difficulty == preferred_difficulty)
            
        recommended = await db.fetch_all(
            stmt.order_by(recipes.c.recipe_id.desc()).limit(limit) 
        )
        
        # 💡 終極防呆：萬一資料庫裡剛好「沒有半道」困難的食譜，為了不讓畫面空掉，只好放寬條件補齊
        if not recommended:
            recommended = await db.fetch_all(
                recipes.select().order_by(recipes.c.recipe_id.asc()).limit(limit)
            )

    # 熱門食譜
    popular = await db.fetch_all(
        recipes.select().order_by(recipes.c.recipe_id.desc()).limit(limit)
    )

    return {
        "popular": [dict(r) for r in popular],
        "recommended": [dict(r) for r in recommended],
    }

async def search_recipes(db, q: str, page: int, page_size: int) -> dict:
    offset = (page - 1) * page_size

    # 🚀 智慧關聯度分數
    relevance_score = sa.case(
        (recipes.c.title == q, 1),
        (recipes.c.title.like(f"{q}%"), 2),
        (recipes.c.title.like(f"%{q}%"), 3),
        else_=4
    )

    # 🚀 拔掉幽靈的 description 欄位，專心針對 title (食譜名稱) 進行精準搜尋！
    search_condition = recipes.c.title.like(f"%{q}%")

    # 🚀 執行主查詢
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
        .where(search_condition)
        .group_by(recipes.c.recipe_id)
        .order_by(
            relevance_score.asc(),                 # 第一關：按命中精準度排
            sa.func.length(recipes.c.title).asc(), # 第二關：名字越短越精準
            recipes.c.recipe_id.desc()             # 第三關：最新優先
        )
        .limit(page_size)
        .offset(offset)
    )

    count_stmt = sa.select(sa.func.count(recipes.c.recipe_id)).where(search_condition)
    
    try:
        rows = await db.fetch_all(stmt)
        total_count = await db.fetch_val(count_stmt)

        return {
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "results": [dict(r) for r in rows]
        }
    except Exception as e:
        print(f"搜尋食譜發生錯誤: {e}")
        return {"total": 0, "page": page, "page_size": page_size, "results": []}

async def get_recipes_by_ingredients(db, names: list, match_all: bool) -> dict:
    ing_rows = await db.fetch_all(
        ingredients.select().where(ingredients.c.name.in_(names))
    )
    ing_ids = [r["ingredient_id"] for r in ing_rows]
    if not ing_ids:
        return {"recipes": [], "message": "找不到對應食材"}

    ri_rows = await db.fetch_all(
        recipe_ingredients.select().where(recipe_ingredients.c.ingredient_id.in_(ing_ids))
    )
    id_counts = Counter(r["recipe_id"] for r in ri_rows)

    matched_ids = (
        [rid for rid, cnt in id_counts.items() if cnt >= len(ing_ids)]
        if match_all else list(id_counts.keys())
    )
    if not matched_ids:
        return {"recipes": [], "message": "沒有符合條件的食譜"}

    rows = await db.fetch_all(
        recipes.select().where(recipes.c.recipe_id.in_(matched_ids))
    )
    results = sorted(
        [dict(r) | {"match_count": id_counts[r["recipe_id"]]} for r in rows],
        key=lambda x: x["match_count"],
        reverse=True,
    )
    return {"total": len(results), "recipes": results}

async def advanced_filter(
    db,
    keyword,
    label,
    difficulty,
    max_time,
    is_vegetarian,
    sort_by,
    order,
    page,
    page_size
) -> dict:
    offset = (page - 1) * page_size
    stmt = recipes.select()

    if keyword:
        # 💡 改回正確的 title
        stmt = stmt.where(recipes.c.title.ilike(f"%{keyword}%"))

    if difficulty:
        stmt = stmt.where(recipes.c.difficulty == difficulty)

    if max_time:
        stmt = stmt.where(recipes.c.cook_time <= max_time)

    if is_vegetarian is not None:
        stmt = stmt.where(recipes.c.is_vegetarian == is_vegetarian)

    allowed_sort = {
        "recipe_id": recipes.c.recipe_id,
        "cook_time": recipes.c.cook_time,
        "servings": recipes.c.servings,
        "title": recipes.c.title, # 💡 改回正確的 title
    }

    sort_col = allowed_sort.get(sort_by, recipes.c.recipe_id)

    if order == "desc":
        stmt = stmt.order_by(sort_col.desc())
    else:
        stmt = stmt.order_by(sort_col.asc())

    rows = await db.fetch_all(
        stmt.offset(offset).limit(page_size)
    )

    return {
        "page": page,
        "page_size": page_size,
        "results": [dict(r) for r in rows],
    }

async def get_recipe_detail(db, recipe_id: str, user_id: Optional[str] = None) -> dict | None:
    row = await db.fetch_one(
        recipes.select().where(recipes.c.recipe_id == recipe_id)
    )

    if not row:
        return None

    ing_query = (
        recipe_ingredients
        .join(ingredients, recipe_ingredients.c.ingredient_id == ingredients.c.ingredient_id)
        .select()
        .where(recipe_ingredients.c.recipe_id == recipe_id)
    )
    ing_rows = await db.fetch_all(ing_query)

    ing_list = [
        {
            "ingredient_id": r["ingredient_id"],
            "name": r["name"],
            "amount": r["amount"],
            "unit": r["unit"],
        }
        for r in ing_rows
    ]

    label_rows = await db.fetch_all(
        recipe_label.select().where(recipe_label.c.recipe_id == recipe_id)
    )
    labels = [r["label"] for r in label_rows]

    method_rows = await db.fetch_all(
        recipe_cook_methods.select().where(recipe_cook_methods.c.recipe_id == recipe_id)
    )
    cook_methods = [r["cook_methods"] for r in method_rows]

    # 🚀 安全檢查：如果有傳入 user_id 才去資料庫查收藏紀錄
    is_favorited = False
    if user_id:
        fav_row = await db.fetch_one(
            user_recipes.select().where(
                (user_recipes.c.recipe_id == recipe_id) &
                (user_recipes.c.user_id == user_id)
            )
        )
        is_favorited = fav_row is not None

    result = dict(row)
    result["ingredients"] = ing_list
    result["labels"] = labels
    result["cook_methods"] = cook_methods
    result["is_favorited"] = is_favorited

    return result