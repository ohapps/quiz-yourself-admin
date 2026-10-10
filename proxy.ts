import { auth0 } from "@/lib/auth0";

export async function proxy(request: Request) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    // Protect web dashboard routes with Auth0 session middleware;
    // Exclude static assets, Next internals, and API endpoints (which manage their own auth & return JSON).
    "/((?!_next/static|_next/image|icon\\.svg|api/).*)",
  ],
};
