"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { APP_VERSION } from "@/lib/version";

// ─── Brand tokens (mirror app/page.tsx — same design system) ──────────────────

const LIME = "#C6F634";
const INK = "#111110";
const GROUND = "#E4E4DF";
const GROUND2 = "#DBDBD5";
const MUTED = "#6E6E66";
const DARK = "#1A1A17";
const DARK_MUTED = "#9A9A90";
const DISPLAY = "var(--font-display), 'Helvetica Neue', Arial, sans-serif";
const COND = "var(--font-cond), 'Arial Narrow', sans-serif";
const BODY = "var(--font-body), -apple-system, sans-serif";

// ─── Onboarding state types ───────────────────────────────────────────────────

type MessageContext = "apology" | "boundary" | "reassurance" | "vulnerable_truth" | "conflict" | "something_else";
type ReceiverRisk = "harsh" | "needy" | "cold" | "vague" | "defensive" | "long";
type DesiredLanding = "care" | "apology" | "limit" | "change" | "non_attack" | "clarity";

interface OnboardingState {
  message_context: MessageContext | null;
  receiver_risk: ReceiverRisk | null;
  desired_landing: DesiredLanding | null;
  depth_preference: "rationale";
  demo_id: string;
  selected_route: "route_a" | "route_b" | "none";
}

// Paywall placement: freemium one-message preview (paywall after first output).
const PAYWALL_VARIANT: "freemium_preview" | "after_demo" = "freemium_preview";

// ─── Screen order ─────────────────────────────────────────────────────────────

const SCREENS = [
  "splash_brand",
  "opening_promise",
  "relationship_wedge",
  "situation_cards",
  "fear_friction",
  "desired_landing",
  "method_bridge",
  "demo_raw_thought",
  "two_routes_demo",
  "why_this_works",
  "try_yours",
  "onboarding_paywall",
] as const;
type ScreenId = (typeof SCREENS)[number];

// ─── Diagnostic data ──────────────────────────────────────────────────────────

const SITUATIONS: { value: MessageContext; title: string; body: string }[] = [
  { value: "apology", title: "Apology", body: "I need to apologise without making excuses." },
  { value: "boundary", title: "Boundary", body: "I need to say no without sounding cruel." },
  { value: "reassurance", title: "Reassurance", body: "I care, but I don't know how to say it well." },
  { value: "vulnerable_truth", title: "Vulnerable truth", body: "I need to be honest, but it feels exposed." },
  { value: "conflict", title: "Conflict", body: "I need to say this without starting a fight." },
  { value: "something_else", title: "Something else", body: "I just need help making it land." },
];

const FEARS: { value: ReceiverRisk; label: string }[] = [
  { value: "harsh", label: "Too harsh" },
  { value: "needy", label: "Too needy" },
  { value: "cold", label: "Too cold" },
  { value: "vague", label: "Too vague" },
  { value: "defensive", label: "Too defensive" },
  { value: "long", label: "Too long" },
];

const LANDINGS: { value: DesiredLanding; label: string }[] = [
  { value: "care", label: "I care" },
  { value: "apology", label: "I'm sorry" },
  { value: "limit", label: "I need a limit" },
  { value: "change", label: "I want this to change" },
  { value: "non_attack", label: "I'm not attacking you" },
  { value: "clarity", label: "I need clarity" },
];

// Per-context route labels (user-facing) + the demo id used for the showcase.
const CONTEXT_ROUTES: Record<MessageContext, { aLabel: string; bLabel: string; demoId: string }> = {
  apology: { aLabel: "Clear accountability", bLabel: "Warmer repair", demoId: "apology_no_excuse" },
  boundary: { aLabel: "Kind boundary", bLabel: "Clean boundary", demoId: "boundary_no" },
  reassurance: { aLabel: "Specific reassurance", bLabel: "Short warmth", demoId: "reassurance_care" },
  vulnerable_truth: { aLabel: "Plain honesty", bLabel: "Soft runway", demoId: "truth_exposed" },
  conflict: { aLabel: "Lower-defence", bLabel: "Clear request", demoId: "conflict_unheard" },
  something_else: { aLabel: "Clear and careful", bLabel: "Warmer route", demoId: "general" },
};

// A "version you probably wouldn't send" — seeds the try-yours sample.
const SAMPLES: Record<MessageContext, string> = {
  apology: "I already said sorry, what more do you want from me.",
  boundary: "I can't keep dropping everything every time you need something.",
  reassurance: "Obviously I care, I don't know why you keep asking.",
  vulnerable_truth: "I've been pretending I'm fine but I'm really not.",
  conflict: "You never listen to me. I'm tired of repeating myself.",
  something_else: "I don't even know how to say this without it coming out wrong.",
};

// The fixed showcase demo (conflict / feeling unheard). Straight apostrophes so
// the highlight spans match the message text exactly.
const DEMO = {
  raw: "You never listen to me. I'm tired of repeating myself.",
  routeA: {
    label: "Direct but gentle",
    desc: "Keeps the point clear while lowering blame.",
    text: "I'm feeling unheard, and I don't want this to turn into a fight. When I have to repeat the same thing a few times, I start to feel like it doesn't matter. Can we slow down and talk through it properly?",
    highlights: [
      { span: "I'm feeling unheard", operator: "Owned feeling", why: "Turns “you never listen” into an owned feeling. This lowers blame while keeping the real issue visible." },
      { span: "I don't want this to turn into a fight", operator: "Lower-defence opening", why: "Names the shared risk and signals constructive intent before the harder point lands." },
      { span: "When I have to repeat the same thing a few times", operator: "Concrete example", why: "Uses a concrete example instead of a global character claim." },
      { span: "Can we slow down and talk through it properly?", operator: "Clear request", why: "Turns frustration into a doable request." },
    ],
  },
  routeB: {
    label: "Warmer with runway",
    desc: "Creates emotional context before the hard point lands.",
    text: "I want to say this carefully because I care about us, not because I want to blame you. Lately, when I feel like I'm repeating myself, I've been feeling a bit alone in the conversation. I'd really like us to find a way to pause and listen to each other before it builds up.",
  },
} as const;

const WHY_BULLETS = [
  "Accusation becomes owned feeling.",
  "The ask becomes specific.",
  "The opening lowers defensiveness.",
];

const PAYWALL = {
  headline: "Unlock the full communication toolkit.",
  subcopy: "Get more message routes, line-by-line explanations, and saved patterns for the conversations that matter.",
  bullets: [
    "30+ communication patterns",
    "Two strategic routes for each message",
    "Line-by-line “why it works”",
    "Save and revisit important messages",
    "Generate more routes when the first one is not quite right",
  ],
};

// ─── Analytics (placeholder — no raw message text ever leaves the client) ──────

function emit(event: string, props: Record<string, unknown>) {
  // Replace with a real analytics sink. Never include raw user text — only
  // derived categories and length/count metadata.
  const w = window as unknown as { analytics?: { track?: (e: string, p: unknown) => void } };
  if (w.analytics?.track) w.analytics.track(event, props);
  else if (process.env.NODE_ENV !== "production") console.debug("[analytics]", event, props);
}

// ─── Primitives (same visual language as the app) ─────────────────────────────

function CTA({ children, onClick, disabled, variant = "lime", full = true }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "lime" | "ink" | "ghost"; full?: boolean }) {
  const [pressed, setPressed] = useState(false);
  const look = {
    lime: { bg: LIME, color: INK, border: INK, shadow: INK },
    ink: { bg: INK, color: LIME, border: INK, shadow: LIME },
    ghost: { bg: "transparent", color: "inherit", border: "currentColor", shadow: "currentColor" },
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        fontFamily: COND, fontWeight: 900, fontSize: "1.05rem", letterSpacing: "0.05em",
        textTransform: "uppercase", border: `2px solid ${disabled ? MUTED : look.border}`, padding: "17px 28px",
        width: full ? "100%" : undefined, cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor: disabled ? "rgba(120,120,120,0.2)" : look.bg, color: disabled ? MUTED : look.color,
        boxShadow: disabled ? "none" : pressed ? `0 0 0 ${look.shadow}` : `4px 4px 0 ${look.shadow}`,
        transform: pressed ? "translate(4px,4px)" : "none", transition: "transform .1s ease, box-shadow .1s ease",
        borderRadius: 0,
      }}
    >
      {children}
    </button>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.8rem", letterSpacing: "0.18em", textTransform: "uppercase", color: LIME, marginBottom: 14 }}>
      {children}
    </p>
  );
}

const H1: React.CSSProperties = {
  fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(2.1rem, 8vw, 3.2rem)",
  lineHeight: 0.95, letterSpacing: "-0.03em", textTransform: "uppercase", margin: 0,
};

// Selectable diagnostic card (situation / fear / landing). Lifts gently on press.
function OptionCard({ title, body, selected, onClick }: { title: string; body?: string; selected: boolean; onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      aria-pressed={selected}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer", borderRadius: 0,
        border: `2px solid ${selected ? LIME : "rgba(255,255,255,0.28)"}`,
        backgroundColor: selected ? "rgba(198,246,52,0.10)" : "transparent",
        padding: body ? "16px 18px" : "15px 18px",
        boxShadow: selected ? `4px 4px 0 ${LIME}` : "none",
        transform: pressed ? "translate(2px,2px)" : "none",
        transition: "transform .1s ease, box-shadow .1s ease, border-color .12s ease, background-color .12s ease",
      }}
    >
      <span style={{ display: "block", fontFamily: DISPLAY, fontWeight: 900, fontSize: body ? "1.15rem" : "1rem", letterSpacing: "-0.01em", textTransform: "uppercase", color: selected ? LIME : "#FFFFFF" }}>
        {title}
      </span>
      {body && (
        <span style={{ display: "block", fontFamily: BODY, fontSize: "0.95rem", lineHeight: 1.4, color: "#C7C9BD", marginTop: 6 }}>
          {body}
        </span>
      )}
    </button>
  );
}

// Strategic route card (demo + generated output). Premium, not "AI output".
function RouteCard({ label, desc, text, active, onClick }: { label: string; desc?: string; text: string; active?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${active ? LIME : "rgba(255,255,255,0.22)"}`,
        boxShadow: active ? `6px 6px 0 ${LIME}` : "none",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow .15s ease, border-color .15s ease",
      }}
    >
      <div style={{ borderBottom: `2px solid ${active ? LIME : "rgba(255,255,255,0.22)"}`, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 9, height: 9, backgroundColor: LIME, flexShrink: 0 }} />
        <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "1.05rem", letterSpacing: "-0.01em", textTransform: "uppercase", color: "#FFFFFF" }}>{label}</span>
      </div>
      <div style={{ padding: "18px" }}>
        <p style={{ fontFamily: BODY, fontSize: "1.02rem", lineHeight: 1.75, color: "#FFFFFF", margin: 0 }}>{text}</p>
        {desc && (
          <p style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.04em", textTransform: "uppercase", color: DARK_MUTED, marginTop: 14, marginBottom: 0 }}>{desc}</p>
        )}
      </div>
    </div>
  );
}

// ─── Screen frame: progress + back + V0.1 link back to the app ────────────────

function Frame({ bg = "ground", index, onBack, children }: { bg?: "ground" | "dark"; index: number; onBack?: () => void; children: React.ReactNode }) {
  const dark = bg === "dark";
  const pct = Math.round((index / (SCREENS.length - 1)) * 100);
  return (
    <div className={dark ? "surface-dark" : undefined} style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: dark ? DARK : GROUND, color: dark ? "#FFFFFF" : INK, padding: "clamp(18px, 5vw, 36px)" }}>
      <div style={{ width: "100%", maxWidth: 540, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "clamp(22px, 6vw, 40px)" }}>
          {onBack ? (
            <button onClick={onBack} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: COND, fontWeight: 900, fontSize: "1.2rem", padding: 0, lineHeight: 1 }}>←</button>
          ) : <span style={{ width: 12 }} />}
          <div style={{ flex: 1, height: 6, backgroundColor: dark ? "rgba(255,255,255,0.14)" : GROUND2, border: `1px solid ${dark ? "rgba(255,255,255,0.25)" : INK}` }}>
            <div style={{ height: "100%", width: `${pct}%`, backgroundColor: LIME, transition: "width .35s cubic-bezier(.22,1,.36,1)" }} />
          </div>
          {/* V0.1 — link back to the app */}
          <a href="/" aria-label="Back to Landright" style={{ textDecoration: "none" }}>
            <span style={{ display: "inline-block", fontFamily: COND, fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.07em", textTransform: "uppercase", padding: "4px 9px", lineHeight: 1.1, border: `2px solid ${dark ? LIME : INK}`, color: dark ? LIME : INK }}>
              v{APP_VERSION}
            </span>
          </a>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Highlighted message helper ───────────────────────────────────────────────

type Seg = { text: string; hi: number | null };
function segmentMessage(text: string, spans: readonly string[]): Seg[] {
  const segs: Seg[] = [];
  let rest = text;
  spans.forEach((span, i) => {
    const at = rest.indexOf(span);
    if (at === -1) return;
    if (at > 0) segs.push({ text: rest.slice(0, at), hi: null });
    segs.push({ text: span, hi: i });
    rest = rest.slice(at + span.length);
  });
  if (rest) segs.push({ text: rest, hi: null });
  return segs;
}

// Light screens vs dark "moment" screens — same rhythm as the app.
function frameBg(screen: ScreenId): "ground" | "dark" {
  const light: ScreenId[] = ["opening_promise"];
  return light.includes(screen) ? "ground" : "dark";
}

// Simple centered headline+sub+CTA screen body.
function ScreenBody({ headline, sub, cta, onCta }: { headline: string; sub: string; cta: string; onCta: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <h1 style={{ ...H1, color: INK, fontSize: "clamp(2rem, 7.5vw, 3rem)", marginBottom: 22 }}>{headline}</h1>
      <p style={{ fontFamily: BODY, fontSize: "1.1rem", lineHeight: 1.55, color: INK, marginBottom: 34 }}>{sub}</p>
      <CTA onClick={onCta} variant="ink">{cta}</CTA>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const screen: ScreenId = SCREENS[index];

  const [state, setState] = useState<OnboardingState>({
    message_context: null,
    receiver_risk: null,
    desired_landing: null,
    depth_preference: "rationale",
    demo_id: "conflict_unheard",
    selected_route: "none",
  });

  const [routeView, setRouteView] = useState<"a" | "b">("a");
  const [comparedB, setComparedB] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [activeHi, setActiveHi] = useState<number | null>(null);
  const openedHi = useRef<Set<number>>(new Set());
  const [userMsg, setUserMsg] = useState("");
  const [genState, setGenState] = useState<"idle" | "loading" | "done">("idle");
  const [gen, setGen] = useState<{ a: string | null; b: string | null; aLabel?: string; bLabel?: string }>({ a: null, b: null });

  // Base analytics props (derived categories only — never raw text).
  const fire = useCallback((event: string, extra: Record<string, unknown> = {}) => {
    emit(event, {
      screen_id: SCREENS[index],
      screen_index: index,
      message_context: state.message_context,
      receiver_risk: state.receiver_risk,
      desired_landing: state.desired_landing,
      demo_id: state.demo_id,
      ...extra,
    });
  }, [index, state.message_context, state.receiver_risk, state.desired_landing, state.demo_id]);

  // Fire screen_viewed + one-time per-screen events on each step.
  useEffect(() => {
    if (screen === "splash_brand") fire("onboarding_started");
    fire("screen_viewed");
    if (screen === "relationship_wedge") fire("wedge_viewed");
    if (screen === "demo_raw_thought") fire("demo_started", { demo_id: state.demo_id });
    if (screen === "two_routes_demo") fire("demo_route_compared", { route_a: "direct_but_gentle", route_b: "warmer_with_runway" });
    if (screen === "try_yours") fire("try_message_started");
    if (screen === "onboarding_paywall") fire("paywall_viewed", { paywall_variant: PAYWALL_VARIANT });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Splash auto-advance.
  useEffect(() => {
    if (screen !== "splash_brand") return;
    const t = setTimeout(() => setIndex(i => (SCREENS[i] === "splash_brand" ? i + 1 : i)), 1500);
    return () => clearTimeout(t);
  }, [screen]);

  // Screen 9: reveal highlights one by one.
  useEffect(() => {
    if (screen !== "why_this_works") return;
    setRevealed(0); setActiveHi(null); openedHi.current = new Set();
    const timers: ReturnType<typeof setTimeout>[] = [];
    DEMO.routeA.highlights.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealed(n => Math.max(n, i + 1)), 350 + i * 420));
    });
    return () => timers.forEach(clearTimeout);
  }, [screen]);

  const next = () => setIndex(i => Math.min(i + 1, SCREENS.length - 1));
  const back = () => setIndex(i => Math.max(i - 1, 0));

  function choose<K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) {
    setState(s => ({ ...s, [key]: value }));
  }

  function openHighlight(i: number) {
    setActiveHi(i);
    openedHi.current.add(i);
    fire("rationale_opened", { highlight_count: openedHi.current.size });
  }

  const stateForStorage = useCallback(
    () => ({ message_context: state.message_context, receiver_risk: state.receiver_risk, desired_landing: state.desired_landing }),
    [state.message_context, state.receiver_risk, state.desired_landing]
  );

  function finish() {
    try {
      localStorage.setItem("landright_onboarding", JSON.stringify({ done: true, ...stateForStorage(), at: new Date().toISOString() }));
    } catch { /* ignore */ }
    fire("onboarding_completed");
    router.push("/");
  }

  // Screen 10 → generate the user's own message (free preview), then paywall.
  async function generateMine() {
    const msg = userMsg.trim();
    if (msg.length < 8) return;
    fire("user_message_submitted", { chars: msg.length });
    setGenState("loading");
    setGen({ a: null, b: null });
    const call = (which: "a" | "b") =>
      fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Onboarding context travels with the request (server ignores unknown keys).
        body: JSON.stringify({ raw_input: msg, which, onboarding: stateForStorage() }),
      }).then(r => r.json());
    const pa = call("a");
    const pb = call("b");
    try {
      const da = await pa;
      if (da.success) {
        setGen(g => ({ ...g, a: da.option.option, aLabel: da.option.stack_label }));
        setGenState("done");
        fire("output_generated", { route: "a", route_a_label: da.option.stack_label });
      } else { setGenState("idle"); return; }
    } catch { setGenState("idle"); return; }
    try {
      const db = await pb;
      if (db.success) setGen(g => ({ ...g, b: db.option.option, bLabel: db.option.stack_label }));
    } catch { /* B is a bonus; ignore */ }
  }

  const labels = state.message_context ? CONTEXT_ROUTES[state.message_context] : CONTEXT_ROUTES.conflict;
  const showBack = index > 0 && screen !== "onboarding_paywall";

  return (
    <Frame bg={frameBg(screen)} index={index} onBack={showBack ? back : undefined}>
      {/* ── 0 · SPLASH ── */}
      {screen === "splash_brand" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(2.4rem, 11vw, 3.6rem)", letterSpacing: "-0.03em", color: "#FFFFFF", marginBottom: 18 }}>LANDRIGHT</span>
          <p style={{ fontFamily: BODY, fontSize: "1.05rem", lineHeight: 1.5, color: "#C7C9BD", maxWidth: 340 }}>
            Say what you mean in a way that lands.
          </p>
          <div style={{ marginTop: 34, width: "100%", maxWidth: 320 }}>
            <CTA onClick={next} variant="lime">Continue</CTA>
          </div>
        </div>
      )}

      {/* ── 1 · OPENING PROMISE ── */}
      {screen === "opening_promise" && (
        <ScreenBody
          headline="Some messages are hard because they can change the room."
          sub="LANDRIGHT helps you shape the thought before you send it."
          cta="Continue" onCta={next}
        />
      )}

      {/* ── 2 · RELATIONSHIP WEDGE ── */}
      {screen === "relationship_wedge" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Eyebrow>For the moment before you send it</Eyebrow>
          <div style={{ border: "2px solid rgba(255,255,255,0.22)", padding: "22px 20px", marginBottom: 30 }}>
            <p style={{ fontFamily: BODY, fontSize: "1.25rem", lineHeight: 1.5, color: "#FFFFFF", margin: 0 }}>
              &ldquo;I need to say this, but I&rsquo;m afraid it will land wrong.&rdquo;
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CTA onClick={next} variant="lime">That&rsquo;s me</CTA>
            <CTA onClick={next} variant="ghost">Show me</CTA>
          </div>
        </div>
      )}

      {/* ── 3 · SITUATION CARDS ── */}
      {screen === "situation_cards" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h1 style={{ ...H1, color: "#FFFFFF", fontSize: "clamp(1.7rem, 6.5vw, 2.3rem)", lineHeight: 1.02, marginBottom: 24 }}>
            What kind of message are you hesitating over?
          </h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {SITUATIONS.map(s => (
              <OptionCard
                key={s.value} title={s.title} body={s.body} selected={state.message_context === s.value}
                onClick={() => {
                  choose("message_context", s.value);
                  choose("demo_id", CONTEXT_ROUTES[s.value].demoId);
                  fire("situation_selected", { message_context: s.value });
                  setTimeout(next, 200);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 4 · FEAR / FRICTION ── */}
      {screen === "fear_friction" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {state.message_context && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ display: "inline-block", fontFamily: COND, fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: INK, backgroundColor: LIME, padding: "5px 10px" }}>
                {SITUATIONS.find(s => s.value === state.message_context)?.title}
              </span>
            </div>
          )}
          <h1 style={{ ...H1, color: "#FFFFFF", fontSize: "clamp(1.7rem, 6.5vw, 2.3rem)", lineHeight: 1.02, marginBottom: 24 }}>
            What are you most worried it will sound like?
          </h1>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            {FEARS.map(f => (
              <OptionCard
                key={f.value} title={f.label} selected={state.receiver_risk === f.value}
                onClick={() => {
                  choose("receiver_risk", f.value);
                  fire("fear_selected", { receiver_risk: f.value });
                  setTimeout(next, 220);
                }}
              />
            ))}
          </div>
          <p style={{ fontFamily: BODY, fontSize: "0.9rem", color: DARK_MUTED, marginTop: 18 }}>
            Good — we&rsquo;ll shape the message around that risk.
          </p>
        </div>
      )}

      {/* ── 5 · DESIRED LANDING ── */}
      {screen === "desired_landing" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h1 style={{ ...H1, color: "#FFFFFF", fontSize: "clamp(1.7rem, 6.5vw, 2.3rem)", lineHeight: 1.02, marginBottom: 24 }}>
            What do you want the other person to understand?
          </h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {LANDINGS.map(l => (
              <OptionCard
                key={l.value} title={l.label} selected={state.desired_landing === l.value}
                onClick={() => {
                  choose("desired_landing", l.value);
                  fire("landing_selected", { desired_landing: l.value });
                  setTimeout(next, 220);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 6 · METHOD BRIDGE ── */}
      {screen === "method_bridge" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ ...H1, color: "#FFFFFF", fontSize: "clamp(1.9rem, 7vw, 2.6rem)", marginBottom: 18 }}>
            LANDRIGHT does not just rewrite.
          </h1>
          <p style={{ fontFamily: BODY, fontSize: "1.08rem", lineHeight: 1.55, color: "#E8E8E2", marginBottom: 26 }}>
            It chooses a communication route — based on what you&rsquo;re trying to say, what could go wrong, and how you want it to land.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 30 }}>
            <div style={{ border: "2px solid rgba(255,255,255,0.22)", padding: "16px" }}>
              <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.74rem", letterSpacing: "0.08em", textTransform: "uppercase", color: DARK_MUTED, margin: 0 }}>Generic AI</p>
              <p style={{ fontFamily: BODY, fontSize: "0.98rem", lineHeight: 1.4, color: "#C7C9BD", marginTop: 8, marginBottom: 0 }}>&ldquo;Make this nicer.&rdquo;</p>
            </div>
            <div style={{ border: `2px solid ${LIME}`, padding: "16px", boxShadow: `4px 4px 0 ${LIME}` }}>
              <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.74rem", letterSpacing: "0.08em", textTransform: "uppercase", color: LIME, margin: 0 }}>LANDRIGHT</p>
              <p style={{ fontFamily: BODY, fontSize: "0.98rem", lineHeight: 1.4, color: "#FFFFFF", marginTop: 8, marginBottom: 0 }}>Conflict → lower-defence route / clear-request route</p>
            </div>
          </div>
          <CTA onClick={next} variant="lime">Show me</CTA>
        </div>
      )}

      {/* ── 7 · DEMO RAW THOUGHT ── */}
      {screen === "demo_raw_thought" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Eyebrow>Raw thought</Eyebrow>
          <div style={{ border: "2px dashed rgba(255,255,255,0.3)", padding: "22px 20px", marginBottom: 30 }}>
            <p style={{ fontFamily: BODY, fontSize: "1.2rem", lineHeight: 1.5, color: "#E8E8E2", margin: 0 }}>
              &ldquo;{DEMO.raw}&rdquo;
            </p>
          </div>
          <CTA onClick={next} variant="lime">See two routes</CTA>
        </div>
      )}

      {/* ── 8 · TWO STRATEGIC ROUTES ── */}
      {screen === "two_routes_demo" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h1 style={{ ...H1, color: "#FFFFFF", fontSize: "clamp(1.8rem, 6.5vw, 2.4rem)", marginBottom: 10 }}>Different routes. Different landing.</h1>
          <p style={{ fontFamily: BODY, fontSize: "1rem", lineHeight: 1.5, color: "#C7C9BD", marginBottom: 22 }}>The same thought can be shaped in more than one way.</p>
          <div style={{ display: "flex", gap: 0, marginBottom: 18, border: `2px solid ${LIME}` }}>
            {(["a", "b"] as const).map(r => (
              <button key={r} onClick={() => { setRouteView(r); if (r === "b" && !comparedB) { setComparedB(true); fire("demo_route_compared", { viewed: "route_b" }); } }}
                style={{ flex: 1, fontFamily: COND, fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.05em", textTransform: "uppercase", padding: "11px 8px", cursor: "pointer", border: "none", borderRadius: 0, backgroundColor: routeView === r ? LIME : "transparent", color: routeView === r ? INK : "#FFFFFF" }}>
                {r === "a" ? DEMO.routeA.label : DEMO.routeB.label}
              </button>
            ))}
          </div>
          <RouteCard
            label={routeView === "a" ? DEMO.routeA.label : DEMO.routeB.label}
            desc={routeView === "a" ? DEMO.routeA.desc : DEMO.routeB.desc}
            text={routeView === "a" ? DEMO.routeA.text : DEMO.routeB.text}
            active
          />
          <div style={{ marginTop: 24 }}>
            <CTA onClick={next} variant="lime">Show why this works</CTA>
          </div>
        </div>
      )}

      {/* ── 9 · WHY THIS WORKS / HIGHLIGHTS ── */}
      {screen === "why_this_works" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h1 style={{ ...H1, color: "#FFFFFF", fontSize: "clamp(1.8rem, 6.5vw, 2.4rem)", marginBottom: 8 }}>Every line has a job.</h1>
          <p style={{ fontFamily: BODY, fontSize: "1rem", lineHeight: 1.5, color: "#C7C9BD", marginBottom: 20 }}>LANDRIGHT highlights what changed.</p>

          <div style={{ border: "2px solid rgba(255,255,255,0.22)", padding: "18px" }}>
            <p style={{ fontFamily: BODY, fontSize: "1.05rem", lineHeight: 1.9, color: "#FFFFFF", margin: 0 }}>
              {segmentMessage(DEMO.routeA.text, DEMO.routeA.highlights.map(h => h.span)).map((seg, i) => {
                if (seg.hi === null) return <span key={i}>{seg.text}</span>;
                const hiIndex = seg.hi;
                const on = hiIndex < revealed;
                const isActive = activeHi === hiIndex;
                return (
                  <button key={i} onClick={() => on && openHighlight(hiIndex)}
                    aria-label={`${seg.text} — ${DEMO.routeA.highlights[hiIndex].operator}`}
                    style={{ font: "inherit", color: on ? INK : "#FFFFFF", backgroundColor: on ? LIME : "transparent", border: isActive ? `2px solid ${INK}` : "2px solid transparent", padding: "0 .14em", cursor: on ? "pointer" : "default", borderRadius: 0, transition: "background-color .35s ease, color .35s ease", WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" }}>
                    {seg.text}
                  </button>
                );
              })}
            </p>
          </div>

          <div style={{ minHeight: 92, marginTop: 14, border: "2px solid rgba(255,255,255,0.16)", padding: "14px 16px" }}>
            {activeHi !== null ? (
              <>
                <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", color: LIME, margin: 0 }}>
                  {DEMO.routeA.highlights[activeHi].operator}
                </p>
                <p style={{ fontFamily: BODY, fontSize: "0.95rem", lineHeight: 1.55, color: "#E8E8E2", marginTop: 6, marginBottom: 0 }}>
                  {DEMO.routeA.highlights[activeHi].why}
                </p>
              </>
            ) : (
              <p style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", color: DARK_MUTED, margin: 0 }}>
                Tap a highlighted phrase to see why it works
              </p>
            )}
          </div>

          <div style={{ marginTop: 18 }}>
            {WHY_BULLETS.map(b => (
              <div key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ color: LIME, fontWeight: 900 }}>—</span>
                <span style={{ fontFamily: BODY, fontSize: "0.95rem", lineHeight: 1.45, color: "#C7C9BD" }}>{b}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <CTA onClick={next} variant="lime">Try it on mine</CTA>
          </div>
        </div>
      )}

      {/* ── 10 · TRY YOURS ── */}
      {screen === "try_yours" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h1 style={{ ...H1, color: "#FFFFFF", fontSize: "clamp(1.8rem, 6.5vw, 2.4rem)", marginBottom: 10 }}>Paste the message you&rsquo;re hesitating to send.</h1>
          <p style={{ fontFamily: BODY, fontSize: "1rem", lineHeight: 1.5, color: "#C7C9BD", marginBottom: 18 }}>Rough is fine. One or two sentences is enough.</p>

          <div style={{ border: "2px solid rgba(255,255,255,0.3)", marginBottom: 12 }}>
            <textarea
              value={userMsg}
              onChange={e => setUserMsg(e.target.value)}
              placeholder="Write the version you probably wouldn't send."
              rows={4} maxLength={500}
              style={{ width: "100%", resize: "none", fontFamily: BODY, fontSize: "1.05rem", lineHeight: 1.6, color: "#FFFFFF", caretColor: LIME, backgroundColor: "transparent", border: "none", padding: "16px 18px", outline: "none", borderRadius: 0, display: "block" }}
            />
          </div>
          <p style={{ fontFamily: BODY, fontSize: "0.82rem", lineHeight: 1.5, color: DARK_MUTED, marginBottom: 18 }}>
            Your message is used to generate your options. You decide what to copy, save, or send.
          </p>

          {genState !== "idle" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 22 }}>
              {gen.a ? (
                <RouteCard label={gen.aLabel || labels.aLabel} text={gen.a} active />
              ) : (
                <div style={{ border: "2px solid rgba(255,255,255,0.22)", padding: "18px", fontFamily: COND, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", color: DARK_MUTED }}>
                  Shaping your first route…
                </div>
              )}
              {gen.b ? (
                <RouteCard label={gen.bLabel || labels.bLabel} text={gen.b} />
              ) : gen.a ? (
                <div style={{ border: "2px solid rgba(255,255,255,0.22)", padding: "18px", fontFamily: COND, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", color: DARK_MUTED }}>
                  Shaping a second route…
                </div>
              ) : null}
            </div>
          )}

          {genState === "done" ? (
            <CTA onClick={next} variant="lime">Continue</CTA>
          ) : (
            <CTA onClick={generateMine} variant="lime" disabled={userMsg.trim().length < 8 || genState === "loading"}>
              {genState === "loading" ? "Finding the right route…" : "Find the right route"}
            </CTA>
          )}
          {genState === "idle" && (
            <button onClick={() => setUserMsg(SAMPLES[state.message_context ?? "conflict"])}
              style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer", fontFamily: COND, fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", color: DARK_MUTED }}>
              Use another sample
            </button>
          )}
        </div>
      )}

      {/* ── 11 · PAYWALL ── */}
      {screen === "onboarding_paywall" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Eyebrow>The full toolkit</Eyebrow>
          <h1 style={{ ...H1, color: "#FFFFFF", fontSize: "clamp(1.9rem, 7vw, 2.6rem)", marginBottom: 14 }}>{PAYWALL.headline}</h1>
          <p style={{ fontFamily: BODY, fontSize: "1.02rem", lineHeight: 1.55, color: "#E8E8E2", marginBottom: 22 }}>{PAYWALL.subcopy}</p>
          <div style={{ marginBottom: 26 }}>
            {PAYWALL.bullets.map(b => (
              <div key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ color: LIME, fontWeight: 900 }}>✓</span>
                <span style={{ fontFamily: BODY, fontSize: "0.98rem", lineHeight: 1.4, color: "#E8E8E2" }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CTA onClick={() => { fire("trial_started", { paywall_variant: PAYWALL_VARIANT }); finish(); }} variant="lime">Start free trial</CTA>
            <CTA onClick={finish} variant="ghost">Continue with limited preview</CTA>
          </div>
        </div>
      )}
    </Frame>
  );
}
