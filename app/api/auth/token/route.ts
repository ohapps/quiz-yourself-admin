import { NextResponse } from "next/server";
import * as crypto from "crypto";
import { getPrivateKey } from "@/lib/powersync-auth";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "dev--hkrho7z.us.auth0.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  // Check for Auth0 token in Authorization header
  const authHeader = request.headers.get("Authorization");
  const auth0Token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let resolvedUserId: string;

  if (auth0Token) {
    // Verify Auth0 token and extract user ID
    const userInfo = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${auth0Token}` },
    });

    if (!userInfo.ok) {
      return NextResponse.json({ error: "Invalid Auth0 token" }, { status: 401 });
    }

    const info = await userInfo.json();
    resolvedUserId = info.sub;
  } else if (userId) {
    // Fallback: anonymous device ID (for offline-first without login)
    resolvedUserId = userId;
  } else {
    return NextResponse.json({ error: "user_id or auth0_token is required" }, { status: 400 });
  }

  const privateKey = getPrivateKey();

  const header = { alg: "RS256", kid: "powersync-dev", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: resolvedUserId,
    aud: "powersync-dev",
    iat: now,
    exp: now + 3600,
    parameters: { user_id: resolvedUserId },
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const data = `${encode(header)}.${encode(payload)}`;
  const signature = crypto.sign("sha256", Buffer.from(data), privateKey);
  const token = `${data}.${signature.toString("base64url")}`;

  return NextResponse.json({ token, expiresAt: now + 3600, userId: resolvedUserId });
}
