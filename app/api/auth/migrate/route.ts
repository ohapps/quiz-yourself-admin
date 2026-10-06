import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;

export async function POST(request: Request) {
  if (!AUTH0_DOMAIN) {
    return NextResponse.json({ error: "AUTH0_DOMAIN not configured" }, { status: 500 });
  }

  const { deviceId, auth0Token } = await request.json();

  if (!deviceId || !auth0Token) {
    return NextResponse.json(
      { error: "deviceId and auth0Token are required" },
      { status: 400 }
    );
  }

  // Verify Auth0 token and extract user ID
  const userInfo = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
    headers: { Authorization: `Bearer ${auth0Token}` },
  });

  if (!userInfo.ok) {
    return NextResponse.json({ error: "Invalid Auth0 token" }, { status: 401 });
  }

  const info = await userInfo.json();
  const auth0UserId = info.sub;

  if (!auth0UserId) {
    return NextResponse.json({ error: "No user id in Auth0 token" }, { status: 401 });
  }

  // Migrate all user-created content from device ID to Auth0 ID
  const [catCount, qCount, favCount, reportCount] = await prisma.$transaction([
    prisma.category.updateMany({
      where: { userId: deviceId },
      data: { userId: auth0UserId },
    }),
    prisma.question.updateMany({
      where: { userId: deviceId },
      data: { userId: auth0UserId },
    }),
    prisma.favorite.updateMany({
      where: { userId: deviceId },
      data: { userId: auth0UserId },
    }),
    prisma.questionReport.updateMany({
      where: { userId: deviceId },
      data: { userId: auth0UserId },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    migrated: {
      categories: catCount.count,
      questions: qCount.count,
      favorites: favCount.count,
      reports: reportCount.count,
    },
  });
}
