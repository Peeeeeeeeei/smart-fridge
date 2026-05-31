from src.models import ingredients


async def list_ingredients(db, category, page, page_size) -> dict:
    offset = (page - 1) * page_size
    stmt = ingredients.select()
    if category:
        stmt = stmt.where(ingredients.c.category == category)
    stmt = stmt.order_by(ingredients.c.name).offset(offset).limit(page_size)
    rows = await db.fetch_all(stmt)
    return {"page": page, "page_size": page_size, "results": [dict(r) for r in rows]}


async def search_ingredients(db, q: str, limit: int) -> dict:
    rows = await db.fetch_all(
        ingredients.select()
        .where(ingredients.c.name.ilike(f"%{q}%"))
        .order_by(ingredients.c.name)
        .limit(limit)
    )
    return {"keyword": q, "results": [dict(r) for r in rows]}

async def get_ingredient_by_name(db, name: str):
    return await db.fetch_one(
        ingredients.select().where(ingredients.c.name == name)
    )

async def create_ingredient(db, name: str, category=None, unit: str = "份") -> dict:
    values = {
        "name": name,
        "category": category,
        "unit": unit,
    }

    new_id = await db.execute(
        ingredients.insert().values(**values)
    )

    return {
        "ingredient_id": new_id,
        "name": name,
        "category": category,
        "unit": unit,
    }