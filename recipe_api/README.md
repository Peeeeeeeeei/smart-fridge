# 食譜管理 API

FastAPI 後端，提供食譜查詢、冰箱管理、收藏功能。

## 快速啟動

```bash
pip install -r requirements.txt
cp .env.example .env
python scripts/seed.py
uvicorn src.main:app --reload --port 8000
```

本機網址：

```text
http://127.0.0.1:8000
```

Swagger API 文件：

```text
http://127.0.0.1:8000/docs
```

線上 API 文件：

```text
https://recipeapi-production-125f.up.railway.app/docs
```

---

## 專案結構

```text
project/
├── src/
│   ├── main.py
│   ├── models/
│   ├── schemas/
│   ├── routes/
│   ├── services/
│   └── utils/
├── tests/
├── docs/
├── scripts/
└── requirements.txt
```

---

# 前端串接說明

## Base URL

本機開發：

```text
http://127.0.0.1:8000
```

部署版本：

```text
https://recipeapi-production-125f.up.railway.app
```

---

# Recipes API

## 取得食譜列表

```http
GET /api/recipes/
```

範例：

```js
fetch("/api/recipes/")
```

---

## 首頁熱門與推薦食譜

```http
GET /api/recipes/home
```

範例：

```js
fetch("/api/recipes/home")
```

回傳：

```json
{
  "popular": [],
  "recommended": []
}
```

---

## 搜尋食譜

```http
GET /api/recipes/search?q=炒
```

範例：

```js
fetch("/api/recipes/search?q=炒")
```

---

## 食材查食譜

```http
GET /api/recipes/by-ingredients?ingredient_names=雞蛋,番茄
```

範例：

```js
fetch("/api/recipes/by-ingredients?ingredient_names=雞蛋,番茄")
```

---

## 取得食譜詳細資訊

```http
GET /api/recipes/{recipe_id}
```

範例：

```js
fetch("/api/recipes/1")
```

---

## 進階搜尋

```http
GET /api/recipes/advanced
```

參數：

| 參數 | 類型 | 說明 |
|--------|--------|--------|
| keyword | string | 關鍵字 |
| difficulty | string | 難度 |
| max_time | int | 最大烹飪時間 |
| is_vegetarian | bool | 是否素食 |
| sort_by | string | recipe_id / cook_time / servings / title |
| order | string | asc / desc |

範例：

```http
GET /api/recipes/advanced?difficulty=簡單&sort_by=cook_time&order=desc
```

---

# Fridge API

## 取得冰箱內容

```http
GET /api/fridge/
```

---

## 新增食材

```http
POST /api/fridge/
```

Request Body：

```json
{
  "ingredient_name": "雞蛋",
  "amount": 6,
  "unit": "顆"
}
```

JavaScript：

```js
fetch("/api/fridge/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    ingredient_name: "雞蛋",
    amount: 6,
    unit: "顆"
  })
})
```

---

## 批次新增食材

```http
POST /api/fridge/batch
```

Request Body：

```json
{
  "items": [
    {
      "ingredient_name": "雞蛋",
      "amount": 6,
      "unit": "顆"
    },
    {
      "ingredient_name": "牛奶",
      "amount": 500,
      "unit": "毫升"
    }
  ]
}
```

---

## 修改食材

```http
PUT /api/fridge/{ingredient_id}
```

Request Body：

```json
{
  "amount": 10,
  "unit": "顆"
}
```

---

## 刪除食材

```http
DELETE /api/fridge/{ingredient_id}
```

---

## 清空冰箱

```http
DELETE /api/fridge/
```

---

# Ingredients API

## 取得所有食材

```http
GET /api/ingredients/
```

---

## 搜尋食材

```http
GET /api/ingredients/search?q=蛋
```

---

## 新增食材

```http
POST /api/ingredients/
```

Request Body：

```json
{
  "name": "洋蔥",
  "category": "蔬菜",
  "unit": "顆"
}
```

---

# Favorites API

## 取得收藏清單

```http
GET /api/favorites/
```

---

## 收藏 / 取消收藏

```http
POST /api/favorites/{recipe_id}
```

注意：

```text
未收藏 -> 執行後變收藏
已收藏 -> 執行後取消收藏
```

回傳：

```json
{
  "recipe_id": 1,
  "is_favorited": true
}
```

---

# 執行測試

```bash
pytest tests/ -v
```

目前測試涵蓋：

- Recipes API
- Fridge API
- Ingredients API
- Favorites API
- Integration Test

---

# 資料庫切換

修改 `.env`

MySQL：

```text
mysql+aiomysql://user:pass@localhost/recipe_db
```