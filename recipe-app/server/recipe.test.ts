import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("recipe.list", () => {
  it("returns recipes with total count", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.recipe.list({});
    expect(result).toHaveProperty("recipes");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.recipes)).toBe(true);
    expect(result.total).toBeGreaterThan(0);
  });

  it("supports search by keyword", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.recipe.list({ search: "番茄" });
    expect(result.recipes.length).toBeGreaterThan(0);
    expect(result.recipes[0].title).toContain("番茄");
  });
});

describe("recipe.detail", () => {
  it("returns recipe with ingredients and steps", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.recipe.detail({ id: 1 });
    expect(result).not.toBeNull();
    expect(result!.title).toBe("番茄炒蛋");
    expect(result!.ingredients).toBeDefined();
    expect(result!.ingredients.length).toBeGreaterThan(0);
    expect(result!.steps).toBeDefined();
    expect(result!.steps.length).toBeGreaterThan(0);
  });

  it("returns null for non-existent recipe", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.recipe.detail({ id: 9999 });
    expect(result).toBeNull();
  });
});

describe("recipe.categories", () => {
  it("returns all categories", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.recipe.categories({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("filters by type", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const cuisines = await caller.recipe.categories({ type: "cuisine" });
    const methods = await caller.recipe.categories({ type: "method" });
    expect(cuisines.every((c) => c.type === "cuisine")).toBe(true);
    expect(methods.every((m) => m.type === "method")).toBe(true);
  });
});

describe("recipe.recommended", () => {
  it("returns recommended recipes", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.recipe.recommended({ limit: 3 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(3);
  });
});

describe("fridge (protected)", () => {
  it("rejects unauthenticated access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.fridge.list({})).rejects.toThrow();
  });

  it("returns empty list for new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.fridge.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("favorite (protected)", () => {
  it("rejects unauthenticated access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.favorite.list()).rejects.toThrow();
  });
});

describe("history (protected)", () => {
  it("rejects unauthenticated access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.history.list()).rejects.toThrow();
  });
});
