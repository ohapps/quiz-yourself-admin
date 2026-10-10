import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/auth-mobile";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  const body = await request.json().catch(() => ({}));
  const { deviceId, auth0Token } = body;
  const token = bearerToken || auth0Token;

  if (!deviceId || !token) {
    return NextResponse.json(
      { error: "deviceId and auth0Token (or Bearer Authorization header) are required" },
      { status: 400 }
    );
  }

  // Verify Auth0 token and extract user ID
  const auth = await verifyMobileToken(token);
  if (!auth?.userId) {
    return NextResponse.json({ error: "Invalid Auth0 token" }, { status: 401 });
  }

  const auth0UserId = auth.userId;

  // Migrate all user-created content from device ID to Auth0 ID
  const migrated = await prisma.$transaction(async (tx) => {
    const catRes = await tx.category.updateMany({
      where: { userId: deviceId },
      data: { userId: auth0UserId },
    });

    const qRes = await tx.question.updateMany({
      where: { userId: deviceId },
      data: { userId: auth0UserId },
    });

    // Resolve any duplicate favorites before re-assigning userId
    // 1. Delete any favorites on deviceId that the user already has under auth0UserId
    const existingUserFavorites = await tx.favorite.findMany({
      where: { userId: auth0UserId },
      select: { categoryId: true },
    });
    const existingCategoryIds = existingUserFavorites.map((f) => f.categoryId);

    if (existingCategoryIds.length > 0) {
      await tx.favorite.deleteMany({
        where: {
          userId: deviceId,
          categoryId: { in: existingCategoryIds },
        },
      });
    }

    // 2. In case deviceId has duplicate category favorites itself, deduplicate them
    const deviceFavorites = await tx.favorite.findMany({
      where: { userId: deviceId },
    });
    const seenCategories = new Set<string>();
    const duplicateIdsToDelete: string[] = [];
    for (const f of deviceFavorites) {
      if (seenCategories.has(f.categoryId)) {
        duplicateIdsToDelete.push(f.id);
      } else {
        seenCategories.add(f.categoryId);
      }
    }
    if (duplicateIdsToDelete.length > 0) {
      await tx.favorite.deleteMany({
        where: { id: { in: duplicateIdsToDelete } },
      });
    }

    const favRes = await tx.favorite.updateMany({
      where: { userId: deviceId },
      data: { userId: auth0UserId },
    });

    const reportRes = await tx.questionReport.updateMany({
      where: { userId: deviceId },
      data: { userId: auth0UserId },
    });

    const historyRes = await tx.quizHistory.updateMany({
      where: { userId: deviceId },
      data: { userId: auth0UserId },
    });

    return {
      categories: catRes.count,
      questions: qRes.count,
      favorites: favRes.count,
      reports: reportRes.count,
      quizHistory: historyRes.count,
    };
  });

  return NextResponse.json({
    ok: true,
    migrated,
  });
}
