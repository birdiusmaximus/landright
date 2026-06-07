// Admin allowlist — Clerk user IDs that bypass the subscription requirement.
//
// Set NEXT_PUBLIC_ADMIN_USER_IDS="user_xxx,user_yyy" in .env.local (and Vercel).
// User IDs are opaque and not secret, and the check always runs against the
// Clerk-verified session user — so listing an id never grants access on its own;
// you must actually be signed in as that user.
const ADMIN_IDS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAdminUser(userId: string | null | undefined): boolean {
  return !!userId && ADMIN_IDS.includes(userId);
}
