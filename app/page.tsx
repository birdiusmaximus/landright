"use client";

import { useState, useRef, useEffect } from "react";
import type { Audience, Segment } from "@/lib/types";
import { SignInButton, SignUpButton, UserButton, Show } from "@clerk/nextjs";
import SubscriptionGate from "@/components/SubscriptionGate";
import { AUTH_DISABLED } from "@/lib/admin";
import { hapticTap, hapticSelect, hapticSuccess, hapticError, hapticKeystroke } from "@/lib/haptics";
import { useKeyboardVisible } from "@/lib/keyboard";
import { shareText } from "@/lib/share";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState = "idle" | "loading" | "results" | "error";

// One generated option (matches the API's OptionOutput).
interface OptionData {
  stack_label: string;
  breakdown: Segment[];
  option: string;
  origin?: string;
  rationale?: string;
  safety_flags: string[];
}

interface ResultState {
  a: OptionData | null; // fast/clear option (arrives first)
  b: OptionData | null; // eloquent option (arrives a few seconds later)
  bError?: string | null;
  eventId: string;
  brief: { inferred_goal: string; stack_a: string; stack_b: string };
  audience: Audience | null;
  chosen?: "a" | "b";
  baseNum: number; // number of option A; B is baseNum + 1 (counts up on "Two more")
  moreAvailable: boolean; // false once every distinct pair has been shown → disable "Two more"
}

const pad2 = (n: number) => String(n).padStart(2, "0");

// Word-bigram (shingle) Jaccard similarity — used to catch when the two options
// come back too alike so we can re-craft the second one to genuinely differ.
function similarity(a: string, b: string): number {
  const grams = (s: string) => {
    const w = s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
    const set = new Set<string>();
    for (let i = 0; i < w.length - 1; i++) set.add(w[i] + " " + w[i + 1]);
    return set;
  };
  const A = grams(a), B = grams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / (A.size + B.size - inter);
}

// ─── Brand tokens ─────────────────────────────────────────────────────────────

// Brand colours route through the CSS variables in globals.css so the dark-mode
// toggle (tap the logomark) re-themes everything at once. LIME is constant;
// INK/GROUND/etc. flip between light and dark. ON_LIME is the exception — text
// and strokes sitting on a lime fill must stay ink in both themes.
const LIME = "var(--lime)";
const LIME_DEEP = "var(--lime-deep)"; // pressed/hover state for lime surfaces
const INK = "var(--ink)";
const ON_LIME = "var(--ink-fixed)";
const GROUND = "var(--ground)";
const GROUND2 = "var(--ground-2)";
const MUTED = "var(--muted)";
const DARK = "var(--surface)";
const DARK_MUTED = "var(--surface-muted)";
const DISPLAY = "var(--font-display), 'Helvetica Neue', Arial, sans-serif";
const COND = "var(--font-cond), 'Arial Narrow', sans-serif";
const BODY = "var(--font-body), -apple-system, sans-serif";

// "2026-07-01T00:00:00Z" → "1 July" for the limit-reset message.
function formatReset(iso: string): string {
  if (!iso) return "next month";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  } catch {
    return "next month";
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "partner", label: "Partner" },
  { value: "friend", label: "Friend" },
  { value: "family", label: "Family" },
];

// ─── Primitives ───────────────────────────────────────────────────────────────

type TagVariant = "solid" | "outline" | "ink";

function Tag({ children, variant = "solid", size = "sm", shadow = false }: { children: React.ReactNode; variant?: TagVariant; size?: "sm" | "xs"; shadow?: boolean }) {
  const styles: Record<TagVariant, React.CSSProperties> = {
    solid: { backgroundColor: LIME, color: ON_LIME, border: `2px solid var(--lime-edge)` },
    outline: { backgroundColor: "transparent", color: INK, border: `2px solid ${INK}` },
    ink: { backgroundColor: "var(--sel-bg)", color: "var(--sel-fg)", border: `2px solid var(--lime-edge)` },
  };
  return (
    <span
      style={{
        ...styles[variant],
        display: "inline-block",
        fontFamily: COND,
        fontWeight: 900,
        fontSize: size === "xs" ? "0.72rem" : "0.82rem",
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        padding: size === "xs" ? "4px 9px" : "6px 12px",
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        boxShadow: shadow ? `3px 3px 0 var(--shadow)` : undefined,
      }}
    >
      {children}
    </span>
  );
}

// Lime highlighter marker (for headline emphasis).
function Mark({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        backgroundColor: LIME,
        color: ON_LIME,
        padding: "0.02em 0.16em",
        display: "inline-block",
        transform: "rotate(-1.4deg)",
        WebkitBoxDecorationBreak: "clone",
        boxDecorationBreak: "clone",
      }}
    >
      {children}
    </span>
  );
}

// The "What do you need to say?" label is, by design, a hidden easter egg: it
// looks exactly like the solid shadowed Tag next to "Who needs to hear this?",
// but tapping it drops a realistic, audience-aware sample message in to test.
function SampleTag({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={loading}
      aria-label="What do you need to say?"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        backgroundColor: LIME, color: ON_LIME, border: `2px solid var(--lime-edge)`,
        fontFamily: COND, fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.07em",
        textTransform: "uppercase", padding: "6px 12px", lineHeight: 1.1, whiteSpace: "nowrap",
        cursor: "pointer", borderRadius: 0, display: "inline-block",
        boxShadow: pressed ? `0 0 0 var(--shadow)` : `3px 3px 0 var(--shadow)`,
        transform: pressed ? "translate(3px, 3px)" : "none",
        transition: "transform 0.08s ease, box-shadow 0.08s ease",
      }}
    >
      What do you need to say?
    </button>
  );
}

// While a sample drafts: quiet grey dots that build up one by one, styled like
// the input placeholder so it reads as the window "typing" a thought.
function LoadingDots() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setN(x => (x % 4) + 1), 350);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontFamily: BODY, fontSize: "1.05rem", lineHeight: 1.6, color: "#7E7E76" }}>
      {".".repeat(n)}
    </span>
  );
}

// Lime bars in the window while dictating. Driven by real mic amplitude when an
// analyser is available; falls back to a gentle CSS animation otherwise.
function LiveWaveform({ analyser }: { analyser: AnalyserNode | null }) {
  const N = 9;
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const step = Math.max(1, Math.floor(data.length / N));
    let raf = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      for (let i = 0; i < N; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += data[i * step + j] || 0;
        const avg = sum / step / 255;
        const scale = Math.min(1, 0.16 + avg * 1.25);
        const el = barsRef.current[i];
        if (el) el.style.transform = `scaleY(${scale.toFixed(3)})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [analyser]);
  return (
    <div aria-hidden style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, height: 44 }}>
        {Array.from({ length: N }).map((_, i) => (
          <span key={i} ref={el => { barsRef.current[i] = el; }}
            style={{ width: 5, height: 44, backgroundColor: LIME, transformOrigin: "center", transform: "scaleY(0.16)",
              transition: "transform 0.06s linear",
              animation: analyser ? "none" : `lr-wave 0.9s ease-in-out ${(i % 5 * 0.11).toFixed(2)}s infinite` }} />
        ))}
      </div>
      <span style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#7E8470" }}>Listening…</span>
    </div>
  );
}

// Mic toggle in the corner of the input window. Idle = lime outline; active = lime fill.
function MicButton({ active, disabled, onClick }: { active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={active ? "Stop dictation" : "Dictate your message"}
      title={active ? "Stop listening" : "Speak your message"}
      style={{
        position: "absolute", bottom: 12, right: 12, zIndex: 3,
        width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: active ? LIME : "transparent", border: `2px solid ${LIME}`, borderRadius: 0,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
      }}
    >
      <svg width="18" height="20" viewBox="0 0 18 20" fill="none" stroke={active ? ON_LIME : LIME} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="1" width="6" height="10" rx="3" fill={active ? ON_LIME : "none"} />
        <path d="M3 9a6 6 0 0 0 12 0" />
        <line x1="9" y1="15" x2="9" y2="18.5" />
        <line x1="6" y1="18.5" x2="12" y2="18.5" />
      </svg>
    </button>
  );
}

// Selectable chip (audience picker). Lifts on hover, presses in on tap with a
// selection tick; the active one sits filled (ink) with a lime shadow.
function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const lifted = hovered && !pressed;
  const boxShadow = active
    ? (pressed ? `0 0 0 var(--sel-shadow)` : lifted ? `5px 5px 0 var(--sel-shadow)` : `3px 3px 0 var(--sel-shadow)`)
    : (pressed ? "none" : lifted ? `3px 3px 0 var(--shadow)` : "none");
  const transform = pressed ? "translate(2px, 2px)" : lifted ? "translate(-2px, -2px)" : "none";
  return (
    <button
      onClick={onClick}
      onPointerEnter={e => { if (e.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => { setPressed(false); setHovered(false); }}
      onPointerDown={() => { setPressed(true); hapticSelect(); }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        fontFamily: COND, fontWeight: 900, fontSize: "0.95rem", letterSpacing: "0.05em", textTransform: "uppercase",
        border: `2px solid ${active ? "var(--lime-edge)" : INK}`, backgroundColor: active ? "var(--sel-bg)" : (lifted ? GROUND2 : "transparent"), color: active ? "var(--sel-fg)" : INK,
        padding: "14px 12px", cursor: "pointer", borderRadius: 0, boxShadow, transform,
        transition: "transform 0.13s cubic-bezier(0.34,1.45,0.6,1), box-shadow 0.13s ease, background-color 0.12s ease, color 0.12s ease",
      }}
    >
      {label}
    </button>
  );
}

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline" | "cta";
  full?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  // primary = lime fill; cta = ink fill + lime text; outline = transparent.
  // Each stage shifts colour + shadow so the button lifts on hover and slams
  // into its shadow on press.
  const look = {
    primary: { bg: LIME, color: ON_LIME, shadow: "var(--shadow)", hoverBg: LIME_DEEP, hoverColor: ON_LIME, pressBg: LIME_DEEP, pressColor: ON_LIME },
    cta: { bg: INK, color: LIME, shadow: LIME, hoverBg: "#23231F", hoverColor: LIME, pressBg: INK, pressColor: LIME },
    outline: { bg: "transparent", color: INK, shadow: "var(--shadow)", hoverBg: "var(--sel-bg)", hoverColor: "var(--sel-fg)", pressBg: "var(--sel-bg)", pressColor: "var(--sel-fg)" },
  }[variant];
  const stage = disabled ? "disabled" : pressed ? "press" : hovered ? "hover" : "rest";
  const bg = stage === "disabled" ? GROUND2 : stage === "press" ? look.pressBg : stage === "hover" ? look.hoverBg : look.bg;
  const color = stage === "disabled" ? MUTED : stage === "press" ? look.pressColor : stage === "hover" ? look.hoverColor : look.color;
  const boxShadow = stage === "disabled" ? "none" : stage === "press" ? `0 0 0 ${look.shadow}` : stage === "hover" ? `6px 6px 0 ${look.shadow}` : `4px 4px 0 ${look.shadow}`;
  const transform = stage === "press" ? "translate(4px, 4px)" : stage === "hover" ? "translate(-2px, -2px)" : "none";
  // A lime fill shouldn't wear a contrasting outline in dark mode: primary is
  // always lime, and outline fills lime on hover/press. Those use --lime-edge
  // (ink in light, lime in dark → invisible). Dark/transparent states keep ink.
  const limeFilled = variant === "primary" || (variant === "outline" && (stage === "hover" || stage === "press"));
  const edge = disabled ? MUTED : limeFilled ? "var(--lime-edge)" : INK;
  const base: React.CSSProperties = {
    fontFamily: COND,
    fontWeight: 900,
    fontSize: "1rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    border: `2px solid ${edge}`,
    padding: "16px 26px",
    width: full ? "100%" : undefined,
    cursor: disabled ? "not-allowed" : "pointer",
    backgroundColor: bg,
    color,
    boxShadow,
    transform,
    // Springy ease so it pops back on release.
    transition: "transform 0.13s cubic-bezier(0.34, 1.45, 0.6, 1), box-shadow 0.13s ease, background-color 0.12s ease, color 0.12s ease",
    borderRadius: 0,
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onPointerEnter={e => { if (!disabled && e.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => { setPressed(false); setHovered(false); }}
      onPointerDown={() => { if (!disabled) { setPressed(true); hapticTap(); } }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={base}
    >
      {children}
    </button>
  );
}

// Shared action button for the dark card (Copy / Share). Lime outline at rest;
// on a mouse it lifts with a faint lime shadow on hover; on press it fills lime
// and fires a tap haptic — matching the rest of the app's button feel. `active`
// forces the filled look (used for the brief "copied" confirmation).
function CardActionButton({
  onClick,
  active = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const filled = active || pressed;
  return (
    <button
      onClick={onClick}
      title={title}
      onPointerEnter={e => { if (e.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => { setHovered(false); setPressed(false); }}
      onPointerDown={() => { setPressed(true); hapticTap(); }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        fontFamily: COND,
        fontWeight: 900,
        fontSize: "0.9rem",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        border: `2px solid ${LIME}`,
        backgroundColor: filled ? LIME : hovered ? "rgba(198,246,52,0.14)" : "transparent",
        color: filled ? ON_LIME : LIME,
        padding: "9px 18px",
        cursor: "pointer",
        borderRadius: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        boxShadow: pressed ? "0 0 0 transparent" : hovered ? `3px 3px 0 ${LIME}` : "0 0 0 transparent",
        transform: pressed ? "translate(2px, 2px)" : hovered ? "translate(-1px, -1px)" : "none",
        transition: "transform 0.12s cubic-bezier(0.34,1.45,0.6,1), box-shadow 0.12s ease, background-color 0.12s ease, color 0.12s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {children}
    </button>
  );
}

// Share/upload glyph (a box with an arrow rising out of it). Inherits the
// button's current text colour via `currentColor`.
function ShareGlyph() {
  return (
    <svg width="14" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="square" strokeLinejoin="miter" aria-hidden style={{ marginTop: -1 }}>
      <path d="M12 15.5 V3" />
      <path d="M7.5 7 L12 2.5 L16.5 7" />
      <path d="M6 10 H4 V21.5 H20 V10 H18" />
    </svg>
  );
}

// Copy button styled for the dark card.
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function flash() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  function fallbackCopy() {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      flash();
    } catch { /* ignore */ }
  }
  function copy() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(flash).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }
  return (
    <CardActionButton onClick={copy} active={copied} title="Copy this message">
      {copied ? "✓ Copied" : "⧉ Copy text"}
    </CardActionButton>
  );
}

// Share button — opens the native share sheet (Messages, WhatsApp, Mail…) in the
// app and on mobile web; falls back to copying on desktop browsers.
function ShareButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function onShare() {
    const outcome = await shareText(text);
    if (outcome === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } else if (outcome === "shared") {
      hapticSuccess();
    }
  }
  return (
    <CardActionButton onClick={onShare} active={copied} title="Share this message">
      {copied ? "✓ Copied to share" : <><ShareGlyph />Share</>}
    </CardActionButton>
  );
}

// The "✓ Chosen" pill doubles as an undo control: tap it to clear the choice and
// bring both options back into play. Mirrors the solid Tag, with a trailing ✕ and
// a hover lift so it reads as interactive (and a tooltip for good measure).
function ChosenToggle({ onUnchoose }: { onUnchoose: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onUnchoose}
      title="Chosen — tap to unselect"
      aria-label="Chosen. Tap to unselect and compare both options again."
      onPointerEnter={e => { if (e.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => { setHovered(false); setPressed(false); }}
      onPointerDown={() => { setPressed(true); hapticSelect(); }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        backgroundColor: LIME,
        color: ON_LIME,
        border: `2px solid var(--lime-edge)`,
        fontFamily: COND,
        fontWeight: 900,
        fontSize: "0.82rem",
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        padding: "6px 11px",
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        cursor: "pointer",
        borderRadius: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        boxShadow: pressed ? "0 0 0 transparent" : hovered ? `3px 3px 0 var(--shadow)` : "0 0 0 transparent",
        transform: pressed ? "translate(2px, 2px)" : hovered ? "translate(-1px, -1px)" : "none",
        transition: "transform 0.12s cubic-bezier(0.34,1.45,0.6,1), box-shadow 0.12s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span>✓ Chosen</span>
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 15,
          height: 15,
          border: `1.5px solid ${ON_LIME}`,
          fontSize: "0.62rem",
          opacity: hovered ? 1 : 0.7,
          transition: "opacity 0.12s ease",
        }}
      >
        ✕
      </span>
    </button>
  );
}

function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: LIME,
        border: `2px solid ${ON_LIME}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: size * 0.11,
        padding: size * 0.2,
      }}
    >
      {[0, 1, 2].map(i => (
        <div key={i} style={{ height: 2, backgroundColor: ON_LIME, transform: `skewX(-18deg)` }} />
      ))}
    </div>
  );
}

// Typical generation latency, used to pace the progress fill. Measured median
// in-browser for gpt-5.4-mini ≈ 2.7s (range 2.3–3.1s; see generation.ts). The
// bar fills steadily to ~90% over this window so it lands near-full just as
// results usually arrive, then crawls slowly if a request runs long so it never
// stalls full or jumps early.
const GEN_EXPECTED_MS = 2700;
// Option B is written by the stronger model (gpt-5.5) — slower but more eloquent.
// Median ≈ 10s in-browser; the bar paces to that so it lands near-full on arrival.
const GEN_EXPECTED_MS_B = 10000;

function LoadingBar({ expectedMs = GEN_EXPECTED_MS }: { expectedMs?: number }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      const t = performance.now() - start;
      const p =
        t < expectedMs
          ? 0.9 * (t / expectedMs)
          : 0.9 + 0.085 * (1 - Math.exp(-(t - expectedMs) / 2200));
      setPct(p);
    }, 50);
    return () => clearInterval(id);
  }, [expectedMs]);

  return (
    <div style={{ marginTop: 18, height: 12, overflow: "hidden", backgroundColor: INK, border: `2px solid ${INK}` }}>
      <div
        style={{
          height: "100%",
          width: `${(pct * 100).toFixed(1)}%`,
          backgroundColor: LIME,
          transition: "width 0.1s linear",
        }}
      />
    </div>
  );
}

// A zero-width inline marker carrying two small ink triangles (one above the
// line pointing down, one below pointing up). Placed at the start and end of a
// highlighted segment so it gets a crisp, digital "selected" frame — and,
// because it sits in the text flow, it tracks the true start/end even when the
// highlight wraps across lines.
function TriMarker({ pos, innerRef }: { pos: "start" | "end"; innerRef?: React.Ref<HTMLSpanElement> }) {
  const base: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeft: "6px solid transparent",
    borderRight: "6px solid transparent",
    pointerEvents: "none",
  };
  const line: React.CSSProperties = {
    position: "absolute",
    width: 1,
    backgroundColor: LIME,
    pointerEvents: "none",
  };
  return (
    <span
      ref={innerRef}
      aria-hidden
      style={{ position: "relative", display: "inline-block", width: 0, height: "1em", verticalAlign: "text-bottom" }}
    >
      {pos === "start" ? (
        <>
          {/* triangle at the TOP-LEFT corner, tip pointing DOWN onto the top edge */}
          <i style={{ ...base, borderTop: `7px solid ${LIME}`, top: "-11px", left: "-8px" }} />
          {/* thin line continuing from the tip DOWN through one line, slightly past it */}
          <i style={{ ...line, left: "-2px", top: "-4px", height: "27px" }} />
        </>
      ) : (
        <>
          {/* triangle at the BOTTOM-RIGHT corner, tip pointing UP onto the bottom edge */}
          <i style={{ ...base, borderBottom: `7px solid ${LIME}`, bottom: "-7px", left: "-4px" }} />
          {/* thin line continuing from the tip UP through one line, slightly past it */}
          <i style={{ ...line, left: "2px", top: "-10px", height: "27px" }} />
        </>
      )}
    </span>
  );
}

// ─── Option card (dark, with line-by-line breakdown) ──────────────────────────

function OptionCard({
  index,
  label,
  segments,
  fullText,
  origin,
  rationale,
  isChosen,
  otherChosen,
  onChoose,
  onUnchoose,
  autoDemo = false,
}: {
  index: string;
  label: string;
  segments: Segment[];
  fullText: string;
  origin?: string;
  rationale?: string;
  isChosen: boolean;
  otherChosen: boolean;
  onChoose: () => void;
  onUnchoose: () => void;
  autoDemo?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  // Distance the end marker travels = ~20% of the highlight's last line width.
  const trackRef = useRef(0);
  const paraRef = useRef<HTMLParagraphElement | null>(null);
  const hiRef = useRef<HTMLSpanElement | null>(null);
  const endRef = useRef<HTMLSpanElement | null>(null);
  const animSeq = useRef(0);
  // Set true once the user interacts, so the auto-demo (guided highlight sweep)
  // stops immediately and never fights a real hover/tap.
  const demoCancelled = useRef(false);
  // True while the guided sweep is playing. Passive hover events (e.g. the card
  // scrolling under a stationary cursor) are ignored while this is true; only a
  // deliberate tap / pointer-down cancels the demo.
  const demoRunning = useRef(false);
  // True on real hover devices (mouse). On touch, hover is ignored so the
  // emulated mouseenter can't fight the tap (which used to flash then clear it).
  const canHover = useRef(true);
  useEffect(() => {
    canHover.current = window.matchMedia?.("(hover: hover)").matches ?? true;
  }, []);

  // End-marker travel = ~20% of the highlight's last line width.
  const travelFromRects = (rects: DOMRectList) =>
    rects.length ? Math.round(rects[rects.length - 1].width * 0.2) : 0;

  // Measure a segment's highlight span directly (used by the auto-demo, which has
  // no pointer event to read the element from).
  const travelForIndex = (i: number) => {
    const wrapper = paraRef.current?.children[i] as HTMLElement | undefined;
    const hl = wrapper?.firstElementChild as HTMLElement | undefined;
    return hl ? travelFromRects(hl.getClientRects()) : 0;
  };

  const onHover = (i: number, el: HTMLElement) => {
    if (demoRunning.current) return; // ignore passive hover while the demo plays
    trackRef.current = travelFromRects(el.getClientRects());
    animSeq.current += 1; // bump so the effect re-runs even on the same index
    setHovered(i);
  };

  // Play the "settle" on every hover via the Web Animations API (reliable replay).
  useEffect(() => {
    if (hovered === null) return;
    const dur = 380;
    const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
    const hi = hiRef.current;
    const end = endRef.current;
    const t = trackRef.current;
    if (hi) {
      hi.animate(
        [{ backgroundSize: "80% 100%" }, { backgroundSize: "100% 100%" }],
        { duration: dur, easing: ease }
      );
    }
    if (end && t > 0) {
      end.animate(
        [{ transform: `translateX(-${t}px)` }, { transform: "translateX(0)" }],
        { duration: dur, easing: ease }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered, animSeq.current]);
  const segs: Segment[] = Array.isArray(segments) && segments.length > 0
    ? segments
    : fullText
      ? [{ text: fullText, note: "" }]
      : [];

  // Guided highlight sweep: on first appearance, auto-play the highlight through
  // each beat in sequence, then clear — so the user sees the affordance and
  // realises they can hover/tap too. Cancels the instant they interact, and
  // respects reduced-motion. Runs once on mount (only for the lead card).
  useEffect(() => {
    if (!autoDemo || segs.length === 0) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    demoCancelled.current = false;
    demoRunning.current = true;
    const startDelay = 480;
    const stepMs = 640;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // A deliberate tap / pointer-down anywhere hands control to the user.
    const onUserAbort = () => { demoCancelled.current = true; demoRunning.current = false; };
    window.addEventListener("pointerdown", onUserAbort, { once: true });

    segs.forEach((_, i) => {
      timers.push(setTimeout(() => {
        if (demoCancelled.current) return;
        // Measure the segment so the end marker rides the box edge as it settles,
        // exactly like a real hover does.
        trackRef.current = travelForIndex(i);
        animSeq.current += 1;          // replay the settle on each beat
        setHovered(i);
      }, startDelay + i * stepMs));
    });
    // Clear the highlight at the end and release control to normal hover.
    timers.push(setTimeout(() => {
      demoRunning.current = false;
      if (!demoCancelled.current) setHovered(null);
    }, startDelay + segs.length * stepMs + 120));

    return () => {
      demoRunning.current = false;
      timers.forEach(clearTimeout);
      window.removeEventListener("pointerdown", onUserAbort);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="surface-dark"
      style={{
        border: `2px solid ${INK}`,
        boxShadow: isChosen ? `7px 7px 0 ${LIME}` : "none",
        opacity: otherChosen ? 0.5 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Header band */}
      <div style={{ position: "relative", display: "flex", alignItems: "stretch", borderBottom: `2px solid ${LIME}` }}>
        <div
          style={{
            borderRight: "2px solid rgba(255,255,255,0.16)",
            padding: "12px 22px",
            display: "flex",
            alignItems: "center",
            backgroundColor: isChosen ? LIME : "transparent",
          }}
        >
          <span
            style={{
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: "clamp(40px, 10vw, 60px)",
              lineHeight: 0.8,
              color: isChosen ? ON_LIME : LIME,
              WebkitTextStroke: isChosen ? "0" : `2px ${LIME}`,
              ...(isChosen ? {} : { color: "transparent" }),
            }}
          >
            {index}
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 20px" }}>
          <span
            style={{
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: "clamp(1.15rem, 4.5vw, 1.6rem)",
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: "#FFFFFF",
              lineHeight: 1.02,
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "clamp(22px, 5vw, 32px)" }}>
        {/* Paragraph rendered as hoverable segments */}
        <p ref={paraRef} style={{ fontFamily: BODY, fontSize: "1.05rem", lineHeight: 1.85, color: "#FFFFFF", marginBottom: 12 }}>
          {segs.map((seg, i) => {
            const text = seg.text;
            const firstSp = text.indexOf(" ");
            const lastSp = text.lastIndexOf(" ");
            let content: React.ReactNode = text;
            if (hovered === i) {
              if (firstSp === -1) {
                // single word — keep both markers glued to it
                content = (
                  <span style={{ whiteSpace: "nowrap" }}>
                    <TriMarker pos="start" />{text}<TriMarker pos="end" innerRef={endRef} />
                  </span>
                );
              } else {
                // glue the start marker to the first word and the end marker to
                // the last word so neither can be stranded on an adjacent line
                content = (
                  <>
                    <span style={{ whiteSpace: "nowrap" }}>
                      <TriMarker pos="start" />{text.slice(0, firstSp)}
                    </span>
                    {text.slice(firstSp, lastSp + 1)}
                    <span style={{ whiteSpace: "nowrap" }}>
                      {text.slice(lastSp + 1)}<TriMarker pos="end" innerRef={endRef} />
                    </span>
                  </>
                );
              }
            }
            const on = hovered === i;
            return (
              <span key={i}>
                <span
                  ref={on ? hiRef : undefined}
                  onMouseEnter={e => { if (canHover.current) onHover(i, e.currentTarget); }}
                  onMouseLeave={() => { if (canHover.current) setHovered(null); }}
                  onClick={e => { demoCancelled.current = true; demoRunning.current = false; if (hovered === i) { setHovered(null); } else { onHover(i, e.currentTarget); } }}
                  style={{
                    position: "relative",
                    // On the lime highlight the text must be ink in BOTH themes —
                    // ON_LIME doesn't flip, so it stays black on green in dark mode.
                    color: on ? ON_LIME : "#FFFFFF",
                    // lime fill grows its last 20% on appear (animated via WAAPI); text doesn't move
                    backgroundImage: on ? `linear-gradient(${LIME}, ${LIME})` : "none",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "left center",
                    backgroundSize: "100% 100%",
                    padding: "0.05em 0.12em",
                    cursor: "pointer",
                    transition: "color 0.12s ease",
                    WebkitBoxDecorationBreak: "clone",
                    boxDecorationBreak: "clone",
                  }}
                >
                  {content}
                </span>
                {i < segs.length - 1 ? " " : ""}
              </span>
            );
          })}
        </p>

        {/* Fixed-height slot: shows the hover/tap hint at rest, and the hovered
            beat's note on hover — reserved height so nothing shifts. */}
        <div style={{ minHeight: 42, marginBottom: 4 }}>
          {hovered !== null ? (
            <span style={{ fontFamily: BODY, fontSize: "0.85rem", lineHeight: 1.5, color: "#FFFFFF" }}>
              <span style={{ color: LIME, fontWeight: 600 }}>Beat {hovered + 1}/{segs.length} — </span>
              {segs[hovered].note}
            </span>
          ) : (
            <span style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: LIME }}>
              Hover or tap the text
            </span>
          )}
        </div>

        {/* Credibility (origin/principle) + the actual beat-by-beat flow */}
        <div style={{ borderTop: "2px solid rgba(255,255,255,0.16)", paddingTop: 16, marginTop: 14 }}>
          {origin && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
              <span style={{ width: 9, height: 9, backgroundColor: LIME, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.92rem", letterSpacing: "0.06em", textTransform: "uppercase", color: LIME }}>
                Rooted in {origin}
              </span>
            </div>
          )}
          {rationale && (
            <p style={{ fontFamily: BODY, fontSize: "0.86rem", lineHeight: 1.6, color: "#B9BBAE", maxWidth: 560 }}>
              {rationale}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {isChosen ? (
            <>
              <ChosenToggle onUnchoose={onUnchoose} />
              <CopyButton text={fullText} />
              <ShareButton text={fullText} />
            </>
          ) : otherChosen ? null : (
            <Button onClick={onChoose} variant="primary">
              Choose {index} →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pending card (the eloquent option, still being written) ──────────────────

function PendingCard({ index, error }: { index: string; error?: string | null }) {
  return (
    <div className="surface-dark" style={{ border: `2px solid ${INK}` }}>
      {/* Header band — mirrors OptionCard, but the number is hollow and the label muted */}
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: `2px solid ${LIME}` }}>
        <div style={{ borderRight: "2px solid rgba(255,255,255,0.16)", padding: "12px 22px", display: "flex", alignItems: "center" }}>
          <span
            style={{
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: "clamp(40px, 10vw, 60px)",
              lineHeight: 0.8,
              color: "transparent",
              WebkitTextStroke: `2px ${LIME}`,
            }}
          >
            {index}
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 20px" }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.15rem, 4.5vw, 1.6rem)", letterSpacing: "-0.01em", textTransform: "uppercase", color: DARK_MUTED, lineHeight: 1.02 }}>
            {error ? "Couldn’t finish this one" : "Crafting the expressive take…"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "clamp(22px, 5vw, 32px)" }}>
        {error ? (
          <p style={{ fontFamily: BODY, fontSize: "0.95rem", lineHeight: 1.6, color: "#FFFFFF" }}>
            {error}
          </p>
        ) : (
          <>
            <LoadingBar expectedMs={GEN_EXPECTED_MS_B} />
            <p style={{ fontFamily: BODY, fontSize: "0.86rem", lineHeight: 1.6, color: "#B9BBAE", marginTop: 16, maxWidth: 520 }}>
              Taking extra care to draft something really meaningful — just a few more seconds. Have a read of option {pad2(Number(index) - 1)} while you wait.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [rawInput, setRawInput] = useState("");
  const [audience, setAudience] = useState<Audience | null>(null);
  const [sampling, setSampling] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const baseTextRef = useRef("");
  const streamRef = useRef<MediaStream | null>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState<{ limit: number; resetsAt: string } | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [focused, setFocused] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Dark mode ──
  // Tap the logomark to toggle. The choice is saved per-device and applied to
  // <html data-theme>, which flips the CSS variables in globals.css across the
  // whole app. The initial value is also set pre-paint by a small script in
  // layout.tsx so a saved dark theme never flashes light on load.
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("lr-theme"); } catch { /* ignore */ }
    const initial = saved === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);
  function toggleTheme() {
    // Read the live <html> attribute as the source of truth, flip it, and apply
    // the side effects once — keeping the state updater itself pure (so React's
    // dev double-invoke can't cancel the toggle).
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("lr-theme", next); } catch { /* ignore */ }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "dark" ? "#1A1A17" : "#E4E4DF");
    setTheme(next);
    hapticTap();
  }
  // Rotation walks the task's stack pool: 0 for a fresh generate, +1 per "Two more".
  const rotationRef = useRef(0);

  const canGenerate = rawInput.trim().length > 0 && !isGenerating;
  const keyboardVisible = useKeyboardVisible(); // pin the CTA above the keyboard while typing

  // One-tap realistic sample for testing, tuned to the selected audience.
  async function generateSample() {
    if (sampling) return;
    setRawInput(""); // clear immediately so the spinner reads as responsive
    setSampling(true);
    try {
      const res = await fetch("/api/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience: audience ?? undefined }),
      });
      const data = await res.json();
      if (data.success && data.message) setRawInput(data.message);
    } catch {
      /* ignore — sampling is a convenience, never blocks the user */
    } finally {
      setSampling(false);
    }
  }

  // Voice dictation via record-and-transcribe (works on mobile browsers, the
  // standalone PWA, and later inside a native webview wrapper).
  useEffect(() => {
    const ok = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined";
    setMicSupported(ok);
    return () => {
      if (vadRef.current) clearInterval(vadRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      try { audioCtxRef.current?.close(); } catch { /* ignore */ }
    };
  }, []);

  function pickMime(): string {
    if (typeof MediaRecorder === "undefined") return "";
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mp4;codecs=mp4a.40.2", "audio/aac", "audio/ogg"];
    for (const t of types) { try { if (MediaRecorder.isTypeSupported(t)) return t; } catch { /* ignore */ } }
    return "";
  }

  function cleanupAudio() {
    if (vadRef.current) { clearInterval(vadRef.current); vadRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    try { audioCtxRef.current?.close(); } catch { /* ignore */ }
    audioCtxRef.current = null;
    analyserRef.current = null;
  }

  async function transcribeClip(blob: Blob, mime: string) {
    setTranscribing(true);
    try {
      const ext = mime.includes("mp4") || mime.includes("aac") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
      const fd = new FormData();
      fd.append("audio", blob, `clip.${ext}`);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.text) {
        const base = baseTextRef.current;
        setRawInput((base ? base + " " + data.text : data.text).trim().slice(0, 500));
      } else {
        setMicError("Couldn’t transcribe that. Tap the mic and try again.");
      }
    } catch {
      setMicError("Couldn’t transcribe that. Tap the mic and try again.");
    } finally {
      setTranscribing(false);
    }
  }

  function stopRecording() {
    if (vadRef.current) { clearInterval(vadRef.current); vadRef.current = null; }
    const mr = mrRef.current;
    if (mr && mr.state !== "inactive") { try { mr.stop(); } catch { /* ignore */ } }
  }

  async function startRecording() {
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia) { setMicError("Voice input needs a secure (https) connection."); return; }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === "NotAllowedError" || name === "SecurityError") setMicError("Microphone is blocked. Allow mic access for this site, then tap again.");
      else if (name === "NotFoundError") setMicError("No microphone found.");
      else setMicError("Couldn’t access the microphone.");
      return;
    }
    streamRef.current = stream;
    baseTextRef.current = rawInput.trim();

    // Analyser drives the live waveform and the silence-based auto-stop.
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
    } catch { /* waveform falls back to CSS animation */ }

    const mime = pickMime();
    let mr: MediaRecorder;
    try {
      mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch {
      mr = new MediaRecorder(stream);
    }
    mrRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const type = mr.mimeType || mime || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      cleanupAudio();
      setListening(false);
      if (blob.size > 0) transcribeClip(blob, type);
    };
    try { mr.start(); } catch { cleanupAudio(); setMicError("Couldn’t start recording."); return; }
    setListening(true);

    // Auto-stop: after speech, on a ~1.5s pause; hard cap 30s; 7s if no speech.
    const analyser = analyserRef.current;
    if (analyser) {
      const buf = new Uint8Array(analyser.fftSize);
      let speech = false, lastLoud = performance.now();
      const started = performance.now();
      vadRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / buf.length);
        const now = performance.now();
        if (rms > 0.045) { speech = true; lastLoud = now; }
        if (now - started > 30000) stopRecording();
        else if (speech && now - lastLoud > 1500) stopRecording();
        else if (!speech && now - started > 7000) stopRecording();
      }, 150);
    } else {
      vadRef.current = setInterval(() => stopRecording(), 12000);
    }
  }

  function toggleDictation() {
    if (listening) stopRecording(); else startRecording();
  }

  async function generate() {
    if (!canGenerate) return;
    setIsGenerating(true);
    setAppState("loading");
    setError(null);
    setResult(null);

    const currentAudience = audience;
    const rotation = rotationRef.current;
    const baseNum = rotation * 2 + 1;
    const call = (which: "a" | "b", divergeFrom?: string) =>
      fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_input: rawInput.trim(), audience: currentAudience ?? undefined, rotation, which, diverge_from: divergeFrom }),
      }).then(r => r.json());

    // Hybrid: fire both at once. Option A (fast model) renders immediately; option
    // B (eloquent model) fills in underneath when it's ready.
    const pa = call("a");
    const pb = call("b");

    let aOption: OptionData | null = null;
    try {
      const da = await pa;
      if (!da.success) {
        if (da.limit_reached) {
          setLimitReached({ limit: da.limit ?? 0, resetsAt: da.resets_at ?? "" });
          setShowLimitModal(true);
          setAppState("idle");
          setIsGenerating(false);
          return; // the parallel "b" call (if any) is ignored
        }
        throw new Error(da.error || "Generation failed");
      }
      aOption = da.option;
      setResult({ a: da.option, b: null, bError: null, eventId: da.event_id, brief: da.brief, audience: currentAudience, baseNum, moreAvailable: da.more_available ?? false });
      setAppState("results");
      hapticSuccess();
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAppState("error");
      hapticError();
      setIsGenerating(false);
      return;
    }

    // Option B continues in the background.
    try {
      const db = await pb;
      if (!db.success) throw new Error(db.error || "Generation failed");
      let bOption: OptionData = db.option;
      // Safety net: if the two options came back too alike, re-craft B so the
      // user gets two genuinely different approaches, not two versions of one.
      if (aOption && similarity(aOption.option, bOption.option) > 0.45) {
        setResult(prev => (prev ? { ...prev, b: null } : prev));
        try {
          const db2 = await call("b", aOption.option);
          if (db2.success && db2.option) bOption = db2.option;
        } catch { /* keep the original B */ }
      }
      setResult(prev => (prev ? { ...prev, b: bOption } : prev));
    } catch (err) {
      setResult(prev => (prev ? { ...prev, bError: err instanceof Error ? err.message : "Couldn’t craft the second option" } : prev));
    } finally {
      setIsGenerating(false);
    }
  }

  function handleChoose(choice: "a" | "b") {
    if (!result) return;
    // Purely a client-side UI state — nothing is stored.
    setResult(prev => (prev ? { ...prev, chosen: choice } : null));
  }

  // Tap "Chosen" again to clear the pick and bring both options back.
  function handleUnchoose() {
    setResult(prev => (prev ? { ...prev, chosen: undefined } : null));
  }

  // Fresh generate (button / ⌘Enter): reset rotation to the first stack pair.
  function startGenerate() {
    rotationRef.current = 0;
    generate();
  }

  // "Two more options": advance to the next pair in the task's stack pool.
  function handleRegenerate() {
    rotationRef.current += 1;
    setResult(null);
    generate();
  }

  function handleReset() {
    setAppState("idle");
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main style={{ minHeight: "100dvh", padding: "clamp(16px, 4vw, 40px)", paddingTop: "calc(clamp(16px, 4vw, 40px) + env(safe-area-inset-top))", paddingBottom: "calc(clamp(16px, 4vw, 40px) + env(safe-area-inset-bottom))" }}>
      {/* Vertical rail */}
      <div className="vrail" style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase", color: INK }}>
        Landright — Make your message land right
      </div>

      <div style={{ maxWidth: 660, margin: "0 auto" }}>

        {/* ═══ Meta bar ═══ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              style={{ display: "inline-flex", border: "none", background: "transparent", padding: 8, margin: -8, cursor: "pointer", borderRadius: 0, WebkitTapHighlightColor: "transparent" }}
            >
              <LogoMark />
            </button>
            <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "1.35rem", letterSpacing: "-0.02em", color: INK }}>
              LANDRIGHT
            </span>
          </div>
          {/* Auth controls (signed-out: sign in / sign up; signed-in: account).
              Shown only when login/billing is active. Hidden for the free web app
              and the dev preview (no ClerkProvider mounted → these would blank the
              page). */}
          {!AUTH_DISABLED && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.07em", textTransform: "uppercase", padding: "5px 11px", lineHeight: 1.1, border: `2px solid ${INK}`, cursor: "pointer", borderRadius: 0, backgroundColor: "transparent", color: INK }}>Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.07em", textTransform: "uppercase", padding: "5px 11px", lineHeight: 1.1, border: `2px solid var(--lime-edge)`, cursor: "pointer", borderRadius: 0, backgroundColor: LIME, color: ON_LIME }}>Sign up</button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
          )}
        </div>

        {/* ═══ Hero ═══ */}
        <section style={{ marginBottom: "clamp(10px, 2.5vw, 16px)" }}>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: "clamp(3rem, 13vw, 5.6rem)",
              lineHeight: 0.84,
              letterSpacing: "-0.035em",
              textTransform: "uppercase",
              color: INK,
              marginBottom: 14,
            }}
          >
            Make your{" "}
            <span style={{ fontStyle: "italic" }}>message</span><br />
            <Mark>land right.</Mark>
          </h1>
          <p style={{ fontFamily: BODY, fontWeight: 500, fontSize: "1.05rem", lineHeight: 1.55, color: INK }}>
            Grounded in decades of psychology research, LANDRIGHT helps you with
            messages that feel too important to improvise.
          </p>
        </section>

        {/* ═══ App — gated behind sign-in + an active Plus subscription ═══ */}
        <SubscriptionGate>
        {/* ═══ Input ═══ */}
        <section style={{ marginBottom: "clamp(14px, 3vw, 22px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <SampleTag loading={sampling} onClick={generateSample} />
            <span style={{ fontFamily: COND, fontWeight: 600, fontSize: "0.85rem", color: MUTED, fontVariantNumeric: "tabular-nums" }}>
              {rawInput.length}/500
            </span>
          </div>

          <div
            className="surface-dark"
            style={{
              position: "relative",
              border: `2px solid ${INK}`,
              boxShadow: focused ? `4px 4px 0 ${LIME}` : "none",
              transition: "box-shadow 0.1s ease",
              marginBottom: 18,
            }}
          >
            <textarea
              className="dark-input"
              value={rawInput}
              onChange={e => { hapticKeystroke(); setRawInput(e.target.value); }}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) startGenerate(); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={sampling || listening || transcribing ? "" : "Write the rough version. Messy is fine."}
              rows={3}
              maxLength={500}
              style={{
                width: "100%",
                resize: "none",
                fontFamily: BODY,
                fontSize: "1.05rem",
                lineHeight: 1.6,
                color: "#FFFFFF",
                caretColor: LIME,
                backgroundColor: "transparent",
                border: "none",
                padding: "18px 20px",
                outline: "none",
                borderRadius: 0,
                display: "block",
              }}
            />
            {/* While a sample drafts: the window itself shows it's working. */}
            {sampling && (
              <div style={{ position: "absolute", top: 0, left: 0, padding: "18px 20px", pointerEvents: "none" }}>
                <LoadingDots />
              </div>
            )}
            {/* While dictating: live waveform fills the window. */}
            {listening && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, pointerEvents: "none" }}>
                <LiveWaveform analyser={analyserRef.current} />
              </div>
            )}
            {/* While transcribing the clip: quiet dots. */}
            {transcribing && (
              <div style={{ position: "absolute", top: 0, left: 0, padding: "18px 20px", pointerEvents: "none" }}>
                <LoadingDots />
              </div>
            )}
            {/* Voice dictation toggle (only when the browser supports it). */}
            {micSupported && <MicButton active={listening} disabled={transcribing} onClick={toggleDictation} />}
          </div>

          {micError && (
            <div style={{ marginTop: -18, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, backgroundColor: "#E5484D", flexShrink: 0 }} />
              <span style={{ fontFamily: BODY, fontSize: "0.82rem", lineHeight: 1.4, color: MUTED }}>{micError}</span>
            </div>
          )}

          {/* Audience */}
          <div style={{ marginBottom: 12 }}>
            <Tag variant="solid" shadow>Who needs to hear this?</Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 30 }}>
            {AUDIENCES.map(a => (
              <Chip key={a.value} active={audience === a.value} label={a.label} onClick={() => setAudience(audience === a.value ? null : a.value)} />
            ))}
          </div>

          {/* While the keyboard is up, pin the CTA just above it so it's never covered. */}
          <div style={keyboardVisible ? { position: "sticky", bottom: 0, zIndex: 20, background: GROUND, paddingTop: 10, paddingBottom: 10, boxShadow: "0 -1px 0 rgba(17,17,16,0.18)" } : undefined}>
            <Button onClick={startGenerate} disabled={!canGenerate || !!limitReached} variant="primary" full>
              {isGenerating ? "Composing…" : limitReached ? "Monthly limit reached" : "Make it land →"}
            </Button>
          </div>

          {appState === "loading" && <LoadingBar />}
          {!isGenerating && (limitReached ? (
            <p style={{ textAlign: "center", marginTop: 12, fontFamily: COND, fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.03em", color: INK, lineHeight: 1.4 }}>
              You&rsquo;ve used all {limitReached.limit} generations this month — resets {formatReset(limitReached.resetsAt)}.
            </p>
          ) : (
            <p style={{ textAlign: "center", marginTop: 12, fontFamily: COND, fontWeight: 600, fontSize: "0.82rem", letterSpacing: "0.03em", color: MUTED, lineHeight: 1.4 }}>
              Line-by-line reasoning. Rooted in relationship communication principles.
            </p>
          ))}
        </section>

        {/* ═══ Monthly limit pop-up ═══ */}
        {showLimitModal && limitReached && (
          <div
            onClick={() => setShowLimitModal(false)}
            style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(17,17,16,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <div
              onClick={e => e.stopPropagation()}
              className="surface-dark"
              style={{ border: `2px solid ${INK}`, boxShadow: `6px 6px 0 ${LIME}`, padding: "clamp(24px, 5vw, 36px)", maxWidth: 440, width: "100%" }}
            >
              <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", color: LIME, margin: 0 }}>Monthly limit</p>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.5rem, 5vw, 2rem)", lineHeight: 1.04, letterSpacing: "-0.02em", textTransform: "uppercase", color: "#FFFFFF", margin: "10px 0 12px" }}>You&rsquo;ve hit your limit for this month.</h2>
              <p style={{ fontFamily: BODY, fontSize: "1rem", lineHeight: 1.55, color: "#E8E8E2", margin: "0 0 22px" }}>
                You&rsquo;ve used all {limitReached.limit} generations included with your subscription. It resets on {formatReset(limitReached.resetsAt)}.
              </p>
              <button
                onClick={() => setShowLimitModal(false)}
                style={{ fontFamily: COND, fontWeight: 900, fontSize: "1.02rem", letterSpacing: "0.05em", textTransform: "uppercase", padding: "14px 24px", borderRadius: 0, cursor: "pointer", border: `2px solid var(--lime-edge)`, backgroundColor: LIME, color: ON_LIME, boxShadow: `4px 4px 0 var(--shadow)`, width: "100%" }}
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* ═══ Error ═══ */}
        {appState === "error" && error && (
          <div style={{ border: `2px solid ${INK}`, borderLeft: `6px solid #E5484D`, padding: "16px 18px", marginBottom: 28, fontFamily: BODY, fontWeight: 600, fontSize: "0.85rem", color: INK }}>
            {error}
          </div>
        )}

        {/* ═══ Results ═══ */}
        {appState === "results" && result && (
          <section ref={resultsRef}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
              <Tag variant="ink" size="xs">Results</Tag>
              {result.brief.inferred_goal && (
                <Tag variant="outline" size="xs">{result.brief.inferred_goal.replace(/_/g, " ")}</Tag>
              )}
              {result.audience && (
                <Tag variant="outline" size="xs">To {result.audience}</Tag>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 30 }}>
              {result.a && (
                <OptionCard
                  index={pad2(result.baseNum)}
                  label={result.a.stack_label}
                  segments={result.a.breakdown}
                  fullText={result.a.option}
                  origin={result.a.origin}
                  rationale={result.a.rationale}
                  isChosen={result.chosen === "a"}
                  otherChosen={result.chosen === "b"}
                  onChoose={() => handleChoose("a")}
                  onUnchoose={handleUnchoose}
                  autoDemo
                />
              )}
              {result.b ? (
                <OptionCard
                  index={pad2(result.baseNum + 1)}
                  label={result.b.stack_label}
                  segments={result.b.breakdown}
                  fullText={result.b.option}
                  origin={result.b.origin}
                  rationale={result.b.rationale}
                  isChosen={result.chosen === "b"}
                  otherChosen={result.chosen === "a"}
                  onChoose={() => handleChoose("b")}
                  onUnchoose={handleUnchoose}
                  autoDemo
                />
              ) : (
                <PendingCard index={pad2(result.baseNum + 1)} error={result.bError} />
              )}
            </div>

            {(() => {
              const flags = [...(result.a?.safety_flags ?? []), ...(result.b?.safety_flags ?? [])];
              return flags.length > 0 ? (
                <div style={{ border: `2px solid ${INK}`, borderLeft: `6px solid ${LIME}`, padding: "14px 18px", marginBottom: 28, fontFamily: BODY, fontWeight: 600, fontSize: "0.74rem", color: MUTED }}>
                  {flags.join("; ")}
                </div>
              ) : null;
            })()}

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Button onClick={handleRegenerate} disabled={isGenerating || !result.moreAvailable} variant="outline">
                {isGenerating ? "Generating…" : result.moreAvailable ? "Two more →" : "No more options"}
              </Button>
              <Button onClick={handleReset} variant="outline">
                Start over
              </Button>
            </div>
          </section>
        )}
        </SubscriptionGate>
      </div>
    </main>
  );
}
