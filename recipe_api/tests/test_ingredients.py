def test_list_ingredients(client):
    res = client.get("/api/ingredients/")
    assert res.status_code == 200
    assert "results" in res.json()

def test_fuzzy_search(client):
    # 先建一個食材
    client.post("/api/ingredients/", json={"name": "紅蘿蔔", "category": "蔬菜"})
    
    res = client.get("/api/ingredients/search?q=蘿蔔")
    assert res.status_code == 200
    names = [i["name"] for i in res.json()["results"]]
    assert "紅蘿蔔" in names

def test_create_duplicate_ingredient(client):
    client.post("/api/ingredients/", json={"name": "洋蔥"})
    res = client.post("/api/ingredients/", json={"name": "洋蔥"})
    
    print(res.status_code)
    print(res.json())
    
    assert res.status_code == 409  # 重複應該衝突

    