import { prisma } from "@/lib/prisma";
import type { CategoryWithCounts, CategoryWithQuestions } from "./types";

export async function getCategoriesWithQuestionCount(search?: string, source: 'system' | 'user' = 'system'): Promise<CategoryWithCounts[]> {
  const userFilter = source === 'system' ? { userId: null } : { userId: { not: null } };

  const categories = await prisma.category.findMany({
    where: { 
      parentId: null,
      ...userFilter,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { subCategories: { some: { name: { contains: search, mode: 'insensitive' } } } }
        ]
      } : {})
    },
    include: {
      _count: {
        select: { questions: true }
      },
      subCategories: {
        where: search ? {
          name: { contains: search, mode: 'insensitive' }
        } : {},
        include: {
          _count: {
            select: { questions: true }
          }
        },
        orderBy: {
          name: 'asc'
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return categories as unknown as CategoryWithCounts[];
}

export async function getCategoriesWithQuestions(): Promise<CategoryWithQuestions[]> {
  return await prisma.category.findMany({
    include: {
      questions: true,
      subCategories: true,
    },
  });
}

export async function getAllCategories(): Promise<{ id: string; name: string }[]> {
  return await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
}

export async function getCategoryWithQuestionsById(id: string): Promise<CategoryWithQuestions | null> {
  return await prisma.category.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: {
          question: 'asc'
        }
      },
      subCategories: true
    }
  });
}

export async function createCategoryRecord(name: string, parentId?: string | null) {
  return await prisma.category.create({
    data: { 
      name,
      parentId: parentId || null
    }
  });
}

export async function updateCategoryRecord(id: string, name: string, parentId?: string | null) {
  return await prisma.category.update({
    where: { id },
    data: { 
      name,
      parentId: parentId || null
    }
  });
}

export async function deleteCategoryRecord(id: string) {
  return await prisma.$transaction(async (tx) => {
    // Subcategories must be removed first (no onDelete cascade on parentId)
    const children = await tx.category.findMany({
      where: { parentId: id },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id);
    const allIds = [id, ...childIds];

    // Favorites have no FK cascade — clean them up explicitly
    await tx.favorite.deleteMany({
      where: { categoryId: { in: allIds } },
    });

    if (childIds.length > 0) {
      await tx.category.deleteMany({ where: { id: { in: childIds } } });
    }

    // Questions cascade via Question.category onDelete: Cascade
    await tx.category.delete({ where: { id } });
  });
}
