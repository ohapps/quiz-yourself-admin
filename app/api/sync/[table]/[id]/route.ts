import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileAuth } from "@/lib/auth-mobile";

export async function PATCH(
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
  const body = await request.json();

  try {
    switch (table) {
      case "Category": {
        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing || existing.userId !== authUserId) {
          return NextResponse.json(
            { error: "Forbidden: record not found or not owned by user" },
            { status: 403 }
          );
        }
        await prisma.category.update({
          where: { id },
          data: {
            name: body.name,
            parentId: body.parentId ?? undefined,
          },
        });
        break;
      }

      case "Question": {
        const existing = await prisma.question.findUnique({ where: { id } });
        if (!existing || existing.userId !== authUserId) {
          return NextResponse.json(
            { error: "Forbidden: record not found or not owned by user" },
            { status: 403 }
          );
        }
        const data: any = { ...body };
        if (typeof data.options === "string") data.options = JSON.parse(data.options);
        delete data.id;
        delete data.userId;
        await prisma.question.update({ where: { id }, data });
        break;
      }

      case "QuizHistory": {
        const existing = await prisma.quizHistory.findUnique({ where: { id } });
        if (!existing || existing.userId !== authUserId) {
          return NextResponse.json(
            { error: "Forbidden: record not found or not owned by user" },
            { status: 403 }
          );
        }
        const data: any = { ...body };
        delete data.id;
        delete data.userId;
        if (data.scoreData && typeof data.scoreData === "string") {
          data.scoreData = JSON.parse(data.scoreData);
        }
        await prisma.quizHistory.update({ where: { id }, data });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(`Sync patch error (${table}/${id}):`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
