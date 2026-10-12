import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileAuth } from "@/lib/auth-mobile";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const auth = await getMobileAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized: authentication required for cloud sync" },
      { status: 401 }
    );
  }

  const authUserId = auth.userId;
  const { table } = await params;
  const body = await request.json();

  try {
    switch (table) {
      case "Category": {
        const existing = await prisma.category.findUnique({ where: { id: body.id } });
        if (existing && existing.userId !== authUserId) {
          return NextResponse.json(
            { error: "Forbidden: cannot overwrite another user's or system category" },
            { status: 403 }
          );
        }
        await prisma.category.upsert({
          where: { id: body.id },
          create: {
            id: body.id,
            name: body.name,
            parentId: body.parentId || null,
            userId: authUserId,
          },
          update: {
            name: body.name,
            parentId: body.parentId || null,
            userId: authUserId,
          },
        });
        break;
      }

      case "Question": {
        const existing = await prisma.question.findUnique({ where: { id: body.id } });
        if (existing && existing.userId !== authUserId) {
          return NextResponse.json(
            { error: "Forbidden: cannot overwrite another user's or system question" },
            { status: 403 }
          );
        }
        const options = typeof body.options === "string" ? JSON.parse(body.options) : body.options;
        await prisma.question.upsert({
          where: { id: body.id },
          create: {
            id: body.id,
            categoryId: body.categoryId,
            question: body.question,
            options,
            correctAnswer: body.correctAnswer,
            difficulty: body.difficulty,
            imageUrl: body.imageUrl || null,
            type: body.type || "multiple_choice",
            userId: authUserId,
          },
          update: {
            categoryId: body.categoryId,
            question: body.question,
            options,
            correctAnswer: body.correctAnswer,
            difficulty: body.difficulty,
            imageUrl: body.imageUrl || null,
            type: body.type || "multiple_choice",
            userId: authUserId,
          },
        });
        break;
      }

      case "Favorite": {
        await prisma.$transaction(async (tx) => {
          await tx.favorite.deleteMany({
            where: {
              userId: authUserId,
              categoryId: body.categoryId,
              NOT: { id: body.id },
            },
          });
          await tx.favorite.upsert({
            where: { id: body.id },
            create: { id: body.id, userId: authUserId, categoryId: body.categoryId },
            update: { userId: authUserId, categoryId: body.categoryId },
          });
        });
        break;
      }

      case "QuestionReport": {
        await prisma.questionReport.upsert({
          where: { id: body.id },
          create: {
            id: body.id,
            questionId: body.questionId,
            userId: authUserId,
            description: body.description,
            createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
            resolved: body.resolved === 1 || body.resolved === true,
          },
          update: {
            description: body.description,
            resolved: body.resolved === 1 || body.resolved === true,
          },
        });
        break;
      }

      case "QuizHistory": {
        const existing = await prisma.quizHistory.findUnique({ where: { id: body.id } });
        if (existing && existing.userId !== authUserId) {
          return NextResponse.json(
            { error: "Forbidden: cannot overwrite another user's quiz history" },
            { status: 403 }
          );
        }
        const scoreData =
          typeof body.scoreData === "string" ? JSON.parse(body.scoreData) : body.scoreData;
        await prisma.quizHistory.upsert({
          where: { id: body.id },
          create: {
            id: body.id,
            userId: authUserId,
            date: body.date,
            mode: body.mode,
            categoryId: body.categoryId,
            difficulty: body.difficulty,
            playerCount: Number(body.playerCount) || 1,
            scoreData: scoreData ?? [],
          },
          update: {
            userId: authUserId,
            date: body.date,
            mode: body.mode,
            categoryId: body.categoryId,
            difficulty: body.difficulty,
            playerCount: Number(body.playerCount) || 1,
            scoreData: scoreData ?? [],
          },
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(`Sync write error (${table}):`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
