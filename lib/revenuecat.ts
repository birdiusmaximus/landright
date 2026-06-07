"use client";

// Type-only import is erased at build time, so this module is safe to evaluate
// during SSR. The actual SDK is loaded lazily (client-only) inside the helpers.
import type { Purchases } from "@revenuecat/purchases-js";

// The entitlement identifier created in the RevenueCat dashboard (case-sensitive).
export const RC_ENTITLEMENT = "Plus";

const RC_KEY = process.env.NEXT_PUBLIC_REVENUECAT_WEB_BILLING_KEY ?? "";

// Track which app user the SDK is currently configured for, so we configure
// once and switch users (rather than re-configuring) when the Clerk user changes.
let currentUser: string | null = null;

/**
 * Ensure the RevenueCat Web SDK is configured for the given Clerk user id and
 * return the shared instance. Configures once; switches user thereafter.
 */
export async function ensurePurchases(appUserId: string): Promise<Purchases> {
  if (!RC_KEY) throw new Error("Missing NEXT_PUBLIC_REVENUECAT_WEB_BILLING_KEY");
  const { Purchases } = await import("@revenuecat/purchases-js");
  if (!Purchases.isConfigured()) {
    Purchases.configure({ apiKey: RC_KEY, appUserId });
    currentUser = appUserId;
  } else if (currentUser !== appUserId) {
    await Purchases.getSharedInstance().changeUser(appUserId);
    currentUser = appUserId;
  }
  return Purchases.getSharedInstance();
}

/** True if the customer currently has the Plus entitlement active. */
export async function hasPlus(appUserId: string): Promise<boolean> {
  const p = await ensurePurchases(appUserId);
  const info = await p.getCustomerInfo();
  return Boolean(info.entitlements.active[RC_ENTITLEMENT]);
}
