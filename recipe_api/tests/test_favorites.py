import pytest
def test_get_favorites_empty(client):
    res = client.get("/api/favorites/")
    assert res.status_code == 200

def test_toggle_nonexistent_recipe(client):
    res = client.post("/api/favorites/99999")
    assert res.status_code == 404

@pytest.mark.skip(reason="需要資料庫有食譜資料，待建立 fixture 後啟用")
def test_favorite_toggle(client):
    # 使用 seed 中建立的 recipe_id
    recipe_id = "001"
    res1 = client.post(f"/api/favorites/{recipe_id}")
    assert res1.json()["is_favorited"] == True

    res2 = client.post(f"/api/favorites/{recipe_id}")  # 再按一次取消
    assert res2.json()["is_favorited"] == False