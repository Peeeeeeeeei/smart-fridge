from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class RecipeIngredientOut(BaseModel):
    ingredient_id: int
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    note: Optional[str] = None
    amount: Optional[Any] = None # 💡 確保前端 amount 抓得到

    class Config:
        extra = "allow"

class RecipeBase(BaseModel):
    name: Optional[str] = Field(None, example="番茄炒蛋")
    title: Optional[str] = None # 💡 為了相容你們資料庫真實的 title 欄位
    description: Optional[str] = None
    cooking_time: Optional[int] = Field(None, example=20, description="分鐘")
    cook_time: Optional[int] = None # 💡 相容資料庫的 cook_time
    difficulty: Optional[str] = Field(None, example="簡單")
    cuisine: Optional[str] = Field(None, example="中式")
    tags: Optional[str] = Field(None, example="快炒,家常")
    image_url: Optional[str] = None
    
    # 🚀 【破案關鍵】：加入前端篩選器與徽章需要的動態欄位！
    labels: Optional[str] = None
    cook_methods: Optional[str] = None
    match_count: Optional[int] = None

    class Config:
        # 🌟 告訴 Pydantic：遇到不在名單上的額外欄位不要刪掉，直接放行！
        extra = "allow" 
        from_attributes = True

class RecipeOut(RecipeBase):
    id: Optional[int] = None
    recipe_id: Optional[str] = None
    view_count: Optional[int] = 0
    like_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    is_favorited: Optional[bool] = False

    class Config:
        from_attributes = True
        extra = "allow"

class RecipeDetailOut(RecipeOut):
    steps: Optional[str] = None
    ingredients: List[RecipeIngredientOut] = []