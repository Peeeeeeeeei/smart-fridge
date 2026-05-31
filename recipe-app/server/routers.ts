import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Recipe routes (public)
  recipe: router({
    list: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        categoryId: z.number().optional(),
        methodId: z.number().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getRecipes(input || {});
      }),

    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getRecipeById(input.id);
      }),

    recommended: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getRecommendedRecipes(input?.limit || 6);
      }),

    categories: publicProcedure
      .input(z.object({ type: z.enum(["cuisine", "method"]).optional() }).optional())
      .query(async ({ input }) => {
        return db.getCategories(input?.type);
      }),
  }),

  // Fridge routes (protected)
  fridge: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getFridgeItems(ctx.user.id, input?.search);
      }),

    add: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "食材名稱不可為空"),
        quantity: z.string().min(1).refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, { message: "數量必須為正數" }),
        unit: z.string().min(1, "單位不可為空"),
        expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式須為 YYYY-MM-DD"),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.addFridgeItem({ userId: ctx.user.id, ...input });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        quantity: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, { message: "數量必須為正數" }).optional(),
        unit: z.string().min(1).optional(),
        expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式須為 YYYY-MM-DD").optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateFridgeItem(id, ctx.user.id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteFridgeItem(input.id, ctx.user.id);
      }),

    recommend: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getRecommendedByFridge(ctx.user.id);
      }),
  }),

  // Favorites routes (protected)
  favorite: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserFavorites(ctx.user.id);
      }),

    add: protectedProcedure
      .input(z.object({ recipeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.addFavorite(ctx.user.id, input.recipeId);
      }),

    remove: protectedProcedure
      .input(z.object({ recipeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.removeFavorite(ctx.user.id, input.recipeId);
      }),

    check: protectedProcedure
      .input(z.object({ recipeId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.isFavorited(ctx.user.id, input.recipeId);
      }),
  }),

  // Cooking history routes (protected)
  history: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getCookingHistory(ctx.user.id);
      }),

    add: protectedProcedure
      .input(z.object({
        recipeId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.addCookingRecord(ctx.user.id, input.recipeId, input.notes);
      }),
  }),
});

export type AppRouter = typeof appRouter;
