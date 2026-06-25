import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params;
  const body = await request.json();

  try {
    switch (table) {
      case "Category":
        await prisma.category.update({ where: { id }, data: { name: body.name, parentId: body.parentId ?? undefined } });
        break;
      case "Question": {
        const data: any = { ...body };
        if (typeof data.options === "string") data.options = JSON.parse(data.options);
        delete data.id;
        await prisma.question.update({ where: { id }, data });
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
  _request: Request,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { table, id } = await params;

  try {
    switch (table) {
      case "Category":
        await prisma.category.delete({ where: { id } });
        break;
      case "Question":
        await prisma.question.delete({ where: { id } });
        break;
      case "Favorite":
        await prisma.favorite.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(`Sync delete error (${table}/${id}):`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
