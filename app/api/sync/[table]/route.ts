import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const body = await request.json();

  try {
    switch (table) {
      case "Category":
        await prisma.category.upsert({
          where: { id: body.id },
          create: { id: body.id, name: body.name, parentId: body.parentId || null, userId: body.userId || null },
          update: { name: body.name, parentId: body.parentId || null, userId: body.userId || null },
        });
        break;
      case "Question":
        await prisma.question.upsert({
          where: { id: body.id },
          create: {
            id: body.id,
            categoryId: body.categoryId,
            question: body.question,
            options: typeof body.options === "string" ? JSON.parse(body.options) : body.options,
            correctAnswer: body.correctAnswer,
            difficulty: body.difficulty,
            imageUrl: body.imageUrl || null,
            type: body.type || "multiple_choice",
            userId: body.userId || null,
          },
          update: {
            categoryId: body.categoryId,
            question: body.question,
            options: typeof body.options === "string" ? JSON.parse(body.options) : body.options,
            correctAnswer: body.correctAnswer,
            difficulty: body.difficulty,
            imageUrl: body.imageUrl || null,
            type: body.type || "multiple_choice",
            userId: body.userId || null,
          },
        });
        break;
      default:
        return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(`Sync write error (${table}):`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
