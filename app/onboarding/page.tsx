"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { APP_VERSION } from "@/lib/version";

// ─── Brand tokens (mirror app/page.tsx, same design system) ───────────────────

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

// ─── State types ──────────────────────────────────────────────────────────────

type Moment =
  | "apology_without_self_defence" | "need_without_pressure" | "hurt_without_blame"
  | "boundary_without_coldness" | "reconnect_after_distance" | "pause_before_escalation"
  | "truth_without_attack";
type ReceiverRisk = "defensive" | "needy" | "blaming" | "cold" | "pressuring" | "shutting_down" | "attacking";
type DesiredLanding = "accountable" | "clear_request" | "understood_impact" | "warm_boundary" | "open_door" | "safe_pause" | "honest_but_receivable";

const PAYWALL_VARIANT = "freemium_preview" as const;
const MIN_CHARS = 10;

// ─── Flow ─────────────────────────────────────────────────────────────────────

const STEPS = [
  "splash", "recognition", "moment",
  "mirror", "trap", "why", "route_map", "demo_input", "processing", "route_cards", "compare", "line_breakdown", "rooted_in",
  "pattern_library", "generic_ai", "try_yours", "result", "paywall",
] as const;
type StepId = (typeof STEPS)[number];

// ─── Branch data (verbatim from spec) ─────────────────────────────────────────

interface Branch {
  title: string;
  cardBody: string;
  receiver_risk: ReceiverRisk;
  desired_landing: DesiredLanding;
  mirror: { headline: string; lead: string; youMean: string; theyHear: string };
  trap: { headline: string; body: string; theyHear: string };
  why: { headline: string; body: string };
  routeMap: { risk: string; routeA: string; routeB: string; lineLogic: string; rootedIn: string[] };
  demo: { input: string; note: string };
  routes: { a: { label: string; text: string; bestWhen: string }; b: { label: string; text: string; bestWhen: string } };
  compare: { headline: string; lineA: string; lineB: string };
  breakdown: { span: string; why: string; rootedIn: string }[];
  rootedIn: { pattern: string; rootedIn: string; usedFor: string; whatChanges: string };
  tryYours: { headline: string; placeholder: string };
}

const BRANCHES: Record<Moment, Branch> = {
  apology_without_self_defence: {
    title: "Apology without self-defence",
    cardBody: "I need to apologise, but I keep explaining myself.",
    receiver_risk: "defensive", desired_landing: "accountable",
    mirror: {
      headline: "You chose apology without self-defence.",
      lead: "This is the apology that starts with “sorry,” then slowly becomes a defence speech.",
      youMean: "You may be trying to explain the pressure.",
      theyHear: "They may hear you trying to escape the impact.",
    },
    trap: {
      headline: "The explanation can arrive too early.",
      body: "In a tense apology, the first sentence sets the temperature. When context comes before impact, the other person may listen for excuses instead of repair.",
      theyHear: "You are sorry, but you still think I caused it.",
    },
    why: {
      headline: "A better apology lets them feel the impact was seen.",
      body: "The job is to put the impact where it belongs, own your part clearly and make the next step feel real. It should not become self-punishment. It should not become a defence speech.",
    },
    routeMap: {
      risk: "Sounds like an excuse",
      routeA: "A real apology", routeB: "Name it before they do",
      lineLogic: "impact first, no defensive “but,” repair made visible",
      rootedIn: ["Effective-apology research", "The Gottman Method", "Perceived partner responsiveness"],
    },
    demo: { input: "Sorry I snapped, but you were pushing me.", note: "This is where the apology starts defending itself." },
    routes: {
      a: { label: "A real apology", text: "I’m sorry I snapped at you. That was unfair, and I can see how it made the conversation feel unsafe. I want to own that before I explain anything else.", bestWhen: "The main repair needed is clear accountability." },
      b: { label: "Name it before they do", text: "I know this may sound like I’m about to make an excuse, so I want to be clear first. Snapping at you was on me. I was overwhelmed, but I should have paused instead of taking it out on you.", bestWhen: "Context matters, but only after responsibility is clear." },
    },
    compare: {
      headline: "Both routes repair, but they do different work.",
      lineA: "A real apology keeps the message clean and accountable.",
      lineB: "Name it before they do helps when you need to include context without letting context become the centre.",
    },
    breakdown: [
      { span: "I want to own that before I explain anything else.", why: "Keeps accountability ahead of context, which makes the apology feel less defensive.", rootedIn: "Accountability-first repair" },
      { span: "I know this may sound like I’m about to make an excuse", why: "Names the likely concern before it becomes the other person’s objection.", rootedIn: "Negative acknowledgment" },
      { span: "I was overwhelmed, but I should have paused", why: "Adds context while keeping responsibility intact.", rootedIn: "Repair with context" },
    ],
    rootedIn: { pattern: "Name it before they do", rootedIn: "Negative acknowledgment and repair communication", usedFor: "Apology without self-defence", whatChanges: "It names the likely concern before context becomes an excuse." },
    tryYours: { headline: "Write the apology before you start explaining it.", placeholder: "Sorry I snapped, but…" },
  },

  need_without_pressure: {
    title: "Need without pressure",
    cardBody: "I need to ask for more without sounding needy.",
    receiver_risk: "needy", desired_landing: "clear_request",
    mirror: {
      headline: "You chose need without pressure.",
      lead: "This is the message where the need is real, but the first draft sounds like a complaint.",
      youMean: "You may mean closeness.",
      theyHear: "They may hear accusation.",
    },
    trap: {
      headline: "A need can sound like a demand.",
      body: "When the message begins with what they never do, they may defend their freedom before they hear what you are asking for.",
      theyHear: "You are failing me, and now you need to fix how I feel.",
    },
    why: {
      headline: "A better ask gives them something they can respond to.",
      body: "The aim is to name the feeling, give one concrete example and turn the need into a request that does not corner them.",
    },
    routeMap: {
      risk: "Sounds needy or demanding",
      routeA: "Feeling, then ask", routeB: "Ask, don’t demand",
      lineLogic: "owned feeling, concrete example, willing request",
      rootedIn: ["Nonviolent Communication", "Emotionally focused communication principles", "Autonomy-supportive communication"],
    },
    demo: { input: "You never make time for me anymore.", note: "This is where a need starts to sound like a complaint." },
    routes: {
      a: { label: "Feeling, then ask", text: "I’ve been missing proper time with you lately. When our evenings keep getting swallowed up, I start to feel less close to you. Could we choose one night this week that is just ours?", bestWhen: "You want the feeling understood and the ask to be clear." },
      b: { label: "Ask, don’t demand", text: "Would you be willing to look at this week with me and find one proper time to connect? I do not want to pressure you. I want us to protect a bit of space for each other.", bestWhen: "The other person may feel pressured or controlled." },
    },
    compare: {
      headline: "One route names the need. One route protects their freedom.",
      lineA: "Feeling, then ask makes the emotional need visible.",
      lineB: "Ask, don’t demand makes the request feel more collaborative.",
    },
    breakdown: [
      { span: "I’ve been missing proper time with you", why: "Names the need without starting from accusation.", rootedIn: "Owned feeling" },
      { span: "When our evenings keep getting swallowed up", why: "Gives a specific pattern rather than a global complaint.", rootedIn: "Concrete example" },
      { span: "Would you be willing", why: "Keeps the ask cooperative instead of coercive.", rootedIn: "Autonomy-preserving request" },
    ],
    rootedIn: { pattern: "Ask, don’t demand", rootedIn: "Nonviolent Communication and autonomy-supportive communication", usedFor: "Need without pressure", whatChanges: "It keeps the request clear without cornering the other person." },
    tryYours: { headline: "Write the thing you need, even if it sounds too much.", placeholder: "I feel like I’m always asking for…" },
  },

  hurt_without_blame: {
    title: "Hurt without blame",
    cardBody: "I need to say I am hurt without blaming them.",
    receiver_risk: "blaming", desired_landing: "understood_impact",
    mirror: {
      headline: "You chose hurt without blame.",
      lead: "This is the message where pain wants to be understood, but the first draft sounds like prosecution.",
      youMean: "You may mean “that landed badly for me.”",
      theyHear: "They may hear “you are the problem.”",
    },
    trap: {
      headline: "Pain can turn into a case against them.",
      body: "When the message assigns motive too quickly, the other person may start defending what they meant instead of hearing what happened to you.",
      theyHear: "You did this on purpose, and now you need to answer for it.",
    },
    why: {
      headline: "A better message protects the impact from becoming an accusation.",
      body: "The feeling stays visible. The example stays concrete. The wording leaves room for their intent without erasing your experience.",
    },
    routeMap: {
      risk: "Sounds accusatory",
      routeA: "Kind but clear", routeB: "Show what’s underneath",
      lineLogic: "impact, no motive-reading, vulnerable need",
      rootedIn: ["The Gottman Method", "Nonviolent Communication", "Emotionally focused communication principles"],
    },
    demo: { input: "You embarrassed me in front of everyone.", note: "This is where hurt starts sounding like blame." },
    routes: {
      a: { label: "Kind but clear", text: "I felt embarrassed when that was said in front of everyone. I do not think you meant to hurt me, but it stayed with me. I would like us to talk about it privately.", bestWhen: "You need the impact to be clear without accusing their intent." },
      b: { label: "Show what’s underneath", text: "I think what hurt most was feeling exposed instead of backed up. I am not trying to make you the villain. I want you to understand why it landed so badly for me.", bestWhen: "The surface complaint is really about a deeper emotional need." },
    },
    compare: {
      headline: "One route names the impact. One route reveals the deeper need.",
      lineA: "Kind but clear helps when the event needs to be named.",
      lineB: "Show what’s underneath helps when the hurt is carrying a more vulnerable meaning.",
    },
    breakdown: [
      { span: "I felt embarrassed", why: "Keeps the sentence anchored in your experience.", rootedIn: "Owned feeling" },
      { span: "I do not think you meant to hurt me", why: "Reduces the need for them to defend intent.", rootedIn: "Motive separation" },
      { span: "feeling exposed instead of backed up", why: "Shows the need underneath the hurt.", rootedIn: "Emotional specificity" },
    ],
    rootedIn: { pattern: "Show what’s underneath", rootedIn: "Emotionally focused communication and the Gottman Method", usedFor: "Hurt without blame", whatChanges: "It keeps your experience clear while leaving room for their intent." },
    tryYours: { headline: "Write the hurt version first. LANDRIGHT will help remove the blame.", placeholder: "You made me feel…" },
  },

  boundary_without_coldness: {
    title: "Boundary without coldness",
    cardBody: "I need to set a boundary without sounding cold.",
    receiver_risk: "cold", desired_landing: "warm_boundary",
    mirror: {
      headline: "You chose boundary without coldness.",
      lead: "This is the message where the limit matters, but the tone can make it sound like the relationship is being withdrawn.",
      youMean: "You may mean “I need this to stop.”",
      theyHear: "They may hear “I am done with you.”",
    },
    trap: {
      headline: "A boundary can sound like rejection.",
      body: "When care disappears from the sentence, the other person may react to the perceived abandonment instead of the limit.",
      theyHear: "You are too much, and I am pulling away.",
    },
    why: {
      headline: "A good boundary stays clear without going cold.",
      body: "The limit should not be buried under apologies. The care should not erase the limit. Both need to stay visible.",
    },
    routeMap: {
      risk: "Sounds cruel, cold or abandoning",
      routeA: "Hold the line kindly", routeB: "A limit, with love",
      lineLogic: "clean limit, relational continuity, next step",
      rootedIn: ["Boundary-setting", "The Gottman Method", "Relational continuity"],
    },
    demo: { input: "I can’t keep doing this every night.", note: "This is where a limit can sound like rejection." },
    routes: {
      a: { label: "Hold the line kindly", text: "I can’t keep having this conversation late at night. I am willing to talk tomorrow when we are calmer, but tonight I need to stop.", bestWhen: "The limit needs to be clear and firm." },
      b: { label: "A limit, with love", text: "I care about us, which is why I do not want another exhausted conversation to damage this more. I need to stop for tonight, and I want us to come back to it tomorrow.", bestWhen: "You want the boundary to feel connected rather than cold." },
    },
    compare: {
      headline: "One route protects the limit. One route protects the connection.",
      lineA: "Hold the line kindly keeps the boundary clean.",
      lineB: "A limit, with love makes the care visible while the limit stays intact.",
    },
    breakdown: [
      { span: "I can’t keep having this conversation late at night", why: "States the limit without over-explaining.", rootedIn: "Clean boundary" },
      { span: "I care about us", why: "Keeps the relationship visible before the limit lands.", rootedIn: "Relational continuity" },
      { span: "come back to it tomorrow", why: "Turns the boundary into a pause rather than a disappearance.", rootedIn: "Pause-and-return" },
    ],
    rootedIn: { pattern: "A limit, with love", rootedIn: "Boundary-setting and relational continuity", usedFor: "Boundary without coldness", whatChanges: "It keeps the limit visible while showing the relationship still matters." },
    tryYours: { headline: "Write the boundary, even if it sounds cold right now.", placeholder: "I can’t keep doing…" },
  },

  reconnect_after_distance: {
    title: "Reconnect after distance",
    cardBody: "I want to reconnect, but I do not know how to open the door.",
    receiver_risk: "pressuring", desired_landing: "open_door",
    mirror: {
      headline: "You chose reconnect after distance.",
      lead: "This is the first sentence after silence, awkwardness or distance. It can easily carry too much.",
      youMean: "You may mean “I miss us.”",
      theyHear: "They may hear “you need to fix this now.”",
    },
    trap: {
      headline: "Reconnection can sound like pressure.",
      body: "When the opening asks for closeness too quickly, the other person may protect the distance instead of stepping toward the conversation.",
      theyHear: "You owe me closeness now.",
    },
    why: {
      headline: "A better opening gives the relationship a door.",
      body: "The message should acknowledge the distance, keep care visible and invite a next step without demanding immediate closeness.",
    },
    routeMap: {
      risk: "Sounds loaded or pressuring",
      routeA: "Us vs the problem", routeB: "Ask what matters",
      lineLogic: "shared problem, no blame, open question",
      rootedIn: ["Getting to Yes", "Perspective-taking", "Coaching practice"],
    },
    demo: { input: "So are we just not talking now?", note: "This is where reconnection can start sounding like accusation." },
    routes: {
      a: { label: "Us vs the problem", text: "I do not want the distance to become the whole story. I think we both got stuck, and I would like us to find a way back into the conversation.", bestWhen: "You want to reduce blame and name the shared problem." },
      b: { label: "Ask what matters", text: "Could I ask what you need from me before we try to talk properly? I want to understand what matters most right now rather than push us into another difficult exchange.", bestWhen: "You want to reopen contact without forcing closeness." },
    },
    compare: {
      headline: "One route names the distance. One route invites their reality.",
      lineA: "Us vs the problem helps when the relationship needs a shared frame.",
      lineB: "Ask what matters helps when the other person may need space before repair.",
    },
    breakdown: [
      { span: "the distance", why: "Names the problem without making either person the problem.", rootedIn: "Separate people from problem" },
      { span: "we both got stuck", why: "Reduces blame and creates shared ownership.", rootedIn: "Shared problem frame" },
      { span: "what you need from me", why: "Invites them in before asking for closeness.", rootedIn: "Perspective-first question" },
    ],
    rootedIn: { pattern: "Us vs the problem", rootedIn: "Getting to Yes and perspective-taking", usedFor: "Reconnect after distance", whatChanges: "It names the distance as a shared problem instead of placing it on one person." },
    tryYours: { headline: "Write the first sentence you have not known how to send.", placeholder: "So are we just not talking…" },
  },

  pause_before_escalation: {
    title: "Pause before it gets worse",
    cardBody: "I need to stop this before we both say something worse.",
    receiver_risk: "shutting_down", desired_landing: "safe_pause",
    mirror: {
      headline: "You chose pause before it gets worse.",
      lead: "This is the message you send when the conversation is getting too hot to handle well.",
      youMean: "You may mean “I want to protect this.”",
      theyHear: "They may hear “I am shutting you out.”",
    },
    trap: {
      headline: "A pause can feel like disappearance.",
      body: "If the message only says “I can’t talk,” the other person may experience it as punishment, rejection or stonewalling.",
      theyHear: "I am done listening to you.",
    },
    why: {
      headline: "A better pause creates space and a return point.",
      body: "The goal is to stop the spiral while making clear that the conversation is not being abandoned.",
    },
    routeMap: {
      risk: "Sounds like shutdown",
      routeA: "Pause-and-return", routeB: "Soft start, clear point",
      lineLogic: "name overload, pause, commit to return",
      rootedIn: ["The Gottman Method", "Conflict de-escalation", "Boundary-setting"],
    },
    demo: { input: "I can’t talk to you when you’re like this.", note: "This is where a pause starts sounding like rejection." },
    routes: {
      a: { label: "Pause-and-return", text: "I want to pause before we say things we cannot take back. I am going to take some space now, and I will come back to this tomorrow.", bestWhen: "The conversation is too heated and needs a clear return point." },
      b: { label: "Soft start, clear point", text: "I care about resolving this. I also know I am getting too activated to do it well right now. I need us to stop for tonight and continue when we are both steadier.", bestWhen: "You need to pause while making care and intent visible." },
    },
    compare: {
      headline: "One route creates distance safely. One route explains the pause.",
      lineA: "Pause-and-return is short and protective.",
      lineB: "Soft start, clear point adds reassurance when the pause could feel like rejection.",
    },
    breakdown: [
      { span: "before we say things we cannot take back", why: "Frames the pause as protection rather than withdrawal.", rootedIn: "De-escalation" },
      { span: "I will come back to this tomorrow", why: "Prevents the pause from feeling like disappearance.", rootedIn: "Return point" },
      { span: "I am getting too activated", why: "Owns your state without blaming theirs.", rootedIn: "Self-regulation language" },
    ],
    rootedIn: { pattern: "Pause-and-return", rootedIn: "Conflict de-escalation and the Gottman Method", usedFor: "Pause before it gets worse", whatChanges: "It stops the spiral while keeping a clear point of return." },
    tryYours: { headline: "Write the message before the argument gets worse.", placeholder: "I can’t do this right now…" },
  },

  truth_without_attack: {
    title: "Truth without attack",
    cardBody: "I need to say the truth without turning it into an attack.",
    receiver_risk: "attacking", desired_landing: "honest_but_receivable",
    mirror: {
      headline: "You chose truth without attack.",
      lead: "This is the message where the truth matters, but the delivery could make it sound harsher than you mean.",
      youMean: "You may mean “I need to be honest.”",
      theyHear: "They may hear “here is everything you did wrong.”",
    },
    trap: {
      headline: "A true sentence can still land too sharply.",
      body: "When the message arrives with too much force, the other person may react to the threat before they understand the point.",
      theyHear: "You are being judged, not spoken to.",
    },
    why: {
      headline: "A better truth stays clear enough to trust.",
      body: "The goal is to remove the extra threat around the message so the real point has a better chance of being heard.",
    },
    routeMap: {
      risk: "Sounds harsh or final",
      routeA: "Just say it plainly", routeB: "Ease into it",
      lineLogic: "plain truth, soft runway, no unnecessary threat",
      rootedIn: ["Plain-language authenticity", "The Gottman Method", "Staged delivery"],
    },
    demo: { input: "I don’t think this is working anymore.", note: "This is where truth can land harder than intended." },
    routes: {
      a: { label: "Just say it plainly", text: "I need to be honest. I am not feeling okay about where we are, and I do not want to pretend I am.", bestWhen: "The message needs clarity more than emotional build-up." },
      b: { label: "Ease into it", text: "I want to say this carefully because it matters. I have been feeling unsure about us for a while, and I think we need to talk honestly about where this is going.", bestWhen: "The truth is difficult and the opening needs more emotional runway." },
    },
    compare: {
      headline: "One route is plain. One route creates runway.",
      lineA: "Just say it plainly reduces confusion.",
      lineB: "Ease into it prepares the emotional ground before the difficult point lands.",
    },
    breakdown: [
      { span: "I need to be honest", why: "Signals seriousness without accusation.", rootedIn: "Plain-language authenticity" },
      { span: "I do not want to pretend I am", why: "Keeps the truth owned and specific.", rootedIn: "Owned truth" },
      { span: "because it matters", why: "Adds care before the difficult point lands.", rootedIn: "Emotional runway" },
    ],
    rootedIn: { pattern: "Ease into it", rootedIn: "Staged delivery and plain-language authenticity", usedFor: "Truth without attack", whatChanges: "It prepares the ground so the real point has room to be heard." },
    tryYours: { headline: "Write the truth plainly. LANDRIGHT will help it land.", placeholder: "I need to be honest…" },
  },
};

const MOMENT_ORDER: Moment[] = [
  "apology_without_self_defence", "need_without_pressure", "hurt_without_blame",
  "boundary_without_coldness", "reconnect_after_distance", "pause_before_escalation", "truth_without_attack",
];

// ─── Shared content ───────────────────────────────────────────────────────────

const RECOGNITION = {
  headline: "There is the message you send, and the message they hear.",
  lines: [
    "You may be trying to apologise, and it lands as defence.",
    "You may be asking for more, and it lands as pressure.",
    "You may be saying you are hurt, and it lands as blame.",
    "You may be setting a limit, and it lands as rejection.",
  ],
  close: "LANDRIGHT helps you shape the message before the wrong version arrives.",
  fragments: ["Sorry, but…", "You never make time…", "That really hurt me…", "I can’t keep doing this…", "So are we just not talking?", "I need to be honest…"],
};

const PATTERN_LIBRARY = {
  headline: "A named method for the message you are holding.",
  body: "LANDRIGHT draws from more than 30 communication patterns for hard, tender and awkward messages.",
  lines: [
    "Some clean up apologies.",
    "Some turn need into request.",
    "Some keep boundaries warm.",
    "Some open a door after distance.",
    "Some help truth land without becoming an attack.",
  ],
  cards: [
    "A real apology", "Own it first", "Name it before they do", "Ask, don’t demand",
    "Feeling, then ask", "Show what’s underneath", "A limit, with love", "Hold the line kindly",
    "Kind but clear", "Ease into it", "Us vs the problem", "Ask what matters",
    "Pause-and-return", "Just say it plainly", "Soft start, clear point", "Specific reassurance",
  ],
};

const GENERIC_AI = {
  headline: "Generic AI polishes the sentence. LANDRIGHT reads the moment.",
  body: "A relationship message has a job. It may need to apologise, ask, repair, reassure, pause, reconnect, set a boundary or tell the truth. LANDRIGHT identifies that job, chooses a communication route, then shows what each line is doing.",
  generic: [["Prompt", "Make this nicer."], ["Focus", "tone and polish."], ["Output", "one smoother version."], ["Explanation", "usually vague or missing."]],
  landright: [["Question", "What is this message trying to do?"], ["Risk", "What could it sound like if it lands badly?"], ["Route", "Which pattern fits this pressure moment?"], ["Explanation", "why each line was built that way."]],
};

const PAYWALL = {
  headline: "Unlock the full communication toolkit.",
  body: "Get more routes, full line-by-line explanations, saved messages and pattern guidance for the conversations that matter.",
  bullets: [
    "More than 30 communication patterns",
    "Multiple routes for each message",
    "Line-by-line “why it works”",
    "Saved message history",
    "Generate more approaches when the first one is not quite right",
  ],
};

// ─── Analytics (no raw message text ever leaves the client) ───────────────────

function emit(event: string, props: Record<string, unknown>) {
  const w = window as unknown as { analytics?: { track?: (e: string, p: unknown) => void } };
  if (w.analytics?.track) w.analytics.track(event, props);
  else if (process.env.NODE_ENV !== "production") console.debug("[analytics]", event, props);
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function CTA({ children, onClick, disabled, variant = "lime", full = true }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "lime" | "ink" | "ghost"; full?: boolean }) {
  const [pressed, setPressed] = useState(false);
  const look = {
    lime: { bg: LIME, color: INK, border: INK, shadow: INK },
    ink: { bg: INK, color: LIME, border: INK, shadow: LIME },
    ghost: { bg: "transparent", color: "inherit", border: "currentColor", shadow: "currentColor" },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseDown={() => !disabled && setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      style={{
        fontFamily: COND, fontWeight: 900, fontSize: "1.02rem", letterSpacing: "0.05em", textTransform: "uppercase",
        border: `2px solid ${disabled ? MUTED : look.border}`, padding: "16px 26px", width: full ? "100%" : undefined,
        cursor: disabled ? "not-allowed" : "pointer", backgroundColor: disabled ? "rgba(120,120,120,0.18)" : look.bg, color: disabled ? MUTED : look.color,
        boxShadow: disabled ? "none" : pressed ? `0 0 0 ${look.shadow}` : `4px 4px 0 ${look.shadow}`, transform: pressed ? "translate(4px,4px)" : "none",
        transition: "transform .1s ease, box-shadow .1s ease", borderRadius: 0,
      }}>
      {children}
    </button>
  );
}

function Eyebrow({ children, color = LIME }: { children: React.ReactNode; color?: string }) {
  return <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", color, marginBottom: 14 }}>{children}</p>;
}

const H1: React.CSSProperties = { fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.8rem, 6.6vw, 2.5rem)", lineHeight: 1.0, letterSpacing: "-0.025em", textTransform: "uppercase", margin: 0 };
const LEAD: React.CSSProperties = { fontFamily: BODY, fontSize: "1.06rem", lineHeight: 1.6, color: "#E8E8E2", margin: 0 };

function Headline({ children }: { children: React.ReactNode }) {
  return <h1 style={{ ...H1, color: "#FFFFFF" }}>{children}</h1>;
}

// Pill that mirrors the app's lime tag (shows the chosen moment).
function MomentPill({ label }: { label: string }) {
  return <span style={{ display: "inline-block", fontFamily: COND, fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: INK, backgroundColor: LIME, padding: "5px 10px" }}>{label}</span>;
}

// Selectable moment card. Lifts gently on press.
function MomentCard({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={onClick} onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      style={{ width: "100%", textAlign: "left", cursor: "pointer", borderRadius: 0, border: "2px solid rgba(255,255,255,0.26)", backgroundColor: "transparent",
        padding: "16px 18px", boxShadow: pressed ? "none" : "0 0 0 transparent", transform: pressed ? "translate(2px,2px)" : "none", transition: "transform .1s ease, border-color .12s ease" }}>
      <span style={{ display: "block", fontFamily: DISPLAY, fontWeight: 900, fontSize: "1.12rem", letterSpacing: "-0.01em", textTransform: "uppercase", color: "#FFFFFF" }}>{title}</span>
      <span style={{ display: "block", fontFamily: BODY, fontSize: "0.95rem", lineHeight: 1.4, color: "#C7C9BD", marginTop: 6 }}>{body}</span>
    </button>
  );
}

// Strategic route card (demo + best-when).
function RouteCard({ label, text, bestWhen, active }: { label: string; text: string; bestWhen?: string; active?: boolean }) {
  return (
    <div style={{ border: `2px solid ${active ? LIME : "rgba(255,255,255,0.22)"}`, boxShadow: active ? `6px 6px 0 ${LIME}` : "none" }}>
      <div style={{ borderBottom: `2px solid ${active ? LIME : "rgba(255,255,255,0.22)"}`, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 9, height: 9, backgroundColor: LIME, flexShrink: 0 }} />
        <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "1.02rem", letterSpacing: "-0.01em", textTransform: "uppercase", color: "#FFFFFF" }}>{label}</span>
      </div>
      <div style={{ padding: "18px" }}>
        <p style={{ fontFamily: BODY, fontSize: "1.0rem", lineHeight: 1.72, color: "#FFFFFF", margin: 0 }}>{text}</p>
        {bestWhen && <p style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.03em", textTransform: "uppercase", color: DARK_MUTED, marginTop: 14, marginBottom: 0 }}>Best when: {bestWhen}</p>}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1500); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
    else done();
  }
  return (
    <button onClick={copy} style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.05em", textTransform: "uppercase", border: `2px solid ${LIME}`, backgroundColor: copied ? LIME : "transparent", color: copied ? INK : LIME, padding: "8px 14px", cursor: "pointer", borderRadius: 0 }}>
      {copied ? "Copied" : "Copy text"}
    </button>
  );
}

// ─── Highlight segmentation + inline highlight component (app interaction) ─────

type Seg = { text: string; hi: number | null };
function segmentMessage(text: string, spans: readonly string[]): Seg[] {
  const lower = text.toLowerCase();
  const found = spans
    .map((span, i) => ({ i, span, at: lower.indexOf(span.toLowerCase()) }))
    .filter(x => x.at >= 0)
    .sort((a, b) => a.at - b.at);
  const out: Seg[] = [];
  let cursor = 0;
  for (const f of found) {
    if (f.at < cursor) continue; // skip overlap
    if (f.at > cursor) out.push({ text: text.slice(cursor, f.at), hi: null });
    out.push({ text: text.slice(f.at, f.at + f.span.length), hi: f.i });
    cursor = f.at + f.span.length;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), hi: null });
  return out;
}

// Message with tappable highlighted phrases + a rationale panel underneath.
// mode "reveal": highlights appear one by one and stay lit (demo line breakdown).
// mode "tap": phrases are subtly underlined; the tapped one lights up (result).
function InlineHighlights({
  text, marks, mode, onOpen,
}: {
  text: string;
  marks: { span: string; note: string; rootedIn?: string }[];
  mode: "reveal" | "tap";
  onOpen?: (count: number) => void;
}) {
  const segs = segmentMessage(text, marks.map(m => m.span));
  const [active, setActive] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(mode === "tap" ? marks.length : 0);
  const opened = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (mode !== "reveal") return;
    setRevealed(0); setActive(null); opened.current = new Set();
    const timers: ReturnType<typeof setTimeout>[] = [];
    marks.forEach((_, i) => timers.push(setTimeout(() => setRevealed(n => Math.max(n, i + 1)), 350 + i * 420)));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function open(i: number) {
    setActive(i);
    opened.current.add(i);
    onOpen?.(opened.current.size);
  }

  return (
    <>
      <div style={{ border: "2px solid rgba(255,255,255,0.22)", padding: "18px" }}>
        <p style={{ fontFamily: BODY, fontSize: "1.04rem", lineHeight: 1.9, color: "#FFFFFF", margin: 0 }}>
          {segs.map((seg, i) => {
            if (seg.hi === null) return <span key={i}>{seg.text}</span>;
            const hiIndex = seg.hi;
            const lit = mode === "reveal" ? hiIndex < revealed : active === hiIndex;
            const tappable = mode === "reveal" ? hiIndex < revealed : true;
            const underline = mode === "tap" && active !== hiIndex;
            return (
              <button key={i} onClick={() => tappable && open(hiIndex)} aria-label={`${seg.text}. ${marks[hiIndex].note}`}
                style={{ font: "inherit", color: lit ? INK : "#FFFFFF", backgroundColor: lit ? LIME : "transparent",
                  borderTop: "2px solid transparent", borderLeft: "none", borderRight: "none",
                  borderBottom: underline ? `2px solid ${LIME}` : "2px solid transparent",
                  padding: "0 .12em", cursor: tappable ? "pointer" : "default", borderRadius: 0,
                  transition: "background-color .35s ease, color .35s ease", WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" }}>
                {seg.text}
              </button>
            );
          })}
        </p>
      </div>
      <div style={{ minHeight: 84, marginTop: 12, border: "2px solid rgba(255,255,255,0.16)", padding: "13px 16px" }}>
        {active !== null ? (
          <>
            {marks[active].rootedIn && <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase", color: LIME, margin: 0 }}>Rooted in {marks[active].rootedIn}</p>}
            <p style={{ fontFamily: BODY, fontSize: "0.95rem", lineHeight: 1.55, color: "#E8E8E2", marginTop: marks[active].rootedIn ? 6 : 0, marginBottom: 0 }}>{marks[active].note}</p>
          </>
        ) : (
          <p style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", color: DARK_MUTED, margin: 0 }}>Tap a highlighted phrase to see what it is doing</p>
        )}
      </div>
    </>
  );
}

// ─── Shell: progress + back + V0.1 link back to the app ───────────────────────

function Shell({ index, onBack, children }: { index: number; onBack?: () => void; children: React.ReactNode }) {
  const pct = Math.round((index / (STEPS.length - 1)) * 100);
  return (
    <div className="surface-dark" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: DARK, color: "#FFFFFF", padding: "clamp(18px, 5vw, 36px)" }}>
      <div style={{ width: "100%", maxWidth: 560, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "clamp(20px, 5vw, 36px)" }}>
          {onBack ? <button onClick={onBack} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: COND, fontWeight: 900, fontSize: "1.2rem", padding: 0, lineHeight: 1 }}>←</button> : <span style={{ width: 12 }} />}
          <div style={{ flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)" }}>
            <div style={{ height: "100%", width: `${pct}%`, backgroundColor: LIME, transition: "width .35s cubic-bezier(.22,1,.36,1)" }} />
          </div>
          <a href="/" aria-label="Back to Landright" style={{ textDecoration: "none" }}>
            <span style={{ display: "inline-block", fontFamily: COND, fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.07em", textTransform: "uppercase", padding: "4px 9px", lineHeight: 1.1, border: `2px solid ${LIME}`, color: LIME }}>v{APP_VERSION}</span>
          </a>
        </div>
        {children}
      </div>
    </div>
  );
}

// Read-only "app input" card (mirrors the app's dark textarea).
function InputDisplay({ value }: { value: string }) {
  return (
    <div style={{ border: "2px dashed rgba(255,255,255,0.3)", padding: "16px 18px" }}>
      <p style={{ fontFamily: BODY, fontSize: "1.1rem", lineHeight: 1.55, color: "#E8E8E2", margin: 0 }}>{value}</p>
    </div>
  );
}

// ─── Result route card (uses the app's line-by-line + rooted-in language) ─────

interface OptionOut { stack_label: string; option: string; origin?: string; rationale?: string; breakdown: { text: string; note: string }[] }
function ResultRouteCard({ num, out }: { num: string; out: OptionOut }) {
  return (
    <div style={{ border: `2px solid ${INK === INK ? "rgba(255,255,255,0.22)" : "#000"}` }}>
      <div style={{ borderBottom: `2px solid ${LIME}`, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "1.4rem", lineHeight: 1, color: "transparent", WebkitTextStroke: `2px ${LIME}` }}>{num}</span>
        <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "1.05rem", letterSpacing: "-0.01em", textTransform: "uppercase", color: "#FFFFFF" }}>{out.stack_label}</span>
      </div>
      <div style={{ padding: "18px" }}>
        <InlineHighlights text={out.option} marks={out.breakdown.map(b => ({ span: b.text, note: b.note }))} mode="tap" />
        {out.origin && <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.05em", textTransform: "uppercase", color: LIME, marginTop: 16, marginBottom: 0 }}>Rooted in {out.origin}</p>}
        {out.rationale && <p style={{ fontFamily: BODY, fontSize: "0.9rem", lineHeight: 1.55, color: "#B9BBAE", marginTop: 6 }}>{out.rationale}</p>}
        <div style={{ marginTop: 16 }}><CopyButton text={out.option} /></div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const step: StepId = STEPS[index];

  const [moment, setMoment] = useState<Moment | null>(null);
  const [receiverRisk, setReceiverRisk] = useState<ReceiverRisk | null>(null);
  const [desiredLanding, setDesiredLanding] = useState<DesiredLanding | null>(null);
  const branch = moment ? BRANCHES[moment] : BRANCHES.apology_without_self_defence;

  const [demoRoute, setDemoRoute] = useState<"a" | "b">("a");
  const [breakdownRoute, setBreakdownRoute] = useState<"a" | "b">("a");
  const [userMsg, setUserMsg] = useState("");
  const [genState, setGenState] = useState<"idle" | "loading" | "done">("idle");
  const [gen, setGen] = useState<{ a: OptionOut | null; b: OptionOut | null }>({ a: null, b: null });

  const fire = useCallback((event: string, extra: Record<string, unknown> = {}) => {
    emit(event, { screen_id: STEPS[index], screen_index: index, selected_moment: moment, receiver_risk: receiverRisk, desired_landing: desiredLanding, ...extra });
  }, [index, moment, receiverRisk, desiredLanding]);

  // Screen-view + per-screen events.
  useEffect(() => {
    if (step === "splash") fire("onboarding_started");
    fire("onboarding_screen_viewed", { screen_id: step });
    if (step === "trap") fire("branch_trap_viewed");
    if (step === "route_map") fire("branch_route_viewed");
    if (step === "demo_input") fire("demo_input_viewed");
    if (step === "route_cards") fire("demo_routes_viewed");
    if (step === "rooted_in") fire("rooted_in_opened");
    if (step === "pattern_library") fire("pattern_library_viewed");
    if (step === "generic_ai") fire("generic_ai_contrast_viewed");
    if (step === "try_yours") fire("try_yours_started");
    if (step === "paywall") { fire("account_gate_viewed"); fire("paywall_viewed", { paywall_variant: PAYWALL_VARIANT }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Splash auto-advance.
  useEffect(() => {
    if (step !== "splash") return;
    const t = setTimeout(() => setIndex(i => (STEPS[i] === "splash" ? i + 1 : i)), 1500);
    return () => clearTimeout(t);
  }, [step]);

  // Processing auto-advance to the demo route cards.
  useEffect(() => {
    if (step !== "processing") return;
    const t = setTimeout(() => setIndex(i => (STEPS[i] === "processing" ? i + 1 : i)), 1500);
    return () => clearTimeout(t);
  }, [step]);

  const goto = (id: StepId) => setIndex(STEPS.indexOf(id));
  const next = () => setIndex(i => Math.min(i + 1, STEPS.length - 1));
  const back = () => setIndex(i => Math.max(i - 1, 0));

  function chooseMoment(m: Moment) {
    const b = BRANCHES[m];
    setMoment(m); setReceiverRisk(b.receiver_risk); setDesiredLanding(b.desired_landing);
    emit("moment_selected", { selected_moment: m, receiver_risk: b.receiver_risk, desired_landing: b.desired_landing });
    setTimeout(next, 160);
  }

  function selectDemoRoute(r: "a" | "b") {
    setDemoRoute(r);
    fire("demo_route_compared", { selected_route: r === "a" ? "route_a" : "route_b" });
  }

  const ctx = useCallback(() => ({ selected_moment: moment, receiver_risk: receiverRisk, desired_landing: desiredLanding }), [moment, receiverRisk, desiredLanding]);

  function finish() {
    try { localStorage.setItem("landright_onboarding", JSON.stringify({ done: true, ...ctx(), at: new Date().toISOString() })); } catch { /* ignore */ }
    router.push("/");
  }

  async function submitMine() {
    const msg = userMsg.trim();
    if (msg.length < MIN_CHARS) return;
    fire("user_message_submitted", { char_count: msg.length });
    setGenState("loading"); setGen({ a: null, b: null });
    goto("result");
    const call = (which: "a" | "b") => fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raw_input: msg, which, onboarding: ctx() }) }).then(r => r.json());
    const pa = call("a"); const pb = call("b");
    try {
      const da = await pa;
      if (da.success) { setGen(g => ({ ...g, a: da.option })); setGenState("done"); fire("onboarding_completed"); }
      else { setGenState("idle"); goto("try_yours"); return; }
    } catch { setGenState("idle"); goto("try_yours"); return; }
    try { const db = await pb; if (db.success) setGen(g => ({ ...g, b: db.option })); } catch { /* B is a bonus */ }
  }

  const showBack = index > 1 && step !== "result" && step !== "paywall" && step !== "processing";

  return (
    <Shell index={index} onBack={showBack ? back : undefined}>
      {/* 0 SPLASH */}
      {step === "splash" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(2.4rem, 11vw, 3.6rem)", letterSpacing: "-0.03em", color: "#FFFFFF" }}>LANDRIGHT</span>
          <p style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "1.4rem", letterSpacing: "-0.01em", textTransform: "uppercase", color: LIME, marginTop: 14 }}>Make your message land right.</p>
          <div style={{ marginTop: 34, width: "100%", maxWidth: 320 }}><CTA onClick={next}>Continue</CTA></div>
        </div>
      )}

      {/* 1 RECOGNITION */}
      {step === "recognition" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Headline>{RECOGNITION.headline}</Headline>
          <div style={{ marginTop: 22, marginBottom: 26 }}>
            {RECOGNITION.lines.map(l => <p key={l} style={{ ...LEAD, marginBottom: 8 }}>{l}</p>)}
            <p style={{ ...LEAD, color: "#FFFFFF", marginTop: 16 }}>{RECOGNITION.close}</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
            {RECOGNITION.fragments.map(f => <span key={f} style={{ fontFamily: BODY, fontSize: "0.86rem", color: DARK_MUTED, border: "1px solid rgba(255,255,255,0.16)", padding: "5px 10px" }}>{f}</span>)}
          </div>
          <CTA onClick={next}>Find my moment</CTA>
        </div>
      )}

      {/* 2 MOMENT SELECTION */}
      {step === "moment" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Headline>What are you trying to say carefully?</Headline>
          <p style={{ ...LEAD, color: "#C7C9BD", marginTop: 12, marginBottom: 22 }}>Choose the moment that feels closest.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {MOMENT_ORDER.map(m => <MomentCard key={m} title={BRANCHES[m].title} body={BRANCHES[m].cardBody} onClick={() => chooseMoment(m)} />)}
          </div>
        </div>
      )}

      {/* 3 MIRROR */}
      {step === "mirror" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <MomentPill label={branch.title} />
          <h1 style={{ ...H1, color: "#FFFFFF", marginTop: 16 }}>{branch.mirror.headline}</h1>
          <p style={{ ...LEAD, marginTop: 18 }}>{branch.mirror.lead}</p>
          <div style={{ marginTop: 20, marginBottom: 28, borderLeft: `3px solid ${LIME}`, paddingLeft: 16 }}>
            <p style={{ ...LEAD, color: "#FFFFFF", margin: 0 }}>{branch.mirror.youMean}</p>
            <p style={{ ...LEAD, color: DARK_MUTED, marginTop: 6, marginBottom: 0 }}>{branch.mirror.theyHear}</p>
          </div>
          <CTA onClick={next}>Show me the trap</CTA>
        </div>
      )}

      {/* 4 TRAP */}
      {step === "trap" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Eyebrow>What can go wrong</Eyebrow>
          <h1 style={{ ...H1, color: "#FFFFFF" }}>{branch.trap.headline}</h1>
          <p style={{ ...LEAD, marginTop: 18, marginBottom: 22 }}>{branch.trap.body}</p>
          <div style={{ border: "2px solid rgba(255,255,255,0.22)", padding: "16px 18px", marginBottom: 28 }}>
            <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.74rem", letterSpacing: "0.08em", textTransform: "uppercase", color: DARK_MUTED, margin: 0 }}>What they might hear</p>
            <p style={{ fontFamily: BODY, fontSize: "1.05rem", lineHeight: 1.5, color: "#FFFFFF", marginTop: 8, marginBottom: 0 }}>“{branch.trap.theyHear}”</p>
          </div>
          <CTA onClick={next}>Why landing matters</CTA>
        </div>
      )}

      {/* 5 WHY LANDING MATTERS */}
      {step === "why" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Eyebrow>Why landing matters</Eyebrow>
          <h1 style={{ ...H1, color: "#FFFFFF" }}>{branch.why.headline}</h1>
          <p style={{ ...LEAD, marginTop: 18, marginBottom: 28 }}>{branch.why.body}</p>
          <CTA onClick={next}>See the route</CTA>
        </div>
      )}

      {/* 6 ROUTE MAP */}
      {step === "route_map" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Eyebrow>The route LANDRIGHT chooses</Eyebrow>
          <div style={{ border: `2px solid ${LIME}`, boxShadow: `5px 5px 0 ${LIME}`, padding: "18px" }}>
            {[["Moment", branch.title], ["Risk", branch.routeMap.risk], ["Route A", branch.routeMap.routeA], ["Route B", branch.routeMap.routeB], ["Line logic", branch.routeMap.lineLogic]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                <span style={{ flexShrink: 0, width: 86, fontFamily: COND, fontWeight: 900, fontSize: "0.74rem", letterSpacing: "0.06em", textTransform: "uppercase", color: LIME }}>{k}</span>
                <span style={{ fontFamily: BODY, fontSize: "0.98rem", lineHeight: 1.4, color: "#FFFFFF" }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ flexShrink: 0, width: 86, fontFamily: COND, fontWeight: 900, fontSize: "0.74rem", letterSpacing: "0.06em", textTransform: "uppercase", color: LIME }}>Rooted in</span>
              <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {branch.routeMap.rootedIn.map(r => <span key={r} style={{ fontFamily: BODY, fontSize: "0.84rem", color: "#E8E8E2", border: "1px solid rgba(255,255,255,0.2)", padding: "3px 8px" }}>{r}</span>)}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <CTA onClick={next}>See it in the app</CTA>
            <CTA onClick={() => goto("try_yours")} variant="ghost">Skip demo, try mine</CTA>
          </div>
        </div>
      )}

      {/* 7 DEMO INPUT */}
      {step === "demo_input" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Eyebrow>Raw thought</Eyebrow>
          <InputDisplay value={branch.demo.input} />
          <p style={{ fontFamily: BODY, fontSize: "0.9rem", lineHeight: 1.5, color: DARK_MUTED, marginTop: 12, marginBottom: 26 }}>{branch.demo.note}</p>
          <CTA onClick={next}>Find the route</CTA>
        </div>
      )}

      {/* 8 PROCESSING */}
      {step === "processing" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.9rem", letterSpacing: "0.1em", textTransform: "uppercase", color: LIME, marginBottom: 18 }}>Reading the moment. Choosing a route.</p>
          <div style={{ height: 10, backgroundColor: INK, border: `2px solid ${INK}`, overflow: "hidden" }}>
            <div style={{ height: "100%", backgroundColor: LIME, width: "0%", animation: "lrfill 1.4s linear forwards" }} />
          </div>
          <style>{`@keyframes lrfill { from { width: 6% } to { width: 100% } }`}</style>
        </div>
      )}

      {/* 9 ROUTE CARDS (demo) */}
      {step === "route_cards" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Headline>Two routes for this moment.</Headline>
          <p style={{ ...LEAD, color: "#C7C9BD", marginTop: 12, marginBottom: 20 }}>The same thought, shaped two ways.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <RouteCard label={branch.routes.a.label} text={branch.routes.a.text} bestWhen={branch.routes.a.bestWhen} active />
            <RouteCard label={branch.routes.b.label} text={branch.routes.b.text} bestWhen={branch.routes.b.bestWhen} />
          </div>
          <div style={{ marginTop: 24 }}><CTA onClick={next}>Compare the routes</CTA></div>
        </div>
      )}

      {/* 10 COMPARE */}
      {step === "compare" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ ...H1, color: "#FFFFFF" }}>{branch.compare.headline}</h1>
          <div style={{ marginTop: 22, marginBottom: 28 }}>
            <p style={{ ...LEAD, marginBottom: 12 }}>{branch.compare.lineA}</p>
            <p style={{ ...LEAD, margin: 0 }}>{branch.compare.lineB}</p>
          </div>
          <CTA onClick={next}>See why this works</CTA>
        </div>
      )}

      {/* 11 LINE BREAKDOWN */}
      {step === "line_breakdown" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Headline>What each line is doing.</Headline>
          <p style={{ ...LEAD, color: "#C7C9BD", marginTop: 12, marginBottom: 18 }}>Tap a highlighted phrase to see why it works.</p>
          <div style={{ display: "flex", gap: 0, marginBottom: 16, border: `2px solid ${LIME}` }}>
            {(["a", "b"] as const).map(r => (
              <button key={r} onClick={() => setBreakdownRoute(r)} style={{ flex: 1, fontFamily: COND, fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.05em", textTransform: "uppercase", padding: "10px 8px", cursor: "pointer", border: "none", borderRadius: 0, backgroundColor: breakdownRoute === r ? LIME : "transparent", color: breakdownRoute === r ? INK : "#FFFFFF" }}>
                {r === "a" ? branch.routes.a.label : branch.routes.b.label}
              </button>
            ))}
          </div>
          <InlineHighlights key={breakdownRoute} text={breakdownRoute === "a" ? branch.routes.a.text : branch.routes.b.text} marks={branch.breakdown.map(b => ({ span: b.span, note: b.why, rootedIn: b.rootedIn }))} mode="reveal" onOpen={(c) => fire("line_breakdown_opened", { highlight_count: c })} />
          <div style={{ marginTop: 22 }}><CTA onClick={next}>Why this route</CTA></div>
        </div>
      )}

      {/* 12 ROOTED IN */}
      {step === "rooted_in" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Headline>Why LANDRIGHT chose this route</Headline>
          <p style={{ ...LEAD, marginTop: 14, marginBottom: 20 }}>LANDRIGHT selects a communication pattern based on the message type, the likely risk and the way you want it to land.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
            {[["Moment", branch.title], ["Risk", branch.routeMap.risk], ["Route", branch.rootedIn.pattern]].map(([k, v]) => (
              <div key={k} style={{ border: "2px solid rgba(255,255,255,0.2)", padding: "12px 12px" }}>
                <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.68rem", letterSpacing: "0.06em", textTransform: "uppercase", color: LIME, margin: 0 }}>{k}</p>
                <p style={{ fontFamily: BODY, fontSize: "0.86rem", lineHeight: 1.35, color: "#FFFFFF", marginTop: 6, marginBottom: 0 }}>{v}</p>
              </div>
            ))}
          </div>
          <div style={{ border: `2px solid ${LIME}`, padding: "16px 18px", marginBottom: 28 }}>
            {[["Pattern", branch.rootedIn.pattern], ["Rooted in", branch.rootedIn.rootedIn], ["Used for", branch.rootedIn.usedFor], ["What it changes", branch.rootedIn.whatChanges]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <span style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase", color: LIME }}>{k}: </span>
                <span style={{ fontFamily: BODY, fontSize: "0.95rem", lineHeight: 1.45, color: "#FFFFFF" }}>{v}</span>
              </div>
            ))}
          </div>
          <CTA onClick={next}>See the method</CTA>
        </div>
      )}

      {/* 13 PATTERN LIBRARY */}
      {step === "pattern_library" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Headline>{PATTERN_LIBRARY.headline}</Headline>
          <p style={{ ...LEAD, marginTop: 14, marginBottom: 14 }}>{PATTERN_LIBRARY.body}</p>
          <div style={{ marginBottom: 18 }}>
            {PATTERN_LIBRARY.lines.map(l => <p key={l} style={{ fontFamily: BODY, fontSize: "0.96rem", lineHeight: 1.5, color: "#C7C9BD", margin: 0 }}>{l}</p>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 26 }}>
            {PATTERN_LIBRARY.cards.map(c => <span key={c} style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.8rem", letterSpacing: "0.02em", textTransform: "uppercase", color: "#FFFFFF", border: "2px solid rgba(255,255,255,0.2)", padding: "10px 10px", textAlign: "center" }}>{c}</span>)}
          </div>
          <CTA onClick={next}>Show me how mine lands</CTA>
        </div>
      )}

      {/* 14 GENERIC AI CONTRAST */}
      {step === "generic_ai" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ ...H1, color: "#FFFFFF" }}>{GENERIC_AI.headline}</h1>
          <p style={{ ...LEAD, marginTop: 16, marginBottom: 22 }}>{GENERIC_AI.body}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 28 }}>
            <div style={{ border: "2px solid rgba(255,255,255,0.2)", padding: "16px" }}>
              <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", color: DARK_MUTED, margin: 0, marginBottom: 10 }}>Generic AI</p>
              {GENERIC_AI.generic.map(([k, v]) => <p key={k} style={{ fontFamily: BODY, fontSize: "0.92rem", lineHeight: 1.4, color: "#C7C9BD", margin: "0 0 4px" }}><span style={{ color: "#FFFFFF", fontWeight: 600 }}>{k}: </span>{v}</p>)}
            </div>
            <div style={{ border: `2px solid ${LIME}`, padding: "16px", boxShadow: `4px 4px 0 ${LIME}` }}>
              <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", color: LIME, margin: 0, marginBottom: 10 }}>LANDRIGHT</p>
              {GENERIC_AI.landright.map(([k, v]) => <p key={k} style={{ fontFamily: BODY, fontSize: "0.92rem", lineHeight: 1.4, color: "#E8E8E2", margin: "0 0 4px" }}><span style={{ color: "#FFFFFF", fontWeight: 600 }}>{k}: </span>{v}</p>)}
            </div>
          </div>
          <CTA onClick={next}>Try my message</CTA>
        </div>
      )}

      {/* 15 TRY YOURS */}
      {step === "try_yours" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {moment && <div style={{ marginBottom: 14 }}><MomentPill label={branch.title} /></div>}
          <h1 style={{ ...H1, color: "#FFFFFF" }}>{branch.tryYours.headline}</h1>
          <p style={{ ...LEAD, color: "#C7C9BD", marginTop: 12, marginBottom: 16 }}>Rough is fine. One or two sentences is enough.</p>
          <div style={{ border: "2px solid rgba(255,255,255,0.3)", marginBottom: 12 }}>
            <textarea value={userMsg} onChange={e => setUserMsg(e.target.value)} placeholder={branch.tryYours.placeholder} rows={4} maxLength={500}
              style={{ width: "100%", resize: "none", fontFamily: BODY, fontSize: "1.05rem", lineHeight: 1.6, color: "#FFFFFF", caretColor: LIME, backgroundColor: "transparent", border: "none", padding: "16px 18px", outline: "none", borderRadius: 0, display: "block" }} />
          </div>
          <p style={{ fontFamily: BODY, fontSize: "0.82rem", lineHeight: 1.5, color: DARK_MUTED, marginBottom: 18 }}>Your message is used to generate your routes. You decide what to copy, save or delete.</p>
          <CTA onClick={submitMine} disabled={userMsg.trim().length < MIN_CHARS}>Find the right route</CTA>
          <button onClick={() => setUserMsg(branch.demo.input)} style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer", fontFamily: COND, fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", color: DARK_MUTED }}>Use another sample</button>
        </div>
      )}

      {/* 16 RESULT */}
      {step === "result" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            <span style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.07em", textTransform: "uppercase", color: LIME, border: `2px solid ${LIME}`, padding: "4px 9px" }}>Your routes</span>
            {moment && <MomentPill label={branch.title} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 24 }}>
            {gen.a ? <ResultRouteCard num="01" out={gen.a} /> : (
              <div style={{ border: "2px solid rgba(255,255,255,0.22)", padding: "18px", fontFamily: COND, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", color: DARK_MUTED }}>Reading the moment and shaping your first route…</div>
            )}
            {gen.b ? <ResultRouteCard num="02" out={gen.b} /> : gen.a ? (
              <div style={{ border: "2px solid rgba(255,255,255,0.22)", padding: "18px", fontFamily: COND, fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.06em", textTransform: "uppercase", color: DARK_MUTED }}>Shaping a second route…</div>
            ) : null}
          </div>
          {genState === "done" && <CTA onClick={next}>Continue</CTA>}
        </div>
      )}

      {/* 17 PAYWALL / ACCOUNT GATE */}
      {step === "paywall" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Eyebrow>Save this message?</Eyebrow>
          <h1 style={{ ...H1, color: "#FFFFFF" }}>{PAYWALL.headline}</h1>
          <p style={{ ...LEAD, marginTop: 14, marginBottom: 22 }}>{PAYWALL.body}</p>
          <div style={{ marginBottom: 26 }}>
            {PAYWALL.bullets.map(b => (
              <div key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 9 }}>
                <span style={{ color: LIME, fontWeight: 900 }}>✓</span>
                <span style={{ fontFamily: BODY, fontSize: "0.96rem", lineHeight: 1.4, color: "#E8E8E2" }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CTA onClick={() => { fire("trial_started", { paywall_variant: PAYWALL_VARIANT }); finish(); }}>Start free trial</CTA>
            <CTA onClick={finish} variant="ghost">Continue with limited preview</CTA>
          </div>
        </div>
      )}
    </Shell>
  );
}
