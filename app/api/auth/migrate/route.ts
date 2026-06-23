import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "dev--hkrho7z.us.auth0.com";

export async function POST(request: Request) {
  const { deviceId, auth0UserId, auth0Token } = await request.json();

  if (!deviceId || !auth0UserId || !auth0Token) {
    return NextResponse.json(
      { error: "deviceId, auth0UserId, and auth0Token are required" },
      { status: 400 }
    );
  }

  // Verify the Auth0 token and confirm it matches the claimed user
  const userInfo = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
    headers: { Authorization: `Bearer ${auth0Token}` },
  });

  if (!userInfo.ok) {
    return NextResponse.json({ error: "Invalid Auth0 token" }, { status: 401 });
  }

  const info = await userInfo.json();
  if (info.sub !== auth0UserId) {
    return NextResponse.json({ error: "Token does not match claimed user" }, { status: 403 });
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
