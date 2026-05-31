import { eq, like, and, sql, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, recipes, categories, recipeIngredients, recipeSteps, fridgeItems, favorites, cookingHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ========== Recipe Queries ==========

export async function getRecipes(options: { search?: string; categoryId?: number; methodId?: number; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { recipes: [], total: 0 };

  const conditions = [];
  if (options.search) {
    conditions.push(like(recipes.title, `%${options.search}%`));
  }
  if (options.categoryId) {
    conditions.push(eq(recipes.categoryId, options.categoryId));
  }
  if (options.methodId) {
    conditions.push(eq(recipes.methodId, options.methodId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = options.limit || 20;
  const offset = options.offset || 0;

  const [data, countResult] = await Promise.all([
    db.select().from(recipes).where(where).orderBy(desc(recipes.favoriteCount)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(recipes).where(where),
  ]);

  return { recipes: data, total: countResult[0]?.count || 0 };
}

export async function getRecipeById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (!recipe) return null;

  const ingredients = await db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
  const steps = await db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, id)).orderBy(recipeSteps.stepNumber);

  // Get category and method names
  let categoryName = null;
  let methodName = null;
  if (recipe.categoryId) {
    const [cat] = await db.select().from(categories).where(eq(categories.id, recipe.categoryId)).limit(1);
    categoryName = cat?.name || null;
  }
  if (recipe.methodId) {
    const [method] = await db.select().from(categories).where(eq(categories.id, recipe.methodId)).limit(1);
    methodName = method?.name || null;
  }

  return { ...recipe, ingredients, steps, categoryName, methodName };
}

export async function getRecommendedRecipes(limit = 6) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(recipes).orderBy(desc(recipes.favoriteCount)).limit(limit);
}

export async function getCategories(type?: "cuisine" | "method") {
  const db = await getDb();
  if (!db) return [];

  if (type) {
    return db.select().from(categories).where(eq(categories.type, type));
  }
  return db.select().from(categories);
}

// ========== Fridge Queries ==========

export async function getFridgeItems(userId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(fridgeItems.userId, userId)];
  if (search) {
    conditions.push(like(fridgeItems.name, `%${search}%`));
  }

  return db.select().from(fridgeItems).where(and(...conditions)).orderBy(desc(fridgeItems.updatedAt));
}

export async function addFridgeItem(data: { userId: number; name: string; quantity: string; unit: string; expiryDate: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(fridgeItems).values({
    userId: data.userId,
    name: data.name,
    quantity: data.quantity,
    unit: data.unit,
    expiryDate: new Date(data.expiryDate),
  }).$returningId();

  return result;
}

export async function updateFridgeItem(id: number, userId: number, data: { name?: string; quantity?: string; unit?: string; expiryDate?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.expiryDate !== undefined) updateData.expiryDate = new Date(data.expiryDate);

  await db.update(fridgeItems).set(updateData).where(and(eq(fridgeItems.id, id), eq(fridgeItems.userId, userId)));
}

export async function deleteFridgeItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(fridgeItems).where(and(eq(fridgeItems.id, id), eq(fridgeItems.userId, userId)));
}

// ========== Favorites Queries ==========

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const favs = await db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
  if (favs.length === 0) return [];

  const recipeIds = favs.map(f => f.recipeId);
  const recipeList = await db.select().from(recipes).where(inArray(recipes.id, recipeIds));

  return favs.map(f => ({
    ...f,
    recipe: recipeList.find(r => r.id === f.recipeId) || null,
  }));
}

export async function addFavorite(userId: number, recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already favorited
  const existing = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.recipeId, recipeId))).limit(1);
  if (existing.length > 0) return existing[0];

  const [result] = await db.insert(favorites).values({ userId, recipeId }).$returningId();
  // Increment favorite count
  await db.update(recipes).set({ favoriteCount: sql`${recipes.favoriteCount} + 1` }).where(eq(recipes.id, recipeId));
  return result;
}

export async function removeFavorite(userId: number, recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.recipeId, recipeId))).limit(1);
  if (existing.length === 0) return;

  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.recipeId, recipeId)));
  await db.update(recipes).set({ favoriteCount: sql`${recipes.favoriteCount} - 1` }).where(eq(recipes.id, recipeId));
}

export async function isFavorited(userId: number, recipeId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.recipeId, recipeId))).limit(1);
  return result.length > 0;
}

// ========== Cooking History Queries ==========

export async function getCookingHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const history = await db.select().from(cookingHistory).where(eq(cookingHistory.userId, userId)).orderBy(desc(cookingHistory.cookedAt));
  if (history.length === 0) return [];

  const recipeIds = history.map(h => h.recipeId);
  const recipeList = await db.select().from(recipes).where(inArray(recipes.id, recipeIds));

  return history.map(h => ({
    ...h,
    recipe: recipeList.find(r => r.id === h.recipeId) || null,
  }));
}

export async function addCookingRecord(userId: number, recipeId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(cookingHistory).values({ userId, recipeId, notes: notes || null }).$returningId();
  return result;
}

// ========== Recipe Recommendation by Fridge ==========

export async function getRecommendedByFridge(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get user's fridge items
  const userItems = await db.select().from(fridgeItems).where(eq(fridgeItems.userId, userId));
  if (userItems.length === 0) return [];

  const fridgeNames = userItems.map(item => item.name);

  // Find recipes that have matching ingredients
  const allRecipeIngredients = await db.select().from(recipeIngredients);
  
  // Count matches per recipe
  const matchCount: Record<number, number> = {};
  const totalIngredients: Record<number, number> = {};
  
  for (const ing of allRecipeIngredients) {
    totalIngredients[ing.recipeId] = (totalIngredients[ing.recipeId] || 0) + 1;
    if (fridgeNames.some(name => ing.name.includes(name) || name.includes(ing.name))) {
      matchCount[ing.recipeId] = (matchCount[ing.recipeId] || 0) + 1;
    }
  }

  // Sort by match ratio
  const recipeScores = Object.entries(matchCount)
    .map(([recipeId, matches]) => ({
      recipeId: parseInt(recipeId),
      matches,
      total: totalIngredients[parseInt(recipeId)] || 1,
      ratio: matches / (totalIngredients[parseInt(recipeId)] || 1),
    }))
    .filter(r => r.matches >= 1)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 10);

  if (recipeScores.length === 0) return [];

  const recipeIds = recipeScores.map(r => r.recipeId);
  const recipeList = await db.select().from(recipes).where(inArray(recipes.id, recipeIds));

  return recipeScores.map(score => ({
    ...recipeList.find(r => r.id === score.recipeId)!,
    matchedIngredients: score.matches,
    totalIngredients: score.total,
    matchRatio: Math.round(score.ratio * 100),
  })).filter(r => r.id);
}
