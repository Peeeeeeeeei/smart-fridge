from pydantic import BaseModel
from typing import Optional, List
from datetime import date


class FridgeItemIn(BaseModel):
    ingredient_name: str
    amount: Optional[float] = 1
    unit: Optional[str] = None
    expiration_date: Optional[date] = None
    storage_location: Optional[str] = None


class FridgeItemUpdate(BaseModel):
    amount: float
    unit: Optional[str] = None
    expiration_date: Optional[date] = None
    storage_location: Optional[str] = None


class FridgeBatchIn(BaseModel):
    items: List[FridgeItemIn]


class FridgeItemOut(BaseModel):
    ingredient_id: str
    ingredient_name: str
    category: Optional[str] = None
    amount: Optional[float] = None
    unit: Optional[str] = None
    expiration_date: Optional[date] = None
    purchase_date: Optional[date] = None
    storage_location: Optional[str] = None

    class Config:
        from_attributes = True
