# API 端點文件

## 伺服器網址 (Base URL)
- **正式環境 (雲端)**：`https://smart-fridge-api-0fi3.onrender.com`
- **開發環境 (本機)**：`http://localhost:8000`
- **互動文件 (Swagger UI)**：`https://smart-fridge-api-0fi3.onrender.com/docs`

---

## 食譜 `/api/recipes`

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/recipes/home` | 首頁推薦 / 熱門食譜 |
| GET | `/api/recipes/search?q=番茄` | 關鍵字搜尋 |
| GET | `/api/recipes/by-ingredients?ingredient_names=雞蛋,番茄` | 依食材查詢 |
| GET | `/api/recipes/advanced` | 進階篩選與排序 |
| GET | `/api/recipes/` | 全部食譜（分頁） |
| GET | `/api/recipes/{id}` | 單一食譜詳細 |

## 冰箱 `/api/fridge`

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/fridge/` | 顯示冰箱食材 |
| POST | `/api/fridge/` | 新增單一食材 |
| POST | `/api/fridge/batch` | 批次新增食材 |
| PUT | `/api/fridge/{item_id}` | 修改數量 |
| DELETE | `/api/fridge/{item_id}` | 移除食材 |
| DELETE | `/api/fridge/` | 清空冰箱 |

## 收藏 `/api/favorites`

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/favorites/` | 已收藏清單 |
| POST | `/api/favorites/{recipe_id}` | 新增/取消收藏 |

## 食材 `/api/ingredients`

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/ingredients/` | 所有食材 |
| GET | `/api/ingredients/search?q=蛋` | 模糊查詢 |
| POST | `/api/ingredients/` | 新增食材 |

## 常見回應格式

成功：`{ "results": [...] }` 或 `{ "message": "...", "id": 1 }`
失敗：`{ "detail": "錯誤原因" }`

| 狀態碼 | 意義 |
|--------|------|
| 200 | 成功 |
| 201 | 建立成功 |
| 404 | 資源不存在 |
| 409 | 重複資料 |
| 422 | 參數格式錯誤 |