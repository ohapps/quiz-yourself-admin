import { NextResponse } from "next/server";
import * as crypto from "crypto";
import { getPrivateKey } from "@/lib/powersync-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const privateKey = getPrivateKey();

  const header = { alg: "RS256", kid: "powersync-dev", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    aud: "powersync-dev",
    iat: now,
    exp: now + 3600,
    parameters: { user_id: userId },
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const data = `${encode(header)}.${encode(payload)}`;
  const signature = crypto.sign("sha256", Buffer.from(data), privateKey);
  const token = `${data}.${signature.toString("base64url")}`;

  return NextResponse.json({ token, expiresAt: now + 3600 });
}
