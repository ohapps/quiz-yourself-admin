import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth-utils";
import { getMobileAuth } from "@/lib/auth-mobile";

export async function POST(request: NextRequest) {
  try {
    const { id, questionId, userId: requestedUserId, description } = await request.json();

    if (!questionId || !description) {
      return NextResponse.json(
        { error: "questionId and description are required" },
        { status: 400 }
      );
    }

    // Verify question exists
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Determine user ID: from mobile auth token if present, else body userId or "anonymous"
    const mobileAuth = await getMobileAuth(request);
    const userId = mobileAuth?.userId || requestedUserId || "anonymous";

    await prisma.questionReport.create({
      data: {
        id: id || undefined,
        questionId,
        userId,
        description,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Report creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await prisma.questionReport.findMany({
    where: { resolved: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}
