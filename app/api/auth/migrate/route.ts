import { NextResponse } from "next/server";
import * as crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getPublicKeyPem } from "@/lib/powersync-auth";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;

export async function POST(request: Request) {
  if (!AUTH0_DOMAIN) {
    return NextResponse.json({ error: "AUTH0_DOMAIN not configured" }, { status: 500 });
  }

  const { deviceToken, auth0Token } = await request.json();

  if (!deviceToken || !auth0Token) {
    return NextResponse.json(
      { error: "deviceToken and auth0Token are required" },
      { status: 400 }
    );
  }

  // Verify device ownership: validate the PowerSync JWT we issued for this device
  let deviceId: string;
  try {
    const [headerB64, payloadB64, signatureB64] = deviceToken.split(".");
    const publicKey = getPublicKeyPem();
    const data = `${headerB64}.${payloadB64}`;
    const signature = Buffer.from(signatureB64, "base64url");
    const valid = crypto.verify("sha256", Buffer.from(data), publicKey, signature);
    if (!valid) throw new Error("Invalid signature");

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    deviceId = payload.sub;
    if (!deviceId) throw new Error("No sub in token");
  } catch {
    return NextResponse.json({ error: "Invalid device token" }, { status: 401 });
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
