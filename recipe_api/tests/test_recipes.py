def test_home_recipes(client):
    res = client.get("/api/recipes/home")
    assert res.status_code == 200
    assert "popular" in res.json()
    assert "recommended" in res.json()

def test_search_recipes(client):
    res = client.get("/api/recipes/search?q=炒")
    assert res.status_code == 200
    assert "results" in res.json()

def test_search_missing_query(client):
    res = client.get("/api/recipes/search")  # 沒帶 q
    assert res.status_code == 422

def test_get_nonexistent_recipe(client):
    res = client.get("/api/recipes/99999")
    assert res.status_code == 404

def test_by_ingredients(client):
    res = client.get("/api/recipes/by-ingredients?ingredient_names=番茄")
    assert res.status_code == 200
    assert "recipes" in res.json()

def test_advanced_filter(client):
    res = client.get("/api/recipes/advanced?difficulty=簡單&sort_by=cook_time&order=desc")
    assert res.status_code == 200

def test_advanced_invalid_sort(client):
    # 非法欄位應該 fallback 而不是 crash
    res = client.get("/api/recipes/advanced?sort_by=非法欄位")
    assert res.status_code == 200