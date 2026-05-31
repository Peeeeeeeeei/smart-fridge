from pydantic import BaseModel


class FavoriteToggleOut(BaseModel):
    recipe_id: int
    is_favorited: bool
    message: str
