def test_full_cooking_flow(client):
    # 1. 新增食材到冰箱
    res = client.post("/api/fridge/", json={
        "ingredient_name": "番茄",
        "amount": 3,
        "unit": "顆"
    })
    assert res.status_code == 201

    # 2. 確認冰箱有這個食材
    fridge = client.get("/api/fridge/")
    names = [i["ingredient_name"] for i in fridge.json()]
    assert "番茄" in names

    # 3. 用冰箱食材查食譜
    res = client.get("/api/recipes/by-ingredients?ingredient_names=番茄")
    assert res.status_code == 200
    recipes = res.json()["recipes"]

    # 4. 如果有食譜，收藏第一筆
    if recipes:
        # print(f"\n找到 {len(recipes)} 筆食譜，recipe_id={recipes[0]['recipe_id']}")
        recipe_id = recipes[0]["recipe_id"]

        # 先查目前收藏清單
        favlist = client.get("/api/favorites/")
        fav_ids = [r["recipe_id"] for r in favlist.json()["results"]]

        # 如果已經收藏，先取消收藏
        if recipe_id in fav_ids:
            client.post(f"/api/favorites/{recipe_id}")

        # 執行收藏
        fav = client.post(f"/api/favorites/{recipe_id}")
        assert fav.json()["is_favorited"] == True

        # 確認收藏清單有它
        favlist = client.get("/api/favorites/")
        fav_ids = [r["recipe_id"] for r in favlist.json()["results"]]
        assert recipe_id in fav_ids

        # 取消收藏
        client.post(f"/api/favorites/{recipe_id}")
        
        # 確認已移除
        favlist2 = client.get("/api/favorites/")
        fav_ids2 = [r["recipe_id"] for r in favlist2.json()["results"]]
        assert recipe_id not in fav_ids2

def test_batch_then_search(client):
    # 批次新增
    res = client.post("/api/fridge/batch", json={
        "items": [
            {"ingredient_name": "雞蛋", "amount": 6, "unit": "顆"},
            {"ingredient_name": "牛奶", "amount": 500, "unit": "毫升"},
            {"ingredient_name": "麵粉", "amount": 200, "unit": "克"},
        ]
    })
    assert res.status_code == 201
    assert len(res.json()["results"]) == 3

    # 確認全部在冰箱裡
    fridge = client.get("/api/fridge/")
    names = [i["ingredient_name"] for i in fridge.json()]
    assert "雞蛋" in names
    assert "牛奶" in names
    assert "麵粉" in names

    # 用這些食材查食譜
    res = client.get("/api/recipes/by-ingredients?ingredient_names=雞蛋,牛奶,麵粉")
    assert res.status_code == 200

    # 清空冰箱
    clear = client.delete("/api/fridge/")
    assert clear.status_code == 200

    # 確認冰箱空了
    fridge2 = client.get("/api/fridge/")
    assert fridge2.json() == []