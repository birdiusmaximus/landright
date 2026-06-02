// ─── Prompt-injection / abuse guardrails ──────────────────────────────────────
//
// Landright's text box is the one place a user's words flow into the model
// prompt, so it's the natural place for someone to try to "hack" the system —
// override the instructions, extract the system prompt, or use the app as a free
// general-purpose LLM. We defend in three layers:
//
//   1. screenInput()  — a deterministic pre-screen that blocks high-signal
//                        jailbreak / extraction attempts *before* we spend a
//                        model call. Patterns are deliberately specific so they
//                        don't trip on sincere emotional messages ("I feel like
//                        you ignore me", "the system isn't working for us" …).
//   2. Prompt framing — the raw input is fenced and labelled as untrusted
//                        content the model must rewrite, never obey (see
//                        generation.ts). This catches anything screenInput misses.
//   3. screenOutput() — a canary that refuses if the model ever echoes its own
//                        instructions or otherwise leaks the system prompt.

// High-signal injection / jailbreak phrasings. Each requires enough qualifying
// words that it essentially never appears in a genuine message to a loved one.
const INJECTION_PATTERNS: RegExp[] = [
  // "ignore / disregard / forget … (previous|above|your|system) … instructions/prompt/rules"
  /\b(ignore|disregard|forget|override|bypass|skip)\b[^.?!]{0,40}\b(previous|prior|earlier|above|preceding|all|any|your|the|these|system)\b[^.?!]{0,30}\b(instruction|instructions|prompt|prompts|rule|rules|guideline|guidelines|directive|directives|context|message|messages)\b/i,
  // asking to reveal / print / repeat the prompt or instructions
  /\b(reveal|show|print|repeat|output|display|expose|leak|tell me|give me|share|reprint|echo)\b[^.?!]{0,30}\b(your |the |these |my |full )?(system )?(prompt|instructions|guidelines|directives|rules|configuration|config)\b/i,
  /\b(system|initial|original|hidden|secret|developer)\s+(prompt|message|instructions?)\b/i,
  /\brepeat\b[^.?!]{0,30}\b(everything|all|the text|the words)\b[^.?!]{0,20}\b(above|before|preceding)\b/i,
  // role / persona overrides
  /\byou are (now|no longer)\b/i,
  /\b(you|i) (are|am) (now )?(a|an|in) (dan|jailbreak|developer mode|unrestricted|unfiltered)\b/i,
  /\bdeveloper mode\b/i,
  /\bdo anything now\b/i,
  /\b(act|behave|respond|answer|reply) as (a |an )?(ai|assistant|chatbot|language model|llm|dan)\b/i,
  /\bpretend (you('re| are)|to be) (an? )?(ai|assistant|chatbot|unrestricted|different|dan)\b/i,
  // fake conversation turns / new-instruction injections
  /(^|\n)\s*(system|assistant|developer)\s*:/i,
  /\bnew (instructions?|rules?|prompt|task|system)\s*:/i,
  /\b(your )?(new|real|true|actual) (instructions?|task|job|purpose) (is|are)\b/i,
  // generic "stop being / forget you are Landright"
  /\b(stop|quit|cease) (being|acting as|pretending)\b[^.?!]{0,20}\b(landright|an? (assistant|writer|tool))\b/i,
  /\bforget (you('re| are)|that you('re| are))\b[^.?!]{0,20}\blandright\b/i,
];

export interface ScreenResult {
  ok: boolean;
  reason?: string;
}

const REFUSAL =
  "That looks like an instruction to the app rather than a message to someone. Landright only rewrites the real thing you want to say to a person you care about — try writing that.";

/**
 * Deterministic pre-screen. Returns ok:false (with a friendly reason) when the
 * input is a clear attempt to manipulate the model rather than a message to
 * rewrite. Tuned to avoid false positives on sincere emotional messages.
 */
export function screenInput(raw: string): ScreenResult {
  const text = (raw || "").trim();
  if (!text) return { ok: false, reason: "Write the message you want to say." };

  for (const re of INJECTION_PATTERNS) {
    if (re.test(text)) return { ok: false, reason: REFUSAL };
  }

  // A message that is overwhelmingly instruction-shaped (many imperative
  // "you must / output / format" tells) without any personal voice is unlikely
  // to be a real relationship message — but we keep this conservative.
  const lower = text.toLowerCase();
  const hardTells = ["</system>", "<system>", "[/inst]", "[inst]", "```system", "<|im_start|>", "<|im_end|>"];
  if (hardTells.some(t => lower.includes(t))) return { ok: false, reason: REFUSAL };

  return { ok: true };
}

// Fragments that should NEVER appear in a rewritten relationship message — if
// they do, the model has leaked its own instructions and we refuse the output.
const LEAK_MARKERS: RegExp[] = [
  /landright's lead writer/i,
  /you are NOT a generic rewriting tool/i,
  /WHOSE MESSAGE THIS IS/i,
  /OUTPUT CONTRACT/i,
  /\bA\/B INTENT\b/i,
  /Directness rule:/i,
  /Forbidden moves/i,
  /core_sequence|primary_effect|failure_mode/i,
  /as an ai language model/i,
  /\bsystem prompt\b/i,
];

/**
 * Output canary. Returns false when the generated text appears to have leaked
 * the system prompt / instructions, so the caller can refuse instead of
 * surfacing it.
 */
export function screenOutput(text: string): boolean {
  if (!text) return false;
  return !LEAK_MARKERS.some(re => re.test(text));
}
