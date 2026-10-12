import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileAuth } from "@/lib/auth-mobile";

export async function GET(request: Request) {
  try {
    const auth = await getMobileAuth(request);

    if (!auth) {
      // Unauthenticated / Anonymous client: return only the default system catalog
      const [categories, questions] = await Promise.all([
        prisma.category.findMany({
          where: { userId: null },
          orderBy: { name: "asc" },
        }),
        prisma.question.findMany({
          where: { userId: null },
        }),
      ]);

      return NextResponse.json({
        authenticated: false,
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
        favorites: [],
        reports: [],
        quizHistory: [],
      });
    }

    // Authenticated user: return system catalog + user's cloud-backed content
    const userId = auth.userId;
    const [categories, questions, favorites, reports, quizHistory] = await Promise.all([
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
      prisma.quizHistory.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      }),
    ]);

    return NextResponse.json({
      authenticated: true,
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
      quizHistory: quizHistory.map((h) => ({
        id: h.id,
        date: h.date,
        mode: h.mode,
        categoryId: h.categoryId,
        difficulty: h.difficulty,
        playerCount: h.playerCount,
        scoreData: h.scoreData,
      })),
    });
  } catch (error: any) {
    console.error("Content pull error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
