from fastapi import APIRouter, HTTPException, Query

from src.database import database
from src.services import favorite_service

router = APIRouter()


@router.get("/", summary="查看已收藏的食譜")
async def get_favorites(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    return await favorite_service.get_favorites(database, page, page_size)


@router.post("/{recipe_id}", summary="新增或取消收藏（toggle）")
async def toggle_favorite(recipe_id: int):
    result = await favorite_service.toggle_favorite(database, recipe_id)
    if not result:
        raise HTTPException(status_code=404, detail="食譜不存在")
    return result
