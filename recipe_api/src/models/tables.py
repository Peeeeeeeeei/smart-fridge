import sqlalchemy
from sqlalchemy import (
    MetaData, Table, Column, Integer, String, Float,Boolean,
    Text, DateTime, Date, ForeignKey, SmallInteger, UniqueConstraint, CHAR
)
from datetime import datetime

metadata = MetaData()

ingredients = Table(
    "ingredients", metadata,
    Column("ingredient_id", CHAR(5), primary_key=True),
    Column("name", String(100), nullable=False),
    Column("category", String(50)),
)

recipes = Table(
    "recipes", metadata,
    Column("recipe_id", CHAR(3), primary_key=True),
    Column("title", String(100), nullable=False),
    Column("steps", String(5000)),
    Column("cook_time", Integer),
    Column("difficulty", CHAR(1)),       # 易 / 中 / 難
    Column("servings", Integer),
    Column("image_url", String(500)),
    Column("source_url", String(500)),
    Column("is_vegetarian", Boolean),
)

recipe_ingredients = Table(
    "recipe_ingredients", metadata,
    Column("recipe_id", CHAR(3), ForeignKey("recipes.recipe_id"), primary_key=True),
    Column("ingredient_id", CHAR(5), ForeignKey("ingredients.ingredient_id"), primary_key=True),
    Column("amount", Float),
    Column("unit", String(20)),
)

recipe_label = Table(
    "recipe_label", metadata,
    Column("recipe_id", CHAR(3), ForeignKey("recipes.recipe_id"), primary_key=True),
    Column("label", String(50), primary_key=True),
)

recipe_cook_methods = Table(
    "recipe_cook_methods", metadata,
    Column("recipe_id", CHAR(3), ForeignKey("recipes.recipe_id"), primary_key=True),
    Column("cook_methods", String(20), primary_key=True),
)

user_ingredients = Table(
    "user_ingredients", metadata,
    Column("user_id", CHAR(3), ForeignKey("users.user_id"), primary_key=True),
    Column("ingredient_id", CHAR(5), ForeignKey("ingredients.ingredient_id"), primary_key=True),
    Column("expiration_date", Date),
    Column("storage_location", String(50)),
    Column("purchase_date", Date),
    Column("amount", Float),
    Column("unit", String(20)),
)

user_recipes = Table(
    "user_recipes", metadata,
    Column("user_id", CHAR(3), ForeignKey("users.user_id"), primary_key=True),
    Column("recipe_id", CHAR(3), ForeignKey("recipes.recipe_id"), primary_key=True),
    Column("saved_at", DateTime),
)

users = Table(
    "users", metadata,
    Column("user_id", CHAR(3), primary_key=True),
    Column("cooking_level", String(10)),
    Column("username", String(50)),
    Column("email", String(100), unique=True),
    Column("password", String(100)),
)

user_category_preferences = Table(
    "user_category_preferences", metadata,
    Column("user_id", CHAR(3), ForeignKey("users.user_id"), primary_key=True),
    Column("category_preference", String(50), primary_key=True),
)