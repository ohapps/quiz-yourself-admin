import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.questionReport.update({
      where: { id },
      data: { resolved: true },
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(`Report resolve error (${id}):`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
