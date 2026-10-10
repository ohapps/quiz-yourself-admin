import { createRemoteJWKSet, jwtVerify } from "jose";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks && AUTH0_DOMAIN) {
    jwks = createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));
  }
  return jwks;
}

interface CachedUser {
  userId: string;
  email?: string;
  expiresAt: number;
}

// In-memory token verification cache (5 minute TTL)
const tokenCache = new Map<string, CachedUser>();

export async function verifyMobileToken(token: string): Promise<{ userId: string; email?: string } | null> {
  if (!token || !AUTH0_DOMAIN) return null;

  const now = Date.now();
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > now) {
    return { userId: cached.userId, email: cached.email };
  }

  // 1. Try local JWKS verification
  try {
    const JWKS = getJWKS();
    if (JWKS) {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `https://${AUTH0_DOMAIN}/`,
      });
      if (payload.sub) {
        const user = { userId: payload.sub, email: payload.email as string | undefined };
        tokenCache.set(token, { ...user, expiresAt: now + 5 * 60 * 1000 });
        return user;
      }
    }
  } catch {
    // If JWKS verification fails (e.g. audience mismatch, opaque token, etc.), fall through to userinfo
  }

  // 2. Fall back to /userinfo endpoint
  try {
    const res = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.sub) {
        const user = { userId: data.sub, email: data.email };
        tokenCache.set(token, { ...user, expiresAt: now + 5 * 60 * 1000 });
        return user;
      }
    }
  } catch (err) {
    console.error("Token verification error:", err);
  }

  return null;
}

export async function getMobileAuth(request: Request): Promise<{ userId: string; email?: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return verifyMobileToken(token);
}
