import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileAuth } from "@/lib/auth-mobile";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const auth = await getMobileAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized: authentication required for cloud sync" },
      { status: 401 }
    );
  }

  const authUserId = auth.userId;
  const { table, id } = await params;

  try {
    let deletedCount = 0;
    switch (table) {
      case "Category": {
        const res = await prisma.category.deleteMany({
          where: { id, userId: authUserId },
        });
        deletedCount = res.count;
        break;
      }

      case "Question": {
        const res = await prisma.question.deleteMany({
          where: { id, userId: authUserId },
        });
        deletedCount = res.count;
        break;
      }

      case "Favorite": {
        const res = await prisma.favorite.deleteMany({
          where: { id, userId: authUserId },
        });
        deletedCount = res.count;
        break;
      }

      case "QuizHistory": {
        const res = await prisma.quizHistory.deleteMany({
          where: { id, userId: authUserId },
        });
        deletedCount = res.count;
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 });
    }

    if (deletedCount === 0) {
      return NextResponse.json(
        { error: "Record not found or not owned by user" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(`Sync delete error (${table}/${id}):`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
