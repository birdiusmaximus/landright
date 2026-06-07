// Server-side entitlement check. Imported only by API route handlers (never by
// client code), so the RevenueCat secret key stays on the server.
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";

const RC_SECRET = process.env.REVENUECAT_SECRET_KEY ?? "";
const ENTITLEMENT = "Plus";

/**
 * Live check of whether a RevenueCat customer (keyed by the Clerk user id) has
 * the active "Plus" entitlement. Reads from RevenueCat's REST API on every call
 * so a lapsed/cancelled subscription loses access immediately. Fails closed.
 */
export async function hasActivePlus(appUserId: string): Promise<boolean> {
  if (!RC_SECRET) {
    console.warn("REVENUECAT_SECRET_KEY is not set — denying access (fail closed).");
    return false;
  }
  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
      { headers: { Authorization: `Bearer ${RC_SECRET}` }, cache: "no-store" },
    );
    if (!res.ok) return false;
    const data = await res.json();
    const ent = data?.subscriber?.entitlements?.[ENTITLEMENT];
    if (!ent) return false;
    const expires: string | null | undefined = ent.expires_date;
    // null/undefined = non-expiring; otherwise active while the expiry is in the future.
    return expires == null || new Date(expires).getTime() > Date.now();
  } catch {
    return false; // network/parse error → fail closed
  }
}

/**
 * Guard for API route handlers. Returns the userId for a signed-in, subscribed
 * caller, or a ready-to-return NextResponse (401/403) otherwise.
 */
export async function requirePaid(): Promise<{ userId: string } | { error: NextResponse }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 }) };
  }
  if (isAdminUser(userId)) return { userId }; // admin allowlist bypasses the subscription
  if (!(await hasActivePlus(userId))) {
    return { error: NextResponse.json({ success: false, error: "An active subscription is required." }, { status: 403 }) };
  }
  return { userId };
}
