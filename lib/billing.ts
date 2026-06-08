"use client";

// Unified billing layer.
//
//   • Web  → RevenueCat Web Billing (Stripe checkout) via @revenuecat/purchases-js
//   • iOS  → RevenueCat Capacitor plugin (App Store StoreKit) — required by Apple
//            for digital subscriptions inside a native app
//
// Both talk to the SAME RevenueCat project and the "Plus" entitlement, keyed by
// the Clerk user id, so a subscription bought on any platform is recognised
// everywhere. Call sites use the platform-agnostic `getBilling()` interface and
// never branch themselves.
import { ensurePurchases, RC_ENTITLEMENT } from "@/lib/revenuecat";

export { RC_ENTITLEMENT };

export interface Billing {
  /** Whether the customer currently has the active "Plus" entitlement. */
  hasPlus(): Promise<boolean>;
  /** Formatted monthly price (e.g. "£2.99"), or null if unavailable. */
  monthlyPrice(): Promise<string | null>;
  /** Run the monthly purchase. Resolves true if "Plus" is active afterwards. */
  purchaseMonthly(email?: string): Promise<boolean>;
}

// Running inside the native Capacitor shell? Detected via the bridge global that
// Capacitor injects on device — no import needed, so this is SSR-safe and adds
// nothing to the web bundle.
export function isNativeApp(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  );
}

export async function getBilling(appUserId: string): Promise<Billing> {
  return isNativeApp() ? nativeBilling(appUserId) : webBilling(appUserId);
}

// ── Web: RevenueCat Web Billing (Stripe) ────────────────────────────────────
async function webBilling(appUserId: string): Promise<Billing> {
  const p = await ensurePurchases(appUserId);
  return {
    async hasPlus() {
      const info = await p.getCustomerInfo();
      return Boolean(info.entitlements.active[RC_ENTITLEMENT]);
    },
    async monthlyPrice() {
      const offerings = await p.getOfferings();
      const monthly = offerings.current?.monthly;
      return monthly ? monthly.webBillingProduct.currentPrice.formattedPrice : null;
    },
    async purchaseMonthly(email?: string) {
      const offerings = await p.getOfferings();
      const monthly = offerings.current?.monthly;
      if (!monthly) throw new Error("No subscription is available right now.");
      await p.purchase({ rcPackage: monthly, customerEmail: email });
      const info = await p.getCustomerInfo();
      return Boolean(info.entitlements.active[RC_ENTITLEMENT]);
    },
  };
}

// ── Native (iOS): RevenueCat Capacitor plugin → App Store StoreKit ───────────
// Needs the platform-specific RevenueCat public SDK key (Apple keys start with
// "appl_"), set as NEXT_PUBLIC_REVENUECAT_IOS_KEY in the native build. The plugin
// is imported lazily so it never enters the web bundle.
const RC_IOS_KEY = process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY ?? "";
let nativeConfiguredFor: string | null = null;

async function nativeBilling(appUserId: string): Promise<Billing> {
  if (!RC_IOS_KEY) throw new Error("Missing NEXT_PUBLIC_REVENUECAT_IOS_KEY");
  const { Purchases } = await import("@revenuecat/purchases-capacitor");

  if (nativeConfiguredFor === null) {
    await Purchases.configure({ apiKey: RC_IOS_KEY, appUserID: appUserId });
    nativeConfiguredFor = appUserId;
  } else if (nativeConfiguredFor !== appUserId) {
    await Purchases.logIn({ appUserID: appUserId });
    nativeConfiguredFor = appUserId;
  }

  return {
    async hasPlus() {
      const { customerInfo } = await Purchases.getCustomerInfo();
      return Boolean(customerInfo.entitlements.active[RC_ENTITLEMENT]);
    },
    async monthlyPrice() {
      const offerings = await Purchases.getOfferings();
      const monthly = offerings.current?.monthly;
      return monthly ? monthly.product.priceString : null;
    },
    async purchaseMonthly() {
      const offerings = await Purchases.getOfferings();
      const monthly = offerings.current?.monthly;
      if (!monthly) throw new Error("No subscription is available right now.");
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: monthly });
      return Boolean(customerInfo.entitlements.active[RC_ENTITLEMENT]);
    },
  };
}
