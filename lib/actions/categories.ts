"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCategoryRecord, updateCategoryRecord, deleteCategoryRecord } from "@/lib/data/categories";
import { incrementContentVersion } from "@/lib/data/app-state";
import { prisma } from "@/lib/prisma";

const CategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Category name is too long"),
  parentId: z.string().nullable().optional(),
});

export async function createCategory(data: { name: string; parentId?: string | null }) {
  try {
    const validatedData = CategorySchema.parse(data);

    await createCategoryRecord(validatedData.name, validatedData.parentId);
    await incrementContentVersion();

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to create category:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => e.message).join(", ") };
    }
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(id: string, data: { name: string; parentId?: string | null }) {
  try {
    const validatedData = CategorySchema.parse(data);

    await updateCategoryRecord(id, validatedData.name, validatedData.parentId);
    await incrementContentVersion();

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update category:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => e.message).join(", ") };
    }
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string) {
  try {
    await deleteCategoryRecord(id);
    await incrementContentVersion();

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}

export async function getCategoriesAction() {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}
