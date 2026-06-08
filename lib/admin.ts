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

// Dev-only preview bypass. When NEXT_PUBLIC_DEV_PREVIEW=1 during local
// development, the auth gate, the onboarding funnel, and the API subscription
// check are all skipped — so the app can be viewed in the Claude preview window,
// which can't reach Clerk's clerk.accounts.dev domain. Hard-guarded: NODE_ENV is
// "production" on Vercel, so this is ALWAYS off in production regardless of the flag.
export const DEV_PREVIEW_BYPASS =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEV_PREVIEW === "1";

// Master switch for login + paywall.
//   OFF (default) → the app is fully free: no login, no paywall, anyone can use
//     it. This is how the public WEB app ships, so friends can try it freely.
//   ON  → login + the RevenueCat paywall are active. Used by the native
//     iOS/Android (Capacitor) builds, which must charge through the app stores.
// Turn it on for the native build with NEXT_PUBLIC_BILLING_ENABLED=1.
export const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === "1";

// True whenever the auth/paywall machinery must be skipped entirely — i.e.
// billing is off (free web app) OR we're in the Clerk-less dev preview. When
// true: no ClerkProvider, no SubscriptionGate, no API subscription check, no
// sign-in UI, and onboarding's trial CTAs lead straight into the free app.
export const AUTH_DISABLED = !BILLING_ENABLED || DEV_PREVIEW_BYPASS;
