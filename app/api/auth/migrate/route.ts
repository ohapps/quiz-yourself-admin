import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { deviceId, auth0UserId } = await request.json();

  if (!deviceId || !auth0UserId) {
    return NextResponse.json({ error: "deviceId and auth0UserId are required" }, { status: 400 });
  }

  // Migrate all user-created content from device ID to Auth0 ID
  const [catCount, qCount] = await prisma.$transaction([
    prisma.category.updateMany({
      where: { userId: deviceId },
      data: { userId: auth0UserId },
    }),
    prisma.question.updateMany({
      where: { userId: deviceId },
      data: { userId: auth0UserId },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    migrated: { categories: catCount.count, questions: qCount.count },
  });
}
