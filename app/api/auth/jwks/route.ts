import { NextResponse } from "next/server";
import { getPublicKeyJwk } from "@/lib/powersync-auth";

export async function GET() {
  const jwk = getPublicKeyJwk();
  return NextResponse.json({ keys: [jwk] });
}
