import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.questionReport.update({
    where: { id },
    data: { resolved: true },
  });
  return NextResponse.json({ ok: true });
}
