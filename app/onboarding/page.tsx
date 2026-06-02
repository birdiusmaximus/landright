"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── Brand tokens (mirrors app/page.tsx) ──────────────────────────────────────

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

// ─── Flow definition ──────────────────────────────────────────────────────────

type StepId =
  | "welcome" | "auth" | "recognition" | "agitation"
  | "q_who" | "q_situation" | "q_value" | "q_cost" | "q_wish"
  | "reflect" | "proof" | "value" | "paywall" | "success";

const STEPS: StepId[] = [
  "welcome", "auth", "recognition", "agitation",
  "q_who", "q_situation", "q_value", "q_cost", "q_wish",
  "reflect", "proof", "value", "paywall", "success",
];

// Survey questions. Tapping an option records the answer and auto-advances.
interface Q { id: StepId; kicker: string; title: string; options: string[]; }
const QUESTIONS: Record<string, Q> = {
  q_who: {
    id: "q_who", kicker: "01 / 05", title: "Who's on your mind right now?",
    options: ["My partner", "A close friend", "Family", "A parent"],
  },
  q_situation: {
    id: "q_situation", kicker: "02 / 05", title: "What's happening?",
    options: [
      "We keep having the same argument",
      "There's something I need to say but don't know how",
      "We've gone distant and I can't cross it",
      "I said something I regret",
      "I'm scared to ask for what I need",
      "A big conversation is coming",
    ],
  },
  q_value: {
    id: "q_value", kicker: "03 / 05", title: "How much do these relationships matter to you?",
    options: ["They're my whole world", "More than I let on", "A lot — I just struggle to show it"],
  },
  q_cost: {
    id: "q_cost", kicker: "04 / 05", title: "When the words come out wrong, what does it cost you?",
    options: ["Days of cold distance", "Trust I can't easily rebuild", "Them pulling away", "Feeling like a stranger in my own home"],
  },
  q_wish: {
    id: "q_wish", kicker: "05 / 05", title: "What do you wish you'd known before your last hard conversation?",
    options: [
      "How to say it without it sounding like an attack",
      "How to even bring it up",
      "How to apologise so they believe me",
      "When to speak and when to wait",
    ],
  },
};

const PROOF = [
  { quote: "I almost sent a text that would've ended us. Landright gave me the version that opened the door instead.", who: "Maya, 31" },
  { quote: "I finally apologised to my dad. Properly. After eleven years.", who: "James, 44" },
  { quote: "Like having a calm friend in my pocket at 1am.", who: "Priya, 27" },
];

// ─── Primitives ───────────────────────────────────────────────────────────────

function CTA({ children, onClick, variant = "lime", full = true }: { children: React.ReactNode; onClick?: () => void; variant?: "lime" | "ink" | "ghost"; full?: boolean }) {
  const [pressed, setPressed] = useState(false);
  const look = {
    lime: { bg: LIME, color: INK, border: INK, shadow: INK },
    ink: { bg: INK, color: LIME, border: INK, shadow: LIME },
    ghost: { bg: "transparent", color: INK, border: INK, shadow: INK },
  }[variant];
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        fontFamily: COND, fontWeight: 900, fontSize: "1.05rem", letterSpacing: "0.05em",
        textTransform: "uppercase", border: `2px solid ${look.border}`, padding: "17px 28px",
        width: full ? "100%" : undefined, cursor: "pointer", backgroundColor: look.bg, color: look.color,
        boxShadow: pressed ? `0 0 0 ${look.shadow}` : `4px 4px 0 ${look.shadow}`,
        transform: pressed ? "translate(4px,4px)" : "none", transition: "transform .08s ease, box-shadow .08s ease",
        borderRadius: 0,
      }}
    >
      {children}
    </button>
  );
}

function ProgressBar({ index }: { index: number }) {
  const pct = Math.round((index / (STEPS.length - 1)) * 100);
  return (
    <div style={{ height: 8, backgroundColor: GROUND2, border: `2px solid ${INK}` }}>
      <div style={{ height: "100%", width: `${pct}%`, backgroundColor: LIME, transition: "width .35s cubic-bezier(.22,1,.36,1)" }} />
    </div>
  );
}

function Choice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left", fontFamily: BODY, fontWeight: 600, fontSize: "1rem",
        lineHeight: 1.35, color: selected ? INK : "#FFFFFF",
        backgroundColor: selected ? LIME : "transparent",
        border: `2px solid ${selected ? LIME : "rgba(255,255,255,0.28)"}`,
        padding: "16px 18px", cursor: "pointer", borderRadius: 0,
        transition: "background-color .12s ease, color .12s ease, border-color .12s ease",
      }}
    >
      {label}
    </button>
  );
}

// ─── Screen shell ─────────────────────────────────────────────────────────────

function Screen({ bg = "ground", children }: { bg?: "ground" | "dark"; children: React.ReactNode }) {
  const isDark = bg === "dark";
  return (
    <div
      className={isDark ? "surface-dark" : undefined}
      style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        backgroundColor: isDark ? DARK : GROUND,
        color: isDark ? "#FFFFFF" : INK,
        padding: "clamp(20px, 6vw, 40px)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

const H1: React.CSSProperties = {
  fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(2.4rem, 9vw, 3.6rem)",
  lineHeight: 0.92, letterSpacing: "-0.03em", textTransform: "uppercase", margin: 0,
};
const KICKER: React.CSSProperties = {
  fontFamily: COND, fontWeight: 900, fontSize: "0.8rem", letterSpacing: "0.18em",
  textTransform: "uppercase", color: LIME, marginBottom: 14,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const step = STEPS[index];

  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);
  // Scroll to top on every step change.
  useEffect(() => { window.scrollTo(0, 0); }, [index]);

  const next = () => setIndex(i => Math.min(i + 1, STEPS.length - 1));
  const back = () => setIndex(i => Math.max(i - 1, 0));

  function answer(id: string, value: string) {
    setAnswers(a => ({ ...a, [id]: value }));
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(next, 260); // brief highlight, then advance
  }

  function finish() {
    try {
      localStorage.setItem("landright_onboarding", JSON.stringify({ done: true, answers, at: new Date().toISOString() }));
    } catch { /* ignore */ }
    router.push("/");
  }

  // Possessive for the reflect screen.
  const whoWord = (() => {
    const w = answers.q_who || "";
    if (w.includes("partner")) return "your partner";
    if (w.includes("friend")) return "your friend";
    if (w.includes("parent")) return "your parent";
    if (w.includes("Family")) return "your family";
    return "the person you're thinking of";
  })();
  // Lowercase only the first letter so it reads naturally mid-sentence without
  // flattening a standalone "I" ("trust I can't…", not "trust i can't…").
  const rawCost = answers.q_cost || "days of distance";
  const costWord = rawCost.charAt(0).toLowerCase() + rawCost.slice(1);

  // Top bar (progress + back) shown on the journey screens, not welcome/success.
  const showTopBar = index > 0 && step !== "success";

  return (
    <Screen bg={["recognition", "agitation", "q_who", "q_situation", "q_value", "q_cost", "q_wish", "paywall", "success"].includes(step) ? "dark" : "ground"}>
      {showTopBar && (
        <div style={{ marginBottom: "clamp(26px, 7vw, 44px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <button onClick={back} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: COND, fontWeight: 900, fontSize: "1.1rem", padding: 0 }}>←</button>
            <div style={{ flex: 1 }}><ProgressBar index={index} /></div>
          </div>
        </div>
      )}

      {/* ── WELCOME ── */}
      {step === "welcome" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={H1}>The moment<br />before you<br />hit <span style={{ fontStyle: "italic" }}>send.</span></h1>
          <p style={{ fontFamily: BODY, fontSize: "1.1rem", lineHeight: 1.55, marginTop: 24, marginBottom: 36 }}>
            That pause when you know the words matter — the apology, the hard truth, the thing you&apos;ve been scared to say. That&apos;s where Landright lives.
          </p>
          <CTA onClick={next}>Begin →</CTA>
          <p style={{ textAlign: "center", marginTop: 18, fontFamily: COND, fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>
            Trusted by 12,000+ people saying the hard things better
          </p>
        </div>
      )}

      {/* ── AUTH (mock) ── */}
      {step === "auth" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ ...H1, fontSize: "clamp(2rem, 7.5vw, 2.8rem)" }}>First — let&apos;s save your place.</h1>
          <p style={{ fontFamily: BODY, fontSize: "1rem", lineHeight: 1.5, marginTop: 18, marginBottom: 30, color: MUTED }}>
            So your progress and your messages are here when you come back.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CTA onClick={next} variant="ink"> Continue with Apple</CTA>
            <CTA onClick={next} variant="ghost">Continue with Google</CTA>
            <CTA onClick={next} variant="ghost">Continue with email</CTA>
          </div>
          <p style={{ fontFamily: BODY, fontSize: "0.8rem", lineHeight: 1.5, marginTop: 22, color: MUTED, textAlign: "center" }}>
            We&apos;ll never post anything. What you write stays private to you.
          </p>
          <p style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 20, color: MUTED, textAlign: "center" }}>
            Demo — these buttons just continue the tour
          </p>
        </div>
      )}

      {/* ── RECOGNITION ── */}
      {step === "recognition" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={KICKER}>Sound familiar?</p>
          <h1 style={{ ...H1, color: "#FFFFFF" }}>You know the feeling.</h1>
          <p style={{ fontFamily: BODY, fontSize: "1.1rem", lineHeight: 1.6, marginTop: 24, marginBottom: 36, color: "#E8E8E2" }}>
            You typed it out. Deleted it. Typed it again. Then either said nothing — or said it wrong, and watched their face change.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Choice label="That's me" selected={false} onClick={next} />
            <Choice label="Sometimes" selected={false} onClick={next} />
          </div>
        </div>
      )}

      {/* ── AGITATION ── */}
      {step === "agitation" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={KICKER}>Why it matters</p>
          <h1 style={{ ...H1, color: "#FFFFFF" }}>The wrong words are <span style={{ color: LIME }}>expensive.</span></h1>
          <p style={{ fontFamily: BODY, fontSize: "1.1rem", lineHeight: 1.6, marginTop: 24, marginBottom: 40, color: "#E8E8E2" }}>
            One clumsy sentence in a tense moment can undo months of trust. And the silence afterwards costs even more.
          </p>
          <CTA onClick={next} variant="lime">I don&apos;t want that →</CTA>
        </div>
      )}

      {/* ── SURVEY ── */}
      {QUESTIONS[step] && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
          <p style={KICKER}>{QUESTIONS[step].kicker}</p>
          <h1 style={{ ...H1, color: "#FFFFFF", fontSize: "clamp(1.7rem, 6.5vw, 2.4rem)", lineHeight: 1.02 }}>{QUESTIONS[step].title}</h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 30 }}>
            {QUESTIONS[step].options.map(opt => (
              <Choice key={opt} label={opt} selected={answers[step] === opt} onClick={() => answer(step, opt)} />
            ))}
          </div>
        </div>
      )}

      {/* ── REFLECT ── */}
      {step === "reflect" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={KICKER}>Here&apos;s what we heard</p>
          <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.5rem, 6vw, 2.1rem)", lineHeight: 1.12, letterSpacing: "-0.02em", marginTop: 4 }}>
            You&apos;ve got something to say to <span style={{ backgroundColor: LIME, padding: "0 .12em" }}>{whoWord}</span>. Getting it wrong could cost you <span style={{ backgroundColor: LIME, padding: "0 .12em" }}>{costWord}</span>.
          </p>
          <p style={{ fontFamily: BODY, fontSize: "1.05rem", lineHeight: 1.6, marginTop: 26, marginBottom: 36 }}>
            You&apos;re not bad with words. You&apos;ve just never had the right ones <em>when it counted.</em> Landright was built for exactly this moment.
          </p>
          <CTA onClick={next}>Show me →</CTA>
        </div>
      )}

      {/* ── SOCIAL PROOF ── */}
      {step === "proof" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ ...H1, fontSize: "clamp(2rem, 7.5vw, 2.8rem)" }}>You&apos;re not the only one.</h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28, marginBottom: 36 }}>
            {PROOF.map((p, i) => (
              <div key={i} style={{ border: `2px solid ${INK}`, padding: "18px 20px", backgroundColor: i === 0 ? LIME : "transparent" }}>
                <p style={{ fontFamily: BODY, fontSize: "1rem", lineHeight: 1.5, fontStyle: "italic" }}>&ldquo;{p.quote}&rdquo;</p>
                <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 10 }}>— {p.who}</p>
              </div>
            ))}
          </div>
          <CTA onClick={next}>Continue →</CTA>
          <p style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 14, color: MUTED, textAlign: "center" }}>
            Demo — placeholder quotes, not real testimonials
          </p>
        </div>
      )}

      {/* ── VALUE / MECHANISM ── */}
      {step === "value" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ ...H1, fontSize: "clamp(1.8rem, 6.8vw, 2.5rem)" }}>Not a rewrite tool. A translator for what you really mean.</h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 30, marginBottom: 38 }}>
            {[
              ["Grounded in real psychology", "Gottman, Nonviolent Communication, EFT — not generic AI fluff."],
              ["Two ways to say it, every time", "One clear and plain, one that lands deeper."],
              ["Built for the moment", "Paste the messy version, get the one you won't regret."],
            ].map(([t, d]) => (
              <div key={t} style={{ display: "flex", gap: 14 }}>
                <span style={{ width: 12, height: 12, backgroundColor: LIME, border: `2px solid ${INK}`, flexShrink: 0, marginTop: 5 }} />
                <div>
                  <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "-0.01em" }}>{t}</p>
                  <p style={{ fontFamily: BODY, fontSize: "0.95rem", lineHeight: 1.5, color: MUTED, marginTop: 2 }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
          <CTA onClick={next}>I&apos;m ready →</CTA>
        </div>
      )}

      {/* ── PAYWALL (hard trial, mock card) ── */}
      {step === "paywall" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={KICKER}>Your 3 days, free</p>
          <h1 style={{ ...H1, color: "#FFFFFF", fontSize: "clamp(2rem, 7.5vw, 2.9rem)" }}>Start saying it right.</h1>
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            {[
              "Unlimited messages, whenever you need them",
              "Both options every time — clear and crafted",
              "Built on decades of relationship science",
            ].map(b => (
              <div key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ color: LIME, fontWeight: 900 }}>✓</span>
                <span style={{ fontFamily: BODY, fontSize: "0.98rem", lineHeight: 1.4, color: "#E8E8E2" }}>{b}</span>
              </div>
            ))}
          </div>

          {/* Mock card capture */}
          <div style={{ border: `2px solid rgba(255,255,255,0.25)`, padding: "16px 16px 18px", marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", color: DARK_MUTED }}>Card details</span>
              <span style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.66rem", letterSpacing: "0.06em", textTransform: "uppercase", color: LIME }}>🔒 Demo — no real card</span>
            </div>
            {["Card number", "MM / YY          CVC"].map((ph, i) => (
              <div key={i} style={{ border: `1px solid rgba(255,255,255,0.2)`, padding: "12px 12px", marginBottom: i === 0 ? 8 : 0, fontFamily: BODY, fontSize: "0.9rem", color: DARK_MUTED }}>{ph}</div>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <CTA onClick={next} variant="lime">Start my 3-day free trial</CTA>
          </div>
          <p style={{ fontFamily: BODY, fontSize: "0.82rem", lineHeight: 1.5, marginTop: 14, color: "#E8E8E2", textAlign: "center" }}>
            <strong>3 days free, then £2.99/month.</strong> We&apos;ll remind you 1 day before it ends. Cancel anytime, in two taps.
          </p>
          <p style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.66rem", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 12, color: DARK_MUTED, textAlign: "center" }}>
            Less than a coffee — to never send a message you regret
          </p>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {step === "success" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, backgroundColor: LIME, border: `2px solid ${INK}`, margin: "0 auto 26px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 900 }}>✓</div>
          <h1 style={{ ...H1, color: "#FFFFFF" }}>You&apos;re in.</h1>
          <p style={{ fontFamily: BODY, fontSize: "1.1rem", lineHeight: 1.55, marginTop: 22, marginBottom: 36, color: "#E8E8E2" }}>
            Three days, on us. Let&apos;s make the next hard moment go differently.
          </p>
          <CTA onClick={finish} variant="lime">Open Landright →</CTA>
        </div>
      )}
    </Screen>
  );
}
