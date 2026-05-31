"""
seed.py — 建立假資料（開發 / 測試用）
執行：python scripts/seed.py
"""
import asyncio
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import database
from src.models import metadata
from src.database import engine


async def seed():
    metadata.create_all(engine)
    await database.connect()

    ing_id = await database.execute(
        "INSERT OR IGNORE INTO ingredients (name, category, unit) VALUES (:name, :cat, :unit)",
        {"name": "番茄", "cat": "蔬菜", "unit": "顆"}
    )
    if not ing_id:
        row = await database.fetch_one("SELECT id FROM ingredients WHERE name = '番茄'")
        ing_id = row["id"]

    recipe_id = await database.execute(
        """INSERT INTO recipes (name, description, cooking_time, difficulty, cuisine, steps, view_count, like_count)
           VALUES (:name, :desc, :time, :diff, :cui, :steps, 0, 0)""",
        {
            "name": "番茄炒蛋",
            "desc": "家常快炒，簡單美味",
            "time": 15,
            "diff": "簡單",
            "cui": "中式",
            "steps": json.dumps(["熱鍋下油", "炒蛋盛起", "炒番茄加鹽", "合炒調味"], ensure_ascii=False),
        }
    )

    await database.execute(
        """INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
           VALUES (:rid, :iid, :qty, :unit)""",
        {"rid": recipe_id, "iid": ing_id, "qty": 2, "unit": "顆"}
    )

    await database.disconnect()
    print(f"Seed 完成：ingredient_id={ing_id}, recipe_id={recipe_id}")


if __name__ == "__main__":
    asyncio.run(seed())
