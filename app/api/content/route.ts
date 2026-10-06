import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  try {
    const [categories, questions, favorites, reports] = await Promise.all([
      prisma.category.findMany({
        where: {
          OR: [{ userId: null }, { userId }],
        },
        orderBy: { name: "asc" },
      }),
      prisma.question.findMany({
        where: {
          OR: [{ userId: null }, { userId }],
        },
      }),
      prisma.favorite.findMany({
        where: { userId },
      }),
      prisma.questionReport.findMany({
        where: { userId },
      }),
    ]);

    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId,
        userId: c.userId,
      })),
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        type: q.type,
        shownCount: q.shownCount,
        categoryId: q.categoryId,
        imageUrl: q.imageUrl,
        userId: q.userId,
      })),
      favorites: favorites.map((f) => ({
        id: f.id,
        userId: f.userId,
        categoryId: f.categoryId,
      })),
      reports: reports.map((r) => ({
        id: r.id,
        questionId: r.questionId,
        userId: r.userId,
        description: r.description,
        createdAt: r.createdAt.toISOString(),
        resolved: r.resolved,
      })),
    });
  } catch (error: any) {
    console.error("Content pull error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
