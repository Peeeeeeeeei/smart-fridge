from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class IngredientBase(BaseModel):
    name: str = Field(..., example="雞蛋")
    category: Optional[str] = Field(None, example="蛋類")
    unit: Optional[str] = Field("份", example="個")


class IngredientCreate(IngredientBase):
    name: str
    category: Optional[str] = None
    unit: Optional[str] = "份"


class IngredientOut(IngredientBase):
    ingredient_id: str

    class Config:
        from_attributes = True
