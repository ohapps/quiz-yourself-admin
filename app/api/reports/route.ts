import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { id, questionId, userId, description } = await request.json();

  if (!questionId || !userId || !description) {
    return NextResponse.json({ error: "questionId, userId, and description are required" }, { status: 400 });
  }

  await prisma.questionReport.create({
    data: { id: id || undefined, questionId, userId, description },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const reports = await prisma.questionReport.findMany({
    where: { resolved: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}
