"use client";

import { useState, useRef, useEffect } from "react";
import type { GenerationOutput, Audience, Segment } from "@/lib/types";
import { APP_VERSION } from "@/lib/version";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState = "idle" | "loading" | "results" | "error";

interface ResultState {
  output: GenerationOutput;
  eventId: string;
  brief: { inferred_goal: string; stack_a: string; stack_b: string };
  audience: Audience | null;
  chosen?: "a" | "b";
  baseNum: number; // number of option A; B is baseNum + 1 (counts up on "Two more")
}

const pad2 = (n: number) => String(n).padStart(2, "0");

// ─── Brand tokens ─────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "partner", label: "Partner" },
  { value: "friend", label: "Friend" },
  { value: "family", label: "Family" },
];

// ─── Primitives ───────────────────────────────────────────────────────────────

type TagVariant = "solid" | "outline" | "ink";

function Tag({ children, variant = "solid", size = "sm" }: { children: React.ReactNode; variant?: TagVariant; size?: "sm" | "xs" }) {
  const styles: Record<TagVariant, React.CSSProperties> = {
    solid: { backgroundColor: LIME, color: INK, border: `2px solid ${INK}` },
    outline: { backgroundColor: "transparent", color: INK, border: `2px solid ${INK}` },
    ink: { backgroundColor: INK, color: LIME, border: `2px solid ${INK}` },
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
        color: INK,
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
  // primary = lime fill (pops on dark cards); cta = ink fill + lime text
  // (matches the "01 — Communication Engine" tag); outline = transparent.
  const look = {
    primary: { bg: LIME, color: INK, shadow: INK },
    cta: { bg: INK, color: LIME, shadow: LIME },
    outline: { bg: "transparent", color: INK, shadow: INK },
  }[variant];
  const base: React.CSSProperties = {
    fontFamily: COND,
    fontWeight: 900,
    fontSize: "1rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    border: `2px solid ${disabled ? MUTED : INK}`,
    padding: "16px 26px",
    width: full ? "100%" : undefined,
    cursor: disabled ? "not-allowed" : "pointer",
    backgroundColor: disabled ? GROUND2 : look.bg,
    color: disabled ? MUTED : look.color,
    boxShadow: disabled ? "none" : pressed ? `0px 0px 0 ${look.shadow}` : `4px 4px 0 ${look.shadow}`,
    transform: pressed ? "translate(4px, 4px)" : "none",
    transition: "transform 0.08s ease, box-shadow 0.08s ease",
    borderRadius: 0,
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={base}
    >
      {children}
    </button>
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
    <button
      onClick={copy}
      style={{
        fontFamily: COND,
        fontWeight: 900,
        fontSize: "0.9rem",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        border: `2px solid ${LIME}`,
        backgroundColor: copied ? LIME : "transparent",
        color: copied ? INK : LIME,
        padding: "9px 18px",
        cursor: "pointer",
        borderRadius: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
      }}
    >
      {copied ? "✓ Copied" : "⧉ Copy text"}
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
        border: `2px solid ${INK}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: size * 0.11,
        padding: size * 0.2,
      }}
    >
      {[0, 1, 2].map(i => (
        <div key={i} style={{ height: 2, backgroundColor: INK, transform: `skewX(-18deg)` }} />
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

function LoadingBar() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      const t = performance.now() - start;
      const p =
        t < GEN_EXPECTED_MS
          ? 0.9 * (t / GEN_EXPECTED_MS)
          : 0.9 + 0.085 * (1 - Math.exp(-(t - GEN_EXPECTED_MS) / 2200));
      setPct(p);
    }, 50);
    return () => clearInterval(id);
  }, []);

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
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  // Distance the end marker travels = ~20% of the highlight's last line width.
  const trackRef = useRef(0);
  const hiRef = useRef<HTMLSpanElement | null>(null);
  const endRef = useRef<HTMLSpanElement | null>(null);
  const animSeq = useRef(0);
  // True on real hover devices (mouse). On touch, hover is ignored so the
  // emulated mouseenter can't fight the tap (which used to flash then clear it).
  const canHover = useRef(true);
  useEffect(() => {
    canHover.current = window.matchMedia?.("(hover: hover)").matches ?? true;
  }, []);

  const onHover = (i: number, el: HTMLElement) => {
    const rects = el.getClientRects();
    trackRef.current = rects.length ? Math.round(rects[rects.length - 1].width * 0.2) : 0;
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
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: `2px solid ${LIME}` }}>
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
              color: isChosen ? INK : LIME,
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
        <p style={{ fontFamily: BODY, fontSize: "1.05rem", lineHeight: 1.85, color: "#FFFFFF", marginBottom: 20 }}>
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
                  onClick={e => { if (hovered === i) { setHovered(null); } else { onHover(i, e.currentTarget); } }}
                  style={{
                    position: "relative",
                    color: on ? INK : "#FFFFFF",
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

        {/* Near-text interactive line: a prompt that becomes the hovered beat's note */}
        <div style={{ minHeight: 22, marginTop: 2 }}>
          {hovered !== null ? (
            <span style={{ fontFamily: BODY, fontSize: "0.85rem", lineHeight: 1.5, color: "#FFFFFF" }}>
              <span style={{ color: LIME, fontWeight: 600 }}>Beat {hovered + 1}/{segs.length} — </span>
              {segs[hovered].note}
            </span>
          ) : (
            <span style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#7E8470" }}>
              Hover or tap the text for more
            </span>
          )}
        </div>

        {/* Credibility (origin/principle) + the actual beat-by-beat flow */}
        <div style={{ borderTop: "2px solid rgba(255,255,255,0.16)", paddingTop: 16, marginTop: 18 }}>
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
              <Tag variant="solid">✓ Chosen</Tag>
              <CopyButton text={fullText} />
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [rawInput, setRawInput] = useState("");
  const [audience, setAudience] = useState<Audience | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  // Rotation walks the task's stack pool: 0 for a fresh generate, +1 per "Two more".
  const rotationRef = useRef(0);

  const canGenerate = rawInput.trim().length > 0 && !isGenerating;

  async function generate() {
    if (!canGenerate) return;
    setIsGenerating(true);
    setAppState("loading");
    setError(null);
    setResult(null);

    const currentAudience = audience;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_input: rawInput.trim(), audience: currentAudience ?? undefined, rotation: rotationRef.current }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Generation failed");

      setResult({ output: data.result, eventId: data.event_id, brief: data.brief, audience: currentAudience, baseNum: rotationRef.current * 2 + 1 });
      setAppState("results");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAppState("error");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleChoose(choice: "a" | "b") {
    if (!result) return;
    // Purely a client-side UI state — nothing is stored.
    setResult(prev => (prev ? { ...prev, chosen: choice } : null));
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
    <main style={{ minHeight: "100vh", padding: "clamp(16px, 4vw, 40px)" }}>
      {/* Vertical rail */}
      <div className="vrail" style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase", color: INK }}>
        Landright — Make your message land right
      </div>

      <div style={{ maxWidth: 660, margin: "0 auto" }}>

        {/* ═══ Meta bar ═══ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LogoMark />
            <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "1.35rem", letterSpacing: "-0.02em", color: INK }}>
              LANDRIGHT
            </span>
          </div>
          <Tag variant="outline" size="xs">v{APP_VERSION}</Tag>
        </div>

        {/* ═══ Hero ═══ */}
        <section style={{ marginBottom: "clamp(32px, 7vw, 52px)" }}>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontWeight: 900,
              fontSize: "clamp(3rem, 13vw, 5.6rem)",
              lineHeight: 0.84,
              letterSpacing: "-0.035em",
              textTransform: "uppercase",
              color: INK,
              marginBottom: 24,
            }}
          >
            Make your{" "}
            <span style={{ fontStyle: "italic" }}>message</span><br />
            <Mark>land right.</Mark>
          </h1>
          <p style={{ fontFamily: BODY, fontWeight: 500, fontSize: "1.05rem", lineHeight: 1.55, color: INK }}>
            Grounded in decades of psychology research, LANDRIGHT elevates your
            message to help ease defensiveness and allow the person you care
            about to stay open to what you have to say.
          </p>
        </section>

        {/* ═══ Input ═══ */}
        <section style={{ marginBottom: "clamp(28px, 6vw, 44px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Tag variant="solid">What do you want to say?</Tag>
            <span style={{ fontFamily: COND, fontWeight: 600, fontSize: "0.85rem", color: MUTED, fontVariantNumeric: "tabular-nums" }}>
              {rawInput.length}/500
            </span>
          </div>

          <div
            className="surface-dark"
            style={{
              border: `2px solid ${INK}`,
              boxShadow: focused ? `4px 4px 0 ${LIME}` : "none",
              transition: "box-shadow 0.1s ease",
              marginBottom: 30,
            }}
          >
            <textarea
              className="dark-input"
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) startGenerate(); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Write the rough thing you actually want to say…"
              rows={4}
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
          </div>

          {/* Audience */}
          <div style={{ marginBottom: 12 }}>
            <Tag variant="solid">Who&apos;s this for?</Tag>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 30 }}>
            {AUDIENCES.map(a => {
              const active = audience === a.value;
              return (
                <button
                  key={a.value}
                  onClick={() => setAudience(active ? null : a.value)}
                  style={{
                    fontFamily: COND,
                    fontWeight: 900,
                    fontSize: "0.95rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    border: `2px solid ${INK}`,
                    backgroundColor: active ? INK : "transparent",
                    color: active ? LIME : INK,
                    padding: "14px 12px",
                    cursor: "pointer",
                    borderRadius: 0,
                    boxShadow: active ? `3px 3px 0 ${LIME}` : "none",
                    transition: "box-shadow 0.08s ease",
                  }}
                >
                  {a.label}
                </button>
              );
            })}
          </div>

          <Button onClick={startGenerate} disabled={!canGenerate} variant="primary" full>
            {isGenerating ? "Composing…" : "Generate two options →"}
          </Button>

          {isGenerating && <LoadingBar />}
          {!isGenerating && (
            <p style={{ textAlign: "center", marginTop: 12, fontFamily: COND, fontWeight: 600, fontSize: "0.78rem", letterSpacing: "0.1em", color: MUTED, textTransform: "uppercase" }}>
              ⌘ Enter to generate
            </p>
          )}
        </section>

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
              <OptionCard
                index={pad2(result.baseNum)}
                label={result.output.stack_a_label}
                segments={result.output.breakdown_a}
                fullText={result.output.option_a}
                origin={result.output.stack_a_origin}
                rationale={result.output.stack_a_rationale}
                isChosen={result.chosen === "a"}
                otherChosen={result.chosen === "b"}
                onChoose={() => handleChoose("a")}
              />
              <OptionCard
                index={pad2(result.baseNum + 1)}
                label={result.output.stack_b_label}
                segments={result.output.breakdown_b}
                fullText={result.output.option_b}
                origin={result.output.stack_b_origin}
                rationale={result.output.stack_b_rationale}
                isChosen={result.chosen === "b"}
                otherChosen={result.chosen === "a"}
                onChoose={() => handleChoose("b")}
              />
            </div>

            {result.output.safety_flags?.length > 0 && (
              <div style={{ border: `2px solid ${INK}`, borderLeft: `6px solid ${LIME}`, padding: "14px 18px", marginBottom: 28, fontFamily: BODY, fontWeight: 600, fontSize: "0.74rem", color: MUTED }}>
                {result.output.safety_flags.join("; ")}
              </div>
            )}

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Button onClick={handleRegenerate} disabled={isGenerating} variant="outline">
                {isGenerating ? "Generating…" : "Two more →"}
              </Button>
              <Button onClick={handleReset} variant="outline">
                Start over
              </Button>
            </div>
          </section>
        )}

        {/* ═══ Footer ═══ */}
        <footer style={{ marginTop: "clamp(40px, 8vw, 64px)", borderTop: `2px solid ${INK}`, paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.02em", color: INK }}>
            LANDRIGHT
          </span>
          <span style={{ fontFamily: COND, fontWeight: 600, fontSize: "0.74rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>
            Make your message land right · v{APP_VERSION}
          </span>
        </footer>
      </div>
    </main>
  );
}
