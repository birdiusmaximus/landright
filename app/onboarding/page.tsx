"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { APP_VERSION } from "@/lib/version";
// Demo route examples, pre-generated with gpt-5.5 so the onboarding shows options
// at their most elaborate. Real user messages still use the live fast/slow hybrid.
import DEMOS from "@/data/onboarding_demos.json";

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
  "mirror", "trap", "why", "demo_input", "processing", "route_cards", "generic_ai", "line_breakdown",
  "pattern_library", "try_yours", "result", "paywall",
] as const;
type StepId = (typeof STEPS)[number];

// Light is the app's home canvas; a few "moment" screens go dark for weight.
const DARK_SCREENS: StepId[] = ["splash", "trap", "paywall"];

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
  breakdown: { a: BeatMark[]; b: BeatMark[] };
  rootedIn: { a: RoutePattern; b: RoutePattern };
  tryYours: { headline: string; placeholder: string };
}

interface RoutePattern { pattern: string; rootedIn: string; usedFor: string; whatChanges: string }
interface BeatMark { span: string; why: string; rootedIn: string }

const BRANCHES: Record<Moment, Branch> = {
  apology_without_self_defence: {
    title: "Apology without self-defence",
    cardBody: "I need to apologise, but I keep explaining myself.",
    receiver_risk: "defensive", desired_landing: "accountable",
    mirror: { headline: "You chose apology without self-defence.", lead: "This is the apology that starts with “sorry,” then slowly becomes a defence speech.", youMean: "You may be trying to explain the pressure.", theyHear: "They may hear you trying to escape the impact." },
    trap: { headline: "The explanation can arrive too early.", body: "In a tense apology, the first sentence sets the temperature. When context comes before impact, the other person may listen for excuses instead of repair.", theyHear: "You are sorry, but you still think I caused it." },
    why: { headline: "A better apology lets them feel the impact was seen.", body: "The job is to put the impact where it belongs, own your part clearly and make the next step feel real. It should not become self-punishment. It should not become a defence speech." },
    routeMap: { risk: "Sounds like an excuse", routeA: "A real apology", routeB: "Name it before they do", lineLogic: "impact first, no defensive “but,” repair made visible", rootedIn: ["Effective-apology research", "The Gottman Method", "Perceived partner responsiveness"] },
    demo: { input: "Sorry I snapped, but you were pushing me.", note: "This is where the apology starts defending itself." },
    routes: {
      a: { label: "A real apology", text: "I’m sorry I snapped at you. That was unfair, and I can see how it made the conversation feel unsafe. I want to own that before I explain anything else.", bestWhen: "The main repair needed is clear accountability." },
      b: { label: "Name it before they do", text: "I know this may sound like I’m about to make an excuse, so I want to be clear first. Snapping at you was on me. I was overwhelmed, but I should have paused instead of taking it out on you.", bestWhen: "Context matters, but only after responsibility is clear." },
    },
    compare: { headline: "Both routes repair, but they do different work.", lineA: "A real apology keeps the message clean and accountable.", lineB: "Name it before they do helps when you need to include context without letting context become the centre." },
    breakdown: { a: [], b: [] },
    rootedIn: {
      a: { pattern: "A real apology", rootedIn: "Effective-apology research and accountability-first repair", usedFor: "When the repair simply needs clear ownership", whatChanges: "It puts your responsibility ahead of any explanation." },
      b: { pattern: "Name it before they do", rootedIn: "Negative acknowledgment and repair communication", usedFor: "When context matters but must not lead", whatChanges: "It names the likely concern before context becomes an excuse." },
    },
    tryYours: { headline: "Write the apology before you start explaining it.", placeholder: "Sorry I snapped, but…" },
  },
  need_without_pressure: {
    title: "Need without pressure",
    cardBody: "I need to ask for more without sounding needy.",
    receiver_risk: "needy", desired_landing: "clear_request",
    mirror: { headline: "You chose need without pressure.", lead: "This is the message where the need is real, but the first draft sounds like a complaint.", youMean: "You may mean closeness.", theyHear: "They may hear accusation." },
    trap: { headline: "A need can sound like a demand.", body: "When the message begins with what they never do, they may defend their freedom before they hear what you are asking for.", theyHear: "You are failing me, and now you need to fix how I feel." },
    why: { headline: "A better ask gives them something they can respond to.", body: "The aim is to name the feeling, give one concrete example and turn the need into a request that does not corner them." },
    routeMap: { risk: "Sounds needy or demanding", routeA: "Feeling, then ask", routeB: "Ask, don’t demand", lineLogic: "owned feeling, concrete example, willing request", rootedIn: ["Nonviolent Communication", "Emotionally focused communication principles", "Autonomy-supportive communication"] },
    demo: { input: "You never make time for me anymore.", note: "This is where a need starts to sound like a complaint." },
    routes: {
      a: { label: "Feeling, then ask", text: "I’ve been missing proper time with you lately. When our evenings keep getting swallowed up, I start to feel less close to you. Could we choose one night this week that is just ours?", bestWhen: "You want the feeling understood and the ask to be clear." },
      b: { label: "Ask, don’t demand", text: "Would you be willing to look at this week with me and find one proper time to connect? I do not want to pressure you. I want us to protect a bit of space for each other.", bestWhen: "The other person may feel pressured or controlled." },
    },
    compare: { headline: "One route names the need. One route protects their freedom.", lineA: "Feeling, then ask makes the emotional need visible.", lineB: "Ask, don’t demand makes the request feel more collaborative." },
    breakdown: { a: [], b: [] },
    rootedIn: {
      a: { pattern: "Feeling, then ask", rootedIn: "Nonviolent Communication and emotionally focused communication", usedFor: "When the feeling needs to be understood first", whatChanges: "It makes the need visible before the request arrives." },
      b: { pattern: "Ask, don’t demand", rootedIn: "Nonviolent Communication and autonomy-supportive communication", usedFor: "When the other person may feel pressured", whatChanges: "It keeps the request clear without cornering the other person." },
    },
    tryYours: { headline: "Write the thing you need, even if it sounds too much.", placeholder: "I feel like I’m always asking for…" },
  },
  hurt_without_blame: {
    title: "Hurt without blame",
    cardBody: "I need to say I am hurt without blaming them.",
    receiver_risk: "blaming", desired_landing: "understood_impact",
    mirror: { headline: "You chose hurt without blame.", lead: "This is the message where pain wants to be understood, but the first draft sounds like prosecution.", youMean: "You may mean “that landed badly for me.”", theyHear: "They may hear “you are the problem.”" },
    trap: { headline: "Pain can turn into a case against them.", body: "When the message assigns motive too quickly, the other person may start defending what they meant instead of hearing what happened to you.", theyHear: "You did this on purpose, and now you need to answer for it." },
    why: { headline: "A better message protects the impact from becoming an accusation.", body: "The feeling stays visible. The example stays concrete. The wording leaves room for their intent without erasing your experience." },
    routeMap: { risk: "Sounds accusatory", routeA: "Kind but clear", routeB: "Show what’s underneath", lineLogic: "impact, no motive-reading, vulnerable need", rootedIn: ["The Gottman Method", "Nonviolent Communication", "Emotionally focused communication principles"] },
    demo: { input: "You embarrassed me in front of everyone.", note: "This is where hurt starts sounding like blame." },
    routes: {
      a: { label: "Kind but clear", text: "I felt embarrassed when that was said in front of everyone. I do not think you meant to hurt me, but it stayed with me. I would like us to talk about it privately.", bestWhen: "You need the impact to be clear without accusing their intent." },
      b: { label: "Show what’s underneath", text: "I think what hurt most was feeling exposed instead of backed up. I am not trying to make you the villain. I want you to understand why it landed so badly for me.", bestWhen: "The surface complaint is really about a deeper emotional need." },
    },
    compare: { headline: "One route names the impact. One route reveals the deeper need.", lineA: "Kind but clear helps when the event needs to be named.", lineB: "Show what’s underneath helps when the hurt is carrying a more vulnerable meaning." },
    breakdown: { a: [], b: [] },
    rootedIn: {
      a: { pattern: "Kind but clear", rootedIn: "The Gottman Method and Nonviolent Communication", usedFor: "When the event itself needs to be named", whatChanges: "It states the impact without putting their intent on trial." },
      b: { pattern: "Show what’s underneath", rootedIn: "Emotionally focused communication and the Gottman Method", usedFor: "When the hurt carries a more vulnerable meaning", whatChanges: "It keeps your experience clear while leaving room for their intent." },
    },
    tryYours: { headline: "Write the hurt version first. LANDRIGHT will help remove the blame.", placeholder: "You made me feel…" },
  },
  boundary_without_coldness: {
    title: "Boundary without coldness",
    cardBody: "I need to set a boundary without sounding cold.",
    receiver_risk: "cold", desired_landing: "warm_boundary",
    mirror: { headline: "You chose boundary without coldness.", lead: "This is the message where the limit matters, but the tone can make it sound like the relationship is being withdrawn.", youMean: "You may mean “I need this to stop.”", theyHear: "They may hear “I am done with you.”" },
    trap: { headline: "A boundary can sound like rejection.", body: "When care disappears from the sentence, the other person may react to the perceived abandonment instead of the limit.", theyHear: "You are too much, and I am pulling away." },
    why: { headline: "A good boundary stays clear without going cold.", body: "The limit should not be buried under apologies. The care should not erase the limit. Both need to stay visible." },
    routeMap: { risk: "Sounds cruel, cold or abandoning", routeA: "Hold the line kindly", routeB: "A limit, with love", lineLogic: "clean limit, relational continuity, next step", rootedIn: ["Boundary-setting", "The Gottman Method", "Relational continuity"] },
    demo: { input: "I can’t keep doing this every night.", note: "This is where a limit can sound like rejection." },
    routes: {
      a: { label: "Hold the line kindly", text: "I can’t keep having this conversation late at night. I am willing to talk tomorrow when we are calmer, but tonight I need to stop.", bestWhen: "The limit needs to be clear and firm." },
      b: { label: "A limit, with love", text: "I care about us, which is why I do not want another exhausted conversation to damage this more. I need to stop for tonight, and I want us to come back to it tomorrow.", bestWhen: "You want the boundary to feel connected rather than cold." },
    },
    compare: { headline: "One route protects the limit. One route protects the connection.", lineA: "Hold the line kindly keeps the boundary clean.", lineB: "A limit, with love makes the care visible while the limit stays intact." },
    breakdown: { a: [], b: [] },
    rootedIn: {
      a: { pattern: "Hold the line kindly", rootedIn: "Boundary-setting and clear-limit communication", usedFor: "When the limit needs to be firm and clear", whatChanges: "It states the limit cleanly without burying it in apology." },
      b: { pattern: "A limit, with love", rootedIn: "Boundary-setting and relational continuity", usedFor: "When the limit could read as rejection", whatChanges: "It keeps the limit visible while showing the relationship still matters." },
    },
    tryYours: { headline: "Write the boundary, even if it sounds cold right now.", placeholder: "I can’t keep doing…" },
  },
  reconnect_after_distance: {
    title: "Reconnect after distance",
    cardBody: "I want to reconnect, but I do not know how to open the door.",
    receiver_risk: "pressuring", desired_landing: "open_door",
    mirror: { headline: "You chose reconnect after distance.", lead: "This is the first sentence after silence, awkwardness or distance. It can easily carry too much.", youMean: "You may mean “I miss us.”", theyHear: "They may hear “you need to fix this now.”" },
    trap: { headline: "Reconnection can sound like pressure.", body: "When the opening asks for closeness too quickly, the other person may protect the distance instead of stepping toward the conversation.", theyHear: "You owe me closeness now." },
    why: { headline: "A better opening gives the relationship a door.", body: "The message should acknowledge the distance, keep care visible and invite a next step without demanding immediate closeness." },
    routeMap: { risk: "Sounds loaded or pressuring", routeA: "Us vs the problem", routeB: "Ask what matters", lineLogic: "shared problem, no blame, open question", rootedIn: ["Getting to Yes", "Perspective-taking", "Coaching practice"] },
    demo: { input: "So are we just not talking now?", note: "This is where reconnection can start sounding like accusation." },
    routes: {
      a: { label: "Us vs the problem", text: "I do not want the distance to become the whole story. I think we both got stuck, and I would like us to find a way back into the conversation.", bestWhen: "You want to reduce blame and name the shared problem." },
      b: { label: "Ask what matters", text: "Could I ask what you need from me before we try to talk properly? I want to understand what matters most right now rather than push us into another difficult exchange.", bestWhen: "You want to reopen contact without forcing closeness." },
    },
    compare: { headline: "One route names the distance. One route invites their reality.", lineA: "Us vs the problem helps when the relationship needs a shared frame.", lineB: "Ask what matters helps when the other person may need space before repair." },
    breakdown: { a: [], b: [] },
    rootedIn: {
      a: { pattern: "Us vs the problem", rootedIn: "Getting to Yes and shared-problem framing", usedFor: "When the relationship needs a shared frame", whatChanges: "It names the distance as a shared problem instead of placing it on one person." },
      b: { pattern: "Ask what matters", rootedIn: "Perspective-taking and coaching practice", usedFor: "When the other person may need space first", whatChanges: "It reopens contact without demanding immediate closeness." },
    },
    tryYours: { headline: "Write the first sentence you have not known how to send.", placeholder: "So are we just not talking…" },
  },
  pause_before_escalation: {
    title: "Pause before it gets worse",
    cardBody: "I need to stop this before we both say something worse.",
    receiver_risk: "shutting_down", desired_landing: "safe_pause",
    mirror: { headline: "You chose pause before it gets worse.", lead: "This is the message you send when the conversation is getting too hot to handle well.", youMean: "You may mean “I want to protect this.”", theyHear: "They may hear “I am shutting you out.”" },
    trap: { headline: "A pause can feel like disappearance.", body: "If the message only says “I can’t talk,” the other person may experience it as punishment, rejection or stonewalling.", theyHear: "I am done listening to you." },
    why: { headline: "A better pause creates space and a return point.", body: "The goal is to stop the spiral while making clear that the conversation is not being abandoned." },
    routeMap: { risk: "Sounds like shutdown", routeA: "Pause-and-return", routeB: "Soft start, clear point", lineLogic: "name overload, pause, commit to return", rootedIn: ["The Gottman Method", "Conflict de-escalation", "Boundary-setting"] },
    demo: { input: "I can’t talk to you when you’re like this.", note: "This is where a pause starts sounding like rejection." },
    routes: {
      a: { label: "Pause-and-return", text: "I want to pause before we say things we cannot take back. I am going to take some space now, and I will come back to this tomorrow.", bestWhen: "The conversation is too heated and needs a clear return point." },
      b: { label: "Soft start, clear point", text: "I care about resolving this. I also know I am getting too activated to do it well right now. I need us to stop for tonight and continue when we are both steadier.", bestWhen: "You need to pause while making care and intent visible." },
    },
    compare: { headline: "One route creates distance safely. One route explains the pause.", lineA: "Pause-and-return is short and protective.", lineB: "Soft start, clear point adds reassurance when the pause could feel like rejection." },
    breakdown: { a: [], b: [] },
    rootedIn: {
      a: { pattern: "Pause-and-return", rootedIn: "Conflict de-escalation and the Gottman Method", usedFor: "When the conversation needs to stop fast", whatChanges: "It stops the spiral while keeping a clear point of return." },
      b: { pattern: "Soft start, clear point", rootedIn: "The Gottman Method and de-escalation practice", usedFor: "When the pause could feel like rejection", whatChanges: "It pauses the conversation while keeping your care visible." },
    },
    tryYours: { headline: "Write the message before the argument gets worse.", placeholder: "I can’t do this right now…" },
  },
  truth_without_attack: {
    title: "Truth without attack",
    cardBody: "I need to say the truth without turning it into an attack.",
    receiver_risk: "attacking", desired_landing: "honest_but_receivable",
    mirror: { headline: "You chose truth without attack.", lead: "This is the message where the truth matters, but the delivery could make it sound harsher than you mean.", youMean: "You may mean “I need to be honest.”", theyHear: "They may hear “here is everything you did wrong.”" },
    trap: { headline: "A true sentence can still land too sharply.", body: "When the message arrives with too much force, the other person may react to the threat before they understand the point.", theyHear: "You are being judged, not spoken to." },
    why: { headline: "A better truth stays clear enough to trust.", body: "The goal is to remove the extra threat around the message so the real point has a better chance of being heard." },
    routeMap: { risk: "Sounds harsh or final", routeA: "Just say it plainly", routeB: "Ease into it", lineLogic: "plain truth, soft runway, no unnecessary threat", rootedIn: ["Plain-language authenticity", "The Gottman Method", "Staged delivery"] },
    demo: { input: "I don’t think this is working anymore.", note: "This is where truth can land harder than intended." },
    routes: {
      a: { label: "Just say it plainly", text: "I need to be honest. I am not feeling okay about where we are, and I do not want to pretend I am.", bestWhen: "The message needs clarity more than emotional build-up." },
      b: { label: "Ease into it", text: "I want to say this carefully because it matters. I have been feeling unsure about us for a while, and I think we need to talk honestly about where this is going.", bestWhen: "The truth is difficult and the opening needs more emotional runway." },
    },
    compare: { headline: "One route is plain. One route creates runway.", lineA: "Just say it plainly reduces confusion.", lineB: "Ease into it prepares the emotional ground before the difficult point lands." },
    breakdown: { a: [], b: [] },
    rootedIn: {
      a: { pattern: "Just say it plainly", rootedIn: "Plain-language authenticity and owned-truth communication", usedFor: "When clarity matters more than build-up", whatChanges: "It removes the extra force so the point stays clear." },
      b: { pattern: "Ease into it", rootedIn: "Staged delivery and plain-language authenticity", usedFor: "When the truth is hard and needs runway", whatChanges: "It prepares the ground so the real point has room to be heard." },
    },
    tryYours: { headline: "Write the truth plainly. LANDRIGHT will help it land.", placeholder: "I need to be honest…" },
  },
};

const MOMENT_ORDER: Moment[] = [
  "apology_without_self_defence", "need_without_pressure", "hurt_without_blame",
  "boundary_without_coldness", "reconnect_after_distance", "pause_before_escalation", "truth_without_attack",
];

// The principle behind each route, shown as credibility on "why landing matters".
// Grounded paraphrases of established ideas (not verbatim quotes), attributed to
// the tradition they come from.
const WHY_EVIDENCE: Record<Moment, string> = {
  apology_without_self_defence: "In research on what makes an apology work, the strongest ingredient is a clear acknowledgment of responsibility. It restores trust more than the explanation, the justification, or even an offer to make it right. When context arrives before that ownership, the other person hears it as a defence, and the repair never fully lands.",
  need_without_pressure: "Nonviolent Communication draws a sharp line between a request and a demand. A request says what you would like and leaves the other person genuinely free to say no, while a demand carries an unspoken threat of blame if they refuse. People move toward a request, and brace against a demand, even when the words are almost the same.",
  hurt_without_blame: "Gottman’s research on conflict finds that a complaint framed as a character attack, the ‘you always’ version, reliably triggers defensiveness. The same hurt raised as a specific feeling about a specific moment can actually be heard. Naming the impact without guessing at motive keeps it about what happened, not about who they are.",
  boundary_without_coldness: "Boundary work separates the limit from the relationship. A clear limit protects you, but when warmth disappears alongside it, the other person reacts to the perceived withdrawal rather than the request itself. Keeping care visible is what lets a boundary read as ‘this matters to me,’ not ‘I am done with you.’",
  reconnect_after_distance: "A central idea in Getting to Yes is to separate the people from the problem. When the distance itself becomes the shared thing to solve, rather than a fault to assign, both people can turn toward it instead of defending themselves. An opening that invites the other person’s reality reopens a conversation that pressure would only close.",
  pause_before_escalation: "Gottman’s work on emotional flooding shows that once we are physiologically overwhelmed, we literally cannot take in what the other person is saying, so pushing on only makes it worse. A pause that names the overwhelm and commits to a clear return point protects the conversation. On its own, ‘I can’t talk’ reads as stonewalling.",
  truth_without_attack: "Hard truths are rarely rejected for being true. They are rejected for the threat wrapped around them. Plain language and a staged opening remove that extra charge, the blame and the suddenness, so the real point has room to be heard rather than defended against.",
};

// ─── Shared content ───────────────────────────────────────────────────────────

const RECOGNITION = {
  items: [
    { line: "You try to apologise, and it lands as a defence.", msg: "I’m sorry, but…", reply: "Wow, you clearly didn’t even mean it…" },
    { line: "You ask for more, and it lands as pressure.", msg: "You never make time for me…", reply: "That’s not fair, I’m doing my best…" },
    { line: "You say you are hurt, and it lands as blame.", msg: "You always do this…", reply: "Always? So now I’m the bad guy…" },
    { line: "You set a boundary, and it lands as rejection.", msg: "I need some space…", reply: "So you’re just giving up on us?" },
  ],
};

const PATTERN_LIBRARY = {
  body: "LANDRIGHT draws from more than 30 communication patterns for hard, tender and awkward messages, all grounded in relationship and communication research.",
  // The 30 user-facing patterns (friendly_label) from data/stack_families.json.
  cards: ["Step back and see it", "See it their way first", "Use a real example", "Ask what matters", "Ease the pressure", "Kind but clear", "Feeling, then ask", "Own it first", "Paint it, then say it", "Build up to it", "Ease into it", "Soft start, clear point", "Show what’s underneath", "Ask, don’t demand", "A real apology", "Own it, reassure them", "Hold the line kindly", "A limit, with love", "Just say it plainly", "A specific thank you", "Get them, then ask", "Us vs the problem", "Picture us ahead", "Hard news, said kindly", "Point it out kindly", "Let them get there", "We’ve got this, here’s next", "Ask first, then share", "Name it before they do", "Say it, then why"],
};

const GENERIC_AI = {
  headlineGeneric: "Generic AI just polished the sentence.",
  headlineLandright: "LANDRIGHT reads the moment.",
  body: "A relationship message has a job. It may need to apologise, ask, repair, reassure, pause, reconnect, set a boundary or tell the truth. LANDRIGHT identifies that job, chooses a communication route, then shows what each line is doing.",
  generic: [["Prompt", "Make this nicer."], ["Focus", "tone and polish."], ["Output", "one smoother version."], ["Explanation", "usually vague or missing."]],
  landright: [["Question", "What is this message trying to do?"], ["Risk", "What could it sound like if it lands badly?"], ["Route", "Which pattern fits this pressure moment?"], ["Explanation", "why each line was built that way."]],
};

const PAYWALL = {
  headline: "Unlock the full communication toolkit.",
  body: "Get more routes, full line-by-line explanations and pattern guidance for the conversations that matter.",
  bullets: ["Turn difficult moments into connection, not distance", "More than 30 communication patterns", "Multiple routes for each message", "Line-by-line “why it works”", "Generate more approaches when the first one is not quite right"],
};

// ─── Analytics (no raw message text ever leaves the client) ───────────────────

function emit(event: string, props: Record<string, unknown>) {
  const w = window as unknown as { analytics?: { track?: (e: string, p: unknown) => void } };
  if (w.analytics?.track) w.analytics.track(event, props);
  else if (process.env.NODE_ENV !== "production") console.debug("[analytics]", event, props);
}

// ─── Primitives (lifted from the app's visual language) ───────────────────────

type TagVariant = "solid" | "outline" | "ink";
function Tag({ children, variant = "solid", size = "sm" }: { children: React.ReactNode; variant?: TagVariant; size?: "sm" | "xs" }) {
  const styles: Record<TagVariant, React.CSSProperties> = {
    solid: { backgroundColor: LIME, color: INK, border: `2px solid ${INK}` },
    outline: { backgroundColor: "transparent", color: INK, border: `2px solid ${INK}` },
    ink: { backgroundColor: INK, color: LIME, border: `2px solid ${INK}` },
  };
  return <span style={{ ...styles[variant], display: "inline-block", fontFamily: COND, fontWeight: 900, fontSize: size === "xs" ? "0.72rem" : "0.82rem", letterSpacing: "0.07em", textTransform: "uppercase", padding: size === "xs" ? "4px 9px" : "6px 12px", lineHeight: 1.1, whiteSpace: "nowrap" }}>{children}</span>;
}

// Lime highlighter mark for headline emphasis (the app's signature).
function Mark({ children }: { children: React.ReactNode }) {
  return <span style={{ backgroundColor: LIME, color: INK, padding: "0.02em 0.16em", display: "inline-block", transform: "rotate(-1.4deg)", WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" }}>{children}</span>;
}

function CTA({ children, onClick, disabled, variant = "primary", onDark = false, full = true }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "primary" | "ink" | "outline"; onDark?: boolean; full?: boolean }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const edge = onDark ? LIME : INK;
  const active = hovered || pressed;
  // The "ink" forward CTAs sit lime at rest and invert to black on hover/press.
  const inkLook = active
    ? { bg: INK, color: LIME, shadow: LIME, border: INK }
    : { bg: LIME, color: INK, shadow: INK, border: INK };
  const look = variant === "ink" ? inkLook : {
    primary: { bg: LIME, color: INK, shadow: INK, border: INK },
    ink: inkLook,
    outline: { bg: "transparent", color: onDark ? "#FFFFFF" : INK, shadow: edge, border: edge },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseDown={() => !disabled && setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => { setPressed(false); setHovered(false); }}
      style={{ fontFamily: COND, fontWeight: 900, fontSize: "1.02rem", letterSpacing: "0.05em", textTransform: "uppercase", border: `2px solid ${disabled ? MUTED : look.border}`, padding: "16px 26px", width: full ? "100%" : undefined,
        cursor: disabled ? "not-allowed" : "pointer", backgroundColor: disabled ? (onDark ? "rgba(120,120,120,0.18)" : GROUND2) : look.bg, color: disabled ? MUTED : look.color,
        boxShadow: disabled ? "none" : pressed ? `0 0 0 ${look.shadow}` : `4px 4px 0 ${look.shadow}`, transform: pressed ? "translate(4px,4px)" : "none", transition: "transform .1s ease, box-shadow .1s ease, background-color .12s ease, color .12s ease", borderRadius: 0 }}>
      {children}
    </button>
  );
}

// The app's latency-paced loading bar (ink track, lime fill).
function LoadingBar({ expectedMs = 1400 }: { expectedMs?: number }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      const t = performance.now() - start;
      setPct(t < expectedMs ? 0.92 * (t / expectedMs) : 0.92 + 0.07 * (1 - Math.exp(-(t - expectedMs) / 2200)));
    }, 50);
    return () => clearInterval(id);
  }, [expectedMs]);
  return (
    <div style={{ height: 12, overflow: "hidden", backgroundColor: INK, border: `2px solid ${INK}` }}>
      <div style={{ height: "100%", width: `${(pct * 100).toFixed(1)}%`, backgroundColor: LIME, transition: "width .1s linear" }} />
    </div>
  );
}

// The app's outlined-number + label header band for a route card.
function CardHeader({ index, label }: { index: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", borderBottom: `2px solid ${LIME}` }}>
      <div style={{ borderRight: "2px solid rgba(255,255,255,0.16)", padding: "10px 18px", display: "flex", alignItems: "center" }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(34px, 8vw, 48px)", lineHeight: 0.8, color: "transparent", WebkitTextStroke: `2px ${LIME}` }}>{index}</span>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 18px" }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.05rem, 4vw, 1.4rem)", letterSpacing: "-0.01em", textTransform: "uppercase", color: "#FFFFFF", lineHeight: 1.02 }}>{label}</span>
      </div>
    </div>
  );
}

// The app's TriMarker (corner triangles + thin lines that frame a highlight).
function TriMarker({ pos, innerRef }: { pos: "start" | "end"; innerRef?: React.Ref<HTMLSpanElement> }) {
  const base: React.CSSProperties = { position: "absolute", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", pointerEvents: "none" };
  const line: React.CSSProperties = { position: "absolute", width: 1, backgroundColor: LIME, pointerEvents: "none" };
  return (
    <span ref={innerRef} aria-hidden style={{ position: "relative", display: "inline-block", width: 0, height: "1em", verticalAlign: "text-bottom" }}>
      {pos === "start" ? (
        <>
          <i style={{ ...base, borderTop: `7px solid ${LIME}`, top: "-11px", left: "-8px" }} />
          <i style={{ ...line, left: "-2px", top: "-4px", height: "27px" }} />
        </>
      ) : (
        <>
          <i style={{ ...base, borderBottom: `7px solid ${LIME}`, bottom: "-7px", left: "-4px" }} />
          <i style={{ ...line, left: "2px", top: "-10px", height: "27px" }} />
        </>
      )}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1500); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done); else done();
  }
  return <button onClick={copy} style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.05em", textTransform: "uppercase", border: `2px solid ${LIME}`, backgroundColor: copied ? LIME : "transparent", color: copied ? INK : LIME, padding: "8px 14px", cursor: "pointer", borderRadius: 0 }}>{copied ? "Copied" : "Copy text"}</button>;
}

// ─── Highlight message (the app's exact interaction: TriMarker + WAAPI settle) ─

type Seg = { text: string; hi: number | null };
function segmentMessage(text: string, spans: readonly string[]): Seg[] {
  const lower = text.toLowerCase();
  const found = spans.map((span, i) => ({ i, span, at: lower.indexOf(span.toLowerCase()) })).filter(x => x.at >= 0).sort((a, b) => a.at - b.at);
  const out: Seg[] = [];
  let cursor = 0;
  for (const f of found) {
    if (f.at < cursor) continue;
    if (f.at > cursor) out.push({ text: text.slice(cursor, f.at), hi: null });
    out.push({ text: text.slice(f.at, f.at + f.span.length), hi: f.i });
    cursor = f.at + f.span.length;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), hi: null });
  return out;
}

function HighlightMessage({
  text, marks, autoSweep = false, underline = false, onDark = false, onOpen,
}: {
  text: string;
  marks: { span: string; note: string; rootedIn?: string }[];
  autoSweep?: boolean;
  underline?: boolean;
  onDark?: boolean; // render flush on a dark card with an inline note (app result style)
  onOpen?: (count: number) => void;
}) {
  const segs = segmentMessage(text, marks.map(m => m.span));
  const [active, setActive] = useState<number | null>(null); // active SEGMENT index
  const trackRef = useRef(0);
  const paraRef = useRef<HTMLParagraphElement | null>(null);
  const hiRef = useRef<HTMLSpanElement | null>(null);
  const endRef = useRef<HTMLSpanElement | null>(null);
  const animSeq = useRef(0);
  const canHover = useRef(true);
  const sweepCancelled = useRef(false);
  const sweepRunning = useRef(false);
  const opened = useRef<Set<number>>(new Set());

  useEffect(() => { canHover.current = window.matchMedia?.("(hover: hover)").matches ?? true; }, []);

  const travelForIndex = (segIndex: number) => {
    const wrap = paraRef.current?.children[segIndex] as HTMLElement | undefined;
    const hl = wrap?.firstElementChild as HTMLElement | undefined;
    if (!hl) return 0;
    const rects = hl.getClientRects();
    return rects.length ? Math.round(rects[rects.length - 1].width * 0.2) : 0;
  };

  const open = (segIndex: number, el?: HTMLElement) => {
    if (sweepRunning.current && el) return; // ignore passive hover mid-sweep
    trackRef.current = el ? (() => { const r = el.getClientRects(); return r.length ? Math.round(r[r.length - 1].width * 0.2) : 0; })() : travelForIndex(segIndex);
    animSeq.current += 1;
    setActive(segIndex);
    const segHi = segs[segIndex]?.hi;
    if (segHi !== null && segHi !== undefined) { opened.current.add(segHi); onOpen?.(opened.current.size); }
  };

  // WAAPI "settle": the lime fill grows its last 20%, the end marker rides in.
  useEffect(() => {
    if (active === null) return;
    const dur = 380, ease = "cubic-bezier(0.22, 1, 0.36, 1)";
    if (hiRef.current) hiRef.current.animate([{ backgroundSize: "80% 100%" }, { backgroundSize: "100% 100%" }], { duration: dur, easing: ease });
    if (endRef.current && trackRef.current > 0) endRef.current.animate([{ transform: `translateX(-${trackRef.current}px)` }, { transform: "translateX(0)" }], { duration: dur, easing: ease });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, animSeq.current]);

  // Auto-sweep through the highlighted segments on first appearance.
  useEffect(() => {
    if (!autoSweep) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const interactive = segs.map((s, i) => (s.hi !== null ? i : -1)).filter(i => i >= 0);
    if (!interactive.length) return;
    sweepCancelled.current = false; sweepRunning.current = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const onAbort = () => { sweepCancelled.current = true; sweepRunning.current = false; };
    window.addEventListener("pointerdown", onAbort, { once: true });
    interactive.forEach((segIndex, k) => timers.push(setTimeout(() => { if (sweepCancelled.current) return; trackRef.current = travelForIndex(segIndex); animSeq.current += 1; setActive(segIndex); }, 460 + k * 620)));
    timers.push(setTimeout(() => { sweepRunning.current = false; if (!sweepCancelled.current) setActive(null); }, 460 + interactive.length * 620 + 120));
    return () => { sweepRunning.current = false; timers.forEach(clearTimeout); window.removeEventListener("pointerdown", onAbort); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const activeHi = active !== null && segs[active]?.hi !== null && segs[active]?.hi !== undefined ? (segs[active].hi as number) : null;
  const activeMark = activeHi !== null ? marks[activeHi] : null;

  const para = (
        <p ref={paraRef} style={{ fontFamily: BODY, fontSize: "1.04rem", lineHeight: 1.9, color: "#FFFFFF", margin: 0, padding: onDark ? 0 : "18px" }}>
          {segs.map((seg, i) => {
            const interactive = seg.hi !== null;
            const on = active === i;
            let content: React.ReactNode = seg.text;
            if (on && interactive) {
              const firstSp = seg.text.indexOf(" "), lastSp = seg.text.lastIndexOf(" ");
              content = firstSp === -1 ? (
                <span style={{ whiteSpace: "nowrap" }}><TriMarker pos="start" />{seg.text}<TriMarker pos="end" innerRef={endRef} /></span>
              ) : (
                <>
                  <span style={{ whiteSpace: "nowrap" }}><TriMarker pos="start" />{seg.text.slice(0, firstSp)}</span>
                  {seg.text.slice(firstSp, lastSp + 1)}
                  <span style={{ whiteSpace: "nowrap" }}>{seg.text.slice(lastSp + 1)}<TriMarker pos="end" innerRef={endRef} /></span>
                </>
              );
            }
            return (
              <span key={i}>
                <span ref={on ? hiRef : undefined}
                  onMouseEnter={e => { if (interactive && canHover.current) open(i, e.currentTarget); }}
                  onMouseLeave={() => { if (interactive && canHover.current) setActive(null); }}
                  onClick={e => { if (!interactive) return; sweepCancelled.current = true; sweepRunning.current = false; if (active === i) setActive(null); else open(i, e.currentTarget); }}
                  style={{ position: "relative", color: on ? INK : "#FFFFFF",
                    backgroundImage: on ? `linear-gradient(${LIME}, ${LIME})` : "none", backgroundRepeat: "no-repeat", backgroundPosition: "left center", backgroundSize: "100% 100%",
                    padding: "0.05em 0.1em", cursor: interactive ? "pointer" : "default", borderBottom: underline && interactive && !on ? `2px solid ${LIME}` : "2px solid transparent",
                    transition: "color 0.12s ease", WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" }}>
                  {content}
                </span>
                {i < segs.length - 1 ? " " : ""}
              </span>
            );
          })}
        </p>
  );

  const note = onDark ? (
    <div style={{ minHeight: 44, marginTop: 14 }}>
      {activeMark ? (
        <span style={{ fontFamily: BODY, fontSize: "0.92rem", lineHeight: 1.55, color: "#FFFFFF" }}>
          {activeHi !== null && <span style={{ color: LIME, fontWeight: 700 }}>{`Beat ${activeHi + 1}/${marks.length} — `}</span>}{activeMark.note}
        </span>
      ) : (
        <span style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: LIME }}>Hover or tap the text</span>
      )}
    </div>
  ) : (
    <div style={{ minHeight: 78, marginTop: 12, border: "2px solid rgba(17,17,16,0.16)", padding: "13px 16px", backgroundColor: GROUND2 }}>
      {activeMark ? (
        <>
          {activeMark.rootedIn && <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase", color: INK, margin: 0 }}>Rooted in {activeMark.rootedIn}</p>}
          <p style={{ fontFamily: BODY, fontSize: "0.95rem", lineHeight: 1.55, color: INK, marginTop: activeMark.rootedIn ? 6 : 0, marginBottom: 0 }}>{activeMark.note}</p>
        </>
      ) : (
        <p style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, margin: 0 }}>Hover or tap a line to see what it is doing</p>
      )}
    </div>
  );

  return (
    <>
      {onDark ? para : <div className="surface-dark" style={{ border: `2px solid ${INK}` }}>{para}</div>}
      {note}
    </>
  );
}

// ─── Shell: light ground canvas (or dark for the few "moment" screens) ────────

function Shell({ stepIndex, dark, onBack, children }: { stepIndex: number; dark: boolean; onBack?: () => void; children: React.ReactNode }) {
  const pct = Math.round((stepIndex / (STEPS.length - 1)) * 100);
  const fg = dark ? "#FFFFFF" : INK;
  const edge = dark ? LIME : INK;
  return (
    <main className={dark ? "surface-dark" : undefined} style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: dark ? DARK : "transparent", color: fg, padding: "clamp(18px, 5vw, 36px)" }}>
      <div style={{ width: "100%", maxWidth: 560, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "clamp(20px, 5vw, 36px)" }}>
          {onBack ? <button onClick={onBack} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", color: fg, fontFamily: COND, fontWeight: 900, fontSize: "1.2rem", padding: 0, lineHeight: 1 }}>←</button> : <span style={{ width: 12 }} />}
          {stepIndex > 0 ? (
            <div style={{ flex: 1, height: 6, backgroundColor: dark ? "rgba(255,255,255,0.14)" : GROUND2, border: `2px solid ${edge}` }}>
              <div style={{ height: "100%", width: `${pct}%`, backgroundColor: LIME, transition: "width .35s cubic-bezier(.22,1,.36,1)" }} />
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          <a href="/" aria-label="Back to Landright" style={{ textDecoration: "none" }}>
            <span style={{ display: "inline-block", fontFamily: COND, fontWeight: 900, fontSize: "0.72rem", letterSpacing: "0.07em", textTransform: "uppercase", padding: "4px 9px", lineHeight: 1.1, border: `2px solid ${edge}`, color: edge }}>v{APP_VERSION}</span>
          </a>
        </div>
        {children}
      </div>
    </main>
  );
}

const H1: React.CSSProperties = { fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.9rem, 6.8vw, 2.6rem)", lineHeight: 1.0, letterSpacing: "-0.025em", textTransform: "uppercase", margin: 0 };
const LEAD_INK: React.CSSProperties = { fontFamily: BODY, fontSize: "1.06rem", lineHeight: 1.6, color: INK, margin: 0 };

// Light selectable moment card with an outlined number (the app button language).
function MomentCard({ index, title, body, selected = false, onClick }: { index: string; title: string; body: string; selected?: boolean; onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  // Fill the card the moment it's pressed/selected (the app's selected-button look).
  const on = selected || pressed;
  return (
    <button onClick={onClick} onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      style={{ width: "100%", textAlign: "left", cursor: "pointer", borderRadius: 0, border: `2px solid ${INK}`, backgroundColor: on ? INK : "transparent", padding: "14px 16px", display: "flex", gap: 14, alignItems: "center",
        boxShadow: pressed ? `0 0 0 ${LIME}` : `4px 4px 0 ${LIME}`, transform: pressed ? "translate(4px,4px)" : "none", transition: "transform .1s ease, box-shadow .1s ease, background-color .12s ease" }}>
      <span style={{ flexShrink: 0, fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(26px, 7vw, 36px)", lineHeight: 0.8, color: "transparent", WebkitTextStroke: `2px ${on ? LIME : INK}` }}>{index}</span>
      <span>
        <span style={{ display: "block", fontFamily: DISPLAY, fontWeight: 900, fontSize: "1.08rem", letterSpacing: "-0.01em", textTransform: "uppercase", color: on ? LIME : INK }}>{title}</span>
        <span style={{ display: "block", fontFamily: BODY, fontSize: "0.92rem", lineHeight: 1.4, color: on ? DARK_MUTED : MUTED, marginTop: 3 }}>{body}</span>
      </span>
    </button>
  );
}

// Dark route card on light ground (the app result-card chrome).
function RouteCard({ index, label, text, bestWhen, active }: { index: string; label: string; text: string; bestWhen?: string; active?: boolean }) {
  return (
    <div className="surface-dark" style={{ border: `2px solid ${INK}`, boxShadow: active ? `6px 6px 0 ${LIME}` : "none" }}>
      <CardHeader index={index} label={label} />
      <div style={{ padding: "18px" }}>
        <p style={{ fontFamily: BODY, fontSize: "1.0rem", lineHeight: 1.72, color: "#FFFFFF", margin: 0 }}>{text}</p>
        {bestWhen && <p style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.03em", textTransform: "uppercase", color: DARK_MUTED, marginTop: 14, marginBottom: 0 }}>Best when: {bestWhen}</p>}
      </div>
    </div>
  );
}

interface OptionOut { stack_label: string; option: string; origin?: string; rationale?: string; breakdown: { text: string; note: string }[] }
function ResultRouteCard({ index, out, autoSweep }: { index: string; out: OptionOut; autoSweep?: boolean }) {
  return (
    <div className="surface-dark" style={{ border: `2px solid ${INK}`, boxShadow: `6px 6px 0 ${LIME}` }}>
      <CardHeader index={index} label={out.stack_label} />
      <div style={{ padding: "18px" }}>
        <HighlightMessage text={out.option} marks={out.breakdown.map(b => ({ span: b.text, note: b.note }))} autoSweep={autoSweep} onDark />
        {out.origin && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 18 }}>
            <span style={{ width: 9, height: 9, backgroundColor: LIME, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.9rem", letterSpacing: "0.05em", textTransform: "uppercase", color: LIME }}>Rooted in {out.origin}</span>
          </div>
        )}
        {out.rationale && <p style={{ fontFamily: BODY, fontSize: "0.88rem", lineHeight: 1.55, color: "#B9BBAE", marginTop: 8 }}>{out.rationale}</p>}
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
  const dark = DARK_SCREENS.includes(step);

  const [moment, setMoment] = useState<Moment | null>(null);
  const [receiverRisk, setReceiverRisk] = useState<ReceiverRisk | null>(null);
  const [desiredLanding, setDesiredLanding] = useState<DesiredLanding | null>(null);
  const baseBranch = moment ? BRANCHES[moment] : BRANCHES.apology_without_self_defence;
  const demoOverride = (DEMOS as Record<Moment, Pick<Branch, "routes" | "breakdown">>)[moment ?? "apology_without_self_defence"];
  // gpt-5.5 demo routes + matching highlights override the placeholder copy.
  const branch: Branch = { ...baseBranch, ...demoOverride };

  const [breakdownRoute, setBreakdownRoute] = useState<"a" | "b">("a");
  const [userMsg, setUserMsg] = useState("");
  const [focused, setFocused] = useState(false);
  const [genState, setGenState] = useState<"idle" | "loading" | "done">("idle");
  const [gen, setGen] = useState<{ a: OptionOut | null; b: OptionOut | null }>({ a: null, b: null });

  const fire = useCallback((event: string, extra: Record<string, unknown> = {}) => {
    emit(event, { screen_id: STEPS[index], screen_index: index, selected_moment: moment, receiver_risk: receiverRisk, desired_landing: desiredLanding, ...extra });
  }, [index, moment, receiverRisk, desiredLanding]);

  useEffect(() => {
    if (step === "splash") fire("onboarding_started");
    fire("onboarding_screen_viewed", { screen_id: step });
    if (step === "trap") fire("branch_trap_viewed");
    if (step === "why") fire("branch_route_viewed");
    if (step === "demo_input") fire("demo_input_viewed");
    if (step === "route_cards") fire("demo_routes_viewed");
    if (step === "pattern_library") fire("pattern_library_viewed");
    if (step === "generic_ai") fire("generic_ai_contrast_viewed");
    if (step === "try_yours") fire("try_yours_started");
    if (step === "paywall") { fire("account_gate_viewed"); fire("paywall_viewed", { paywall_variant: PAYWALL_VARIANT }); }
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

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
    setTimeout(next, 320); // hold briefly so the selected colour registers
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
    setGenState("loading"); setGen({ a: null, b: null }); goto("result");
    const call = (which: "a" | "b") => fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raw_input: msg, which, onboarding: ctx() }) }).then(r => r.json());
    const pa = call("a"); const pb = call("b");
    try {
      const da = await pa;
      if (da.success) { setGen(g => ({ ...g, a: da.option })); setGenState("done"); fire("onboarding_completed"); }
      else { setGenState("idle"); goto("try_yours"); return; }
    } catch { setGenState("idle"); goto("try_yours"); return; }
    try { const db = await pb; if (db.success) setGen(g => ({ ...g, b: db.option })); } catch { /* B is a bonus */ }
  }

  const showBack = index > 1 && step !== "result" && step !== "processing";

  return (
    <Shell stepIndex={index} dark={dark} onBack={showBack ? back : undefined}>
      {/* 0 SPLASH (dark) — the home hero, white text + lime highlight */}
      {step === "splash" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(3rem, 13vw, 5.6rem)", lineHeight: 0.84, letterSpacing: "-0.035em", textTransform: "uppercase", color: "#FFFFFF", marginBottom: "clamp(64px, 22vh, 200px)" }}>
            Make your{" "}
            <span style={{ fontStyle: "italic" }}>message</span><br />
            <Mark>land right.</Mark>
          </h1>
          <CTA onClick={next} variant="primary">Continue</CTA>
        </div>
      )}

      {/* 1 RECOGNITION (light editorial) */}
      {step === "recognition" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ ...H1, color: INK }}>
            There is the message<br />
            <Mark>you send</Mark>, and the message <Mark>they hear.</Mark>
          </h1>
          <div style={{ marginTop: 28, marginBottom: 26 }}>
            {RECOGNITION.items.map(item => (
              <div key={item.line} style={{ borderLeft: `4px solid ${LIME}`, paddingLeft: 16, marginBottom: 20 }}>
                <p style={{ ...LEAD_INK, marginBottom: 10 }}>{item.line}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ padding: "9px 12px", fontFamily: BODY, fontSize: "0.88rem", lineHeight: 1.3, color: INK, border: `2px solid ${INK}`, whiteSpace: "nowrap" }}>{item.msg}</span>
                  <span style={{ padding: "9px 12px", fontFamily: BODY, fontSize: "0.88rem", lineHeight: 1.3, color: "#FFFFFF", backgroundColor: INK, border: `2px solid ${INK}`, whiteSpace: "nowrap" }}>{item.reply}</span>
                </div>
              </div>
            ))}
          </div>
          <CTA onClick={next} variant="ink">Yes, that&rsquo;s me</CTA>
        </div>
      )}

      {/* 2 MOMENT SELECTION (light, numbered cards) */}
      {step === "moment" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 12 }}><Tag variant="solid">What are you trying to say carefully?</Tag></div>
          <p style={{ ...LEAD_INK, color: MUTED, marginBottom: 20 }}>Choose the moment that feels closest.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {MOMENT_ORDER.map((m, i) => <MomentCard key={m} index={String(i + 1).padStart(2, "0")} title={BRANCHES[m].title} body={BRANCHES[m].cardBody} selected={moment === m} onClick={() => chooseMoment(m)} />)}
          </div>
        </div>
      )}

      {/* 3 MIRROR (light): lead with recognition, not a restated label */}
      {step === "mirror" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.8rem", letterSpacing: "0.18em", textTransform: "uppercase", color: INK, marginBottom: 14 }}>Sound familiar?</p>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.55rem, 5.8vw, 2.2rem)", lineHeight: 1.14, letterSpacing: "-0.02em", color: INK, margin: 0 }}>{branch.mirror.lead}</h1>
          <div style={{ marginTop: 24, marginBottom: 30, borderLeft: `4px solid ${LIME}`, paddingLeft: 16 }}>
            <p style={{ ...LEAD_INK, fontWeight: 600, margin: 0 }}>{branch.mirror.youMean}</p>
            <p style={{ ...LEAD_INK, color: MUTED, marginTop: 6, marginBottom: 0 }}>{branch.mirror.theyHear}</p>
          </div>
          <CTA onClick={next} variant="ink">Show me the trap</CTA>
        </div>
      )}

      {/* 4 TRAP (dark, for weight) */}
      {step === "trap" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", color: LIME, marginBottom: 14 }}>What can go wrong</p>
          <h1 style={{ ...H1, color: "#FFFFFF" }}>{branch.trap.headline}</h1>
          <p style={{ fontFamily: BODY, fontSize: "1.06rem", lineHeight: 1.6, color: "#E8E8E2", marginTop: 18, marginBottom: 22 }}>{branch.trap.body}</p>
          <div style={{ border: `2px solid ${LIME}`, padding: "16px 18px", marginBottom: 28 }}>
            <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.74rem", letterSpacing: "0.08em", textTransform: "uppercase", color: LIME, margin: 0 }}>The version that actually arrives</p>
            <p style={{ fontFamily: BODY, fontSize: "1.05rem", lineHeight: 1.5, color: "#FFFFFF", marginTop: 8, marginBottom: 0 }}>“{branch.trap.theyHear}”</p>
          </div>
          <CTA onClick={next} variant="ink">Why landing matters</CTA>
        </div>
      )}

      {/* 5 WHY (light) */}
      {step === "why" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: 14 }}><Tag variant="outline">Why landing matters</Tag></div>
          <h1 style={{ ...H1, color: INK }}>{branch.why.headline}</h1>
          <p style={{ ...LEAD_INK, marginTop: 18 }}>{branch.why.body}</p>
          {/* Credibility: the sources first, then the principle behind them */}
          <div style={{ marginTop: 22, marginBottom: 22 }}>
            <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.74rem", letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, marginBottom: 9 }}>Rooted in</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {branch.routeMap.rootedIn.map(r => <span key={r} style={{ fontFamily: BODY, fontSize: "0.82rem", color: INK, border: `1px solid ${INK}`, padding: "4px 9px" }}>{r}</span>)}
            </div>
          </div>
          <div style={{ borderLeft: `4px solid ${LIME}`, paddingLeft: 16, marginBottom: 30 }}>
            <p style={{ ...LEAD_INK, fontStyle: "italic", margin: 0 }}>{WHY_EVIDENCE[moment ?? "apology_without_self_defence"]}</p>
          </div>
          <CTA onClick={next} variant="ink">See it in the app</CTA>
        </div>
      )}

      {/* 7 DEMO INPUT (light, dark input like the app) */}
      {step === "demo_input" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: 12 }}><Tag variant="solid">Raw thought</Tag></div>
          <div className="surface-dark" style={{ border: `2px dashed ${INK}` }}>
            <p style={{ fontFamily: BODY, fontSize: "1.1rem", lineHeight: 1.55, color: "#E8E8E2", margin: 0, padding: "16px 18px" }}>{branch.demo.input}</p>
          </div>
          <p style={{ ...LEAD_INK, fontSize: "0.9rem", color: MUTED, marginTop: 12, marginBottom: 26 }}>{branch.demo.note}</p>
          <CTA onClick={next} variant="ink">Find the route</CTA>
        </div>
      )}

      {/* 8 PROCESSING (light, app loading bar) */}
      {step === "processing" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.92rem", letterSpacing: "0.1em", textTransform: "uppercase", color: INK, marginBottom: 16 }}>Reading the moment. Choosing a route.</p>
          <LoadingBar expectedMs={1300} />
        </div>
      )}

      {/* 9 ROUTE CARDS (light, dark result-card chrome) */}
      {step === "route_cards" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h1 style={{ ...H1, color: INK }}>Two routes for this <Mark>moment.</Mark></h1>
          <p style={{ ...LEAD_INK, color: MUTED, marginTop: 12, marginBottom: 20 }}>The same thought, shaped two ways.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <RouteCard index="01" label={branch.routes.a.label} text={branch.routes.a.text} bestWhen={branch.routes.a.bestWhen} active />
            <RouteCard index="02" label={branch.routes.b.label} text={branch.routes.b.text} bestWhen={branch.routes.b.bestWhen} />
          </div>
          <div style={{ marginTop: 24 }}><CTA onClick={next} variant="ink">See the difference</CTA></div>
        </div>
      )}

      {/* LINE BREAKDOWN (light, app highlight interaction) */}
      {step === "line_breakdown" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h1 style={{ ...H1, color: INK }}>What each line is <Mark>doing.</Mark></h1>
          <p style={{ ...LEAD_INK, color: MUTED, marginTop: 12, marginBottom: 18 }}>Tap a highlighted phrase to see why it works.</p>
          <div style={{ display: "flex", gap: 0, marginBottom: 16, border: `2px solid ${INK}` }}>
            {(["a", "b"] as const).map(r => (
              <button key={r} onClick={() => setBreakdownRoute(r)} style={{ flex: 1, fontFamily: COND, fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.05em", textTransform: "uppercase", padding: "10px 8px", cursor: "pointer", border: "none", borderRight: r === "a" ? `2px solid ${INK}` : "none", borderRadius: 0, backgroundColor: breakdownRoute === r ? LIME : "transparent", color: INK }}>
                {r === "a" ? branch.routes.a.label : branch.routes.b.label}
              </button>
            ))}
          </div>
          <HighlightMessage key={breakdownRoute} text={breakdownRoute === "a" ? branch.routes.a.text : branch.routes.b.text} marks={branch.breakdown[breakdownRoute].map(b => ({ span: b.span, note: b.why, rootedIn: b.rootedIn }))} autoSweep underline onOpen={(c) => fire("line_breakdown_opened", { highlight_count: c })} />
          <div style={{ marginTop: 22 }}><CTA onClick={next} variant="ink">See the method</CTA></div>
        </div>
      )}

      {/* 12 PATTERN LIBRARY (light, dark pattern wall) */}
      {step === "pattern_library" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h1 style={{ ...H1, color: INK }}>A named method<br />for the message<br />you are holding.</h1>
          <p style={{ ...LEAD_INK, marginTop: 14, marginBottom: 24 }}>{PATTERN_LIBRARY.body}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 26 }}>
            {PATTERN_LIBRARY.cards.map((c, i) => (
              <span key={c} className="surface-dark" style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.82rem", letterSpacing: "0.02em", textTransform: "uppercase", color: i % 5 === 0 ? INK : "#FFFFFF", backgroundColor: i % 5 === 0 ? LIME : DARK, border: `2px solid ${INK}`, padding: "11px 10px", textAlign: "center" }}>{c}</span>
            ))}
          </div>
          <CTA onClick={next} variant="ink">Show me how mine lands</CTA>
        </div>
      )}

      {/* 14 GENERIC AI CONTRAST (light, contrast cards) */}
      {step === "generic_ai" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* Section 1 — what generic AI does */}
          <h1 style={{ ...H1, color: INK }}>{GENERIC_AI.headlineGeneric}</h1>
          <div style={{ border: `2px solid ${INK}`, padding: "16px", backgroundColor: GROUND2, marginTop: 18, marginBottom: 34 }}>
            <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, margin: "0 0 10px" }}>Generic AI</p>
            {GENERIC_AI.generic.map(([k, v]) => <p key={k} style={{ fontFamily: BODY, fontSize: "0.92rem", lineHeight: 1.4, color: INK, margin: "0 0 4px" }}><span style={{ fontWeight: 700 }}>{k}: </span>{v}</p>)}
          </div>
          {/* Section 2 — what LANDRIGHT does */}
          <h1 style={{ ...H1, color: INK }}>{GENERIC_AI.headlineLandright}</h1>
          <p style={{ ...LEAD_INK, marginTop: 16, marginBottom: 22 }}>{GENERIC_AI.body}</p>
          <div className="surface-dark" style={{ border: `2px solid ${INK}`, padding: "16px", boxShadow: `4px 4px 0 ${LIME}`, marginBottom: 28 }}>
            <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", color: LIME, margin: "0 0 10px" }}>LANDRIGHT</p>
            {GENERIC_AI.landright.map(([k, v]) => <p key={k} style={{ fontFamily: BODY, fontSize: "0.92rem", lineHeight: 1.4, color: "#E8E8E2", margin: "0 0 4px" }}><span style={{ color: "#FFFFFF", fontWeight: 700 }}>{k}: </span>{v}</p>)}
          </div>
          <CTA onClick={next} variant="ink">See what each line does</CTA>
        </div>
      )}

      {/* 15 TRY YOURS (light, dark input like the app) */}
      {step === "try_yours" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {moment && <div style={{ marginBottom: 14 }}><Tag variant="solid">{branch.title}</Tag></div>}
          <h1 style={{ ...H1, color: INK }}>{branch.tryYours.headline}</h1>
          <p style={{ ...LEAD_INK, color: MUTED, marginTop: 12, marginBottom: 16 }}>Rough is fine. One or two sentences is enough.</p>
          <div className="surface-dark" style={{ border: `2px solid ${INK}`, boxShadow: focused ? `4px 4px 0 ${LIME}` : "none", transition: "box-shadow .1s ease", marginBottom: 12 }}>
            <textarea className="dark-input" value={userMsg} onChange={e => setUserMsg(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={branch.tryYours.placeholder} rows={4} maxLength={500}
              style={{ width: "100%", resize: "none", fontFamily: BODY, fontSize: "1.05rem", lineHeight: 1.6, color: "#FFFFFF", caretColor: LIME, backgroundColor: "transparent", border: "none", padding: "16px 18px", outline: "none", borderRadius: 0, display: "block" }} />
          </div>
          <p style={{ fontFamily: BODY, fontSize: "0.82rem", lineHeight: 1.5, color: MUTED, marginBottom: 18 }}>Your message is used to generate your routes. You decide what to copy, save or delete.</p>
          <CTA onClick={submitMine} variant="primary" disabled={userMsg.trim().length < MIN_CHARS}>Find the right route</CTA>
          <button onClick={() => setUserMsg(branch.demo.input)} style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer", fontFamily: COND, fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>Use another sample</button>
        </div>
      )}

      {/* 16 RESULT (light, dark result cards with line-by-line) */}
      {step === "result" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            <Tag variant="ink" size="xs">Your routes</Tag>
            {moment && <Tag variant="outline" size="xs">{branch.title}</Tag>}
          </div>
          {genState === "loading" && !gen.a && (
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", color: INK, marginBottom: 12 }}>Reading the moment and shaping your routes.</p>
              <LoadingBar expectedMs={2700} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 24 }}>
            {gen.a && <ResultRouteCard index="01" out={gen.a} autoSweep />}
            {gen.a && !gen.b && (
              <div style={{ border: `2px solid ${INK}` }}>
                <div style={{ padding: "16px 18px" }}><LoadingBar expectedMs={10000} /><p style={{ fontFamily: COND, fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, marginTop: 12, marginBottom: 0 }}>Shaping a more expressive route.</p></div>
              </div>
            )}
            {gen.b && <ResultRouteCard index="02" out={gen.b} />}
          </div>
          {genState === "done" && <CTA onClick={next} variant="ink">Continue</CTA>}
        </div>
      )}

      {/* 17 PAYWALL (dark close) */}
      {step === "paywall" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontFamily: COND, fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", color: LIME, marginBottom: 14 }}>Save this message?</p>
          <h1 style={{ ...H1, color: "#FFFFFF" }}>{PAYWALL.headline}</h1>
          <p style={{ fontFamily: BODY, fontSize: "1.04rem", lineHeight: 1.55, color: "#E8E8E2", marginTop: 14, marginBottom: 22 }}>{PAYWALL.body}</p>
          <div style={{ marginBottom: 26 }}>
            {PAYWALL.bullets.map(b => (
              <div key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 9 }}>
                <span style={{ color: LIME, fontWeight: 900 }}>✓</span>
                <span style={{ fontFamily: BODY, fontSize: "0.96rem", lineHeight: 1.4, color: "#E8E8E2" }}>{b}</span>
              </div>
            ))}
          </div>
          <CTA onClick={() => { fire("trial_started", { paywall_variant: PAYWALL_VARIANT }); finish(); }} variant="primary">Start free trial</CTA>
        </div>
      )}
    </Shell>
  );
}
