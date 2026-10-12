import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Check if a user's email is in the allowed list.
 * The allow-list is defined in the ALLOWED_EMAILS env var as a comma-separated string.
 */
export function isAllowedEmail(email: string | undefined | null): boolean {
  if (!email) return false;

  const allowedEmails = process.env.ALLOWED_EMAILS || "";
  const allowList = allowedEmails
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowList.includes(email.toLowerCase());
}

/**
 * Require an authenticated and authorized user.
 * Redirects to login if no session exists, or to /unauthorized if the user's
 * email is not on the allow-list. Returns the session for use in the page.
 */
export async function requireAuth() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!isAllowedEmail(session.user.email)) {
    redirect("/unauthorized");
  }

  return session;
}

/**
 * Get the current admin session for route handlers / API endpoints.
 * Returns null if unauthenticated or not on the allow-list.
 */
export async function getAdminSession(req?: NextRequest) {
  try {
    const session = req ? await auth0.getSession(req) : await auth0.getSession();
    if (!session || !isAllowedEmail(session.user.email)) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
