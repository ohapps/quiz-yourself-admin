import { auth0 } from "@/lib/auth0";

export async function proxy(request: Request) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    // Protect everything except static files, _next internals, and public API
    "/((?!_next/static|_next/image|icon\\.svg|api/auth/jwks|api/auth/token|api/auth/migrate|api/sync).*)",
  ],
};
