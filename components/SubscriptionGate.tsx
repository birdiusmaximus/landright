"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { ensurePurchases, RC_ENTITLEMENT } from "@/lib/revenuecat";
import { isAdminUser, DEV_PREVIEW_BYPASS } from "@/lib/admin";

const LIME = "#C6F634";
const INK = "#111110";
const DARK = "#1A1A17";
const DARK_MUTED = "#9A9A90";
const COND = "var(--font-cond), 'Arial Narrow', sans-serif";
const BODY = "var(--font-body), -apple-system, sans-serif";
const DISPLAY = "var(--font-display), 'Helvetica Neue', Arial, sans-serif";

type Status = "loading" | "signedOut" | "unsubscribed" | "subscribed" | "error";

const BULLETS = [
  "Turn difficult moments into connection, not distance",
  "More than 30 communication patterns",
  "Multiple routes for each message",
  "Line-by-line “why it works”",
];

/**
 * Gates its children behind a signed-in Clerk user with an active "Plus"
 * RevenueCat entitlement. Otherwise shows a sign-in prompt or the paywall.
 */
export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [status, setStatus] = useState<Status>("loading");
  const [priceLabel, setPriceLabel] = useState<string>("£2.99/month");
  const hasTrial = true; // our Stripe product includes the 3-day free trial
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (DEV_PREVIEW_BYPASS) { setStatus("subscribed"); return; } // local preview: skip the gate
    if (!isLoaded) return;
    if (!isSignedIn || !user) { setStatus("signedOut"); return; }
    if (isAdminUser(user.id)) { setStatus("subscribed"); return; } // admin allowlist bypasses the paywall
    try {
      const p = await ensurePurchases(user.id);
      const info = await p.getCustomerInfo();
      if (info.entitlements.active[RC_ENTITLEMENT]) { setStatus("subscribed"); return; }
      const offerings = await p.getOfferings();
      const monthly = offerings.current?.monthly;
      if (monthly) {
        const product = monthly.webBillingProduct;
        setPriceLabel(`${product.currentPrice.formattedPrice}/month`);
      }
      setStatus("unsubscribed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check your subscription.");
      setStatus("error");
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => { refresh(); }, [refresh]);

  const startTrial = useCallback(async () => {
    if (!user) return;
    setPurchasing(true); setError(null);
    try {
      const p = await ensurePurchases(user.id);
      const offerings = await p.getOfferings();
      const monthly = offerings.current?.monthly;
      if (!monthly) throw new Error("No subscription is available right now.");
      await p.purchase({ rcPackage: monthly, customerEmail: user.primaryEmailAddress?.emailAddress });
      const info = await p.getCustomerInfo();
      if (info.entitlements.active[RC_ENTITLEMENT]) setStatus("subscribed");
      else await refresh();
    } catch (e) {
      // RevenueCat throws on user cancellation — treat that as a no-op.
      const msg = e instanceof Error ? e.message : String(e);
      if (!/cancel/i.test(msg)) setError(msg);
    } finally {
      setPurchasing(false);
    }
  }, [user, refresh]);

  if (status === "subscribed") return <>{children}</>;

  // ── Shared shell for the gate states ───────────────────────────────────────
  const Card = ({ children: c }: { children: React.ReactNode }) => (
    <div className="surface-dark" style={{ border: `2px solid ${INK}`, boxShadow: `6px 6px 0 ${LIME}`, padding: "clamp(24px, 5vw, 40px)", maxWidth: 560 }}>{c}</div>
  );

  if (status === "loading") {
    return (
      <div style={{ padding: "40px 0", fontFamily: COND, fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", color: DARK_MUTED }}>
        Checking your access…
      </div>
    );
  }

  if (status === "signedOut") {
    return (
      <Card>
        <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", color: LIME, margin: 0 }}>Members only</p>
        <h2 style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.7rem, 5vw, 2.3rem)", lineHeight: 1, letterSpacing: "-0.02em", textTransform: "uppercase", color: "#FFFFFF", margin: "12px 0 14px" }}>Sign in to land your message right.</h2>
        <p style={{ fontFamily: BODY, fontSize: "1rem", lineHeight: 1.55, color: "#E8E8E2", margin: "0 0 22px" }}>Create an account or sign in to start your 3-day free trial.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <SignUpButton mode="modal">
            <button style={btn(true)}>Create account</button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button style={btn(false)}>Sign in</button>
          </SignInButton>
        </div>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card>
        <p style={{ fontFamily: BODY, fontSize: "1rem", lineHeight: 1.55, color: "#FFFFFF", margin: "0 0 16px" }}>We couldn’t check your subscription. {error}</p>
        <button style={btn(true)} onClick={() => { setStatus("loading"); refresh(); }}>Try again</button>
      </Card>
    );
  }

  // ── unsubscribed → paywall ─────────────────────────────────────────────────
  return (
    <Card>
      <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", color: LIME, margin: 0 }}>3 days free</p>
      <h2 style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.7rem, 5vw, 2.3rem)", lineHeight: 1, letterSpacing: "-0.02em", textTransform: "uppercase", color: "#FFFFFF", margin: "12px 0 16px" }}>Unlock the full toolkit.</h2>
      <div style={{ marginBottom: 22 }}>
        {BULLETS.map(b => (
          <div key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 9 }}>
            <span style={{ color: LIME, fontWeight: 900 }}>✓</span>
            <span style={{ fontFamily: BODY, fontSize: "0.96rem", lineHeight: 1.4, color: "#E8E8E2" }}>{b}</span>
          </div>
        ))}
      </div>
      <button style={{ ...btn(true), width: "100%", opacity: purchasing ? 0.6 : 1, cursor: purchasing ? "wait" : "pointer" }} onClick={startTrial} disabled={purchasing}>
        {purchasing ? "Opening checkout…" : "Start 3-day free trial"}
      </button>
      <p style={{ fontFamily: BODY, fontSize: "0.8rem", lineHeight: 1.5, color: DARK_MUTED, textAlign: "center", margin: "14px 0 0" }}>
        {hasTrial ? "3 days free, then " : ""}{priceLabel}, auto-renewing. Cancel anytime.
      </p>
      {error && <p style={{ fontFamily: BODY, fontSize: "0.82rem", lineHeight: 1.5, color: "#FF8A8A", textAlign: "center", margin: "10px 0 0" }}>{error}</p>}
    </Card>
  );
}

// Brand button: lime (primary) or outline, both brutalist with an ink/lime edge.
function btn(primary: boolean): React.CSSProperties {
  return {
    fontFamily: COND, fontWeight: 900, fontSize: "1.02rem", letterSpacing: "0.05em",
    textTransform: "uppercase", padding: "14px 24px", borderRadius: 0, cursor: "pointer",
    border: `2px solid ${primary ? INK : LIME}`,
    backgroundColor: primary ? LIME : "transparent",
    color: primary ? INK : "#FFFFFF",
    boxShadow: primary ? `4px 4px 0 ${INK}` : `4px 4px 0 ${LIME}`,
  };
}
