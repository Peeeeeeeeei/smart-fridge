from datetime import datetime
from src.models import user_recipes, recipes

USER_ID = "001"

async def get_favorites(db, page: int, page_size: int) -> dict:
    offset = (page - 1) * page_size
    query = (
        user_recipes.join(recipes, user_recipes.c.recipe_id == recipes.c.recipe_id)
        .select()
        .where(user_recipes.c.user_id == USER_ID)
        .order_by(user_recipes.c.saved_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    rows = await db.fetch_all(query)
    return {
        "page": page,
        "page_size": page_size,
        "results": [
            {
                "recipe_id": r["recipe_id"],
                "title": r["title"],
                "cook_time": r["cook_time"],
                "difficulty": r["difficulty"],
                "image_url": r["image_url"],
                "is_vegetarian": r["is_vegetarian"],
                "saved_at": r["saved_at"],
            }
            for r in rows
        ],
    }



async def toggle_favorite(db, recipe_id: int) -> dict:
    recipe = await db.fetch_one(recipes.select().where(recipes.c.recipe_id == recipe_id))
    if not recipe:
        return None

    existing = await db.fetch_one(
        user_recipes.select().where(
            (user_recipes.c.user_id == USER_ID) & (user_recipes.c.recipe_id == recipe_id)
        )
    )

    if existing:
        await db.execute(
            user_recipes.delete().where(
                (user_recipes.c.user_id == USER_ID) &
                (user_recipes.c.recipe_id == recipe_id)
            )
        )
        return {"recipe_id": recipe_id, "is_favorited": False, "message": "已取消收藏"}

    await db.execute(
        user_recipes.insert().values(
            user_id=USER_ID,
            recipe_id=recipe_id,
            saved_at=datetime.utcnow(),
        )
    )
    return {"recipe_id": recipe_id, "is_favorited": True, "message": "已加入收藏"}
