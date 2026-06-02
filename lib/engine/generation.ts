import OpenAI from "openai";
import type { GenerationBrief, GenerationOutput, SourcePacket, Audience } from "@/lib/types";
import { AUDIENCE_GUIDANCE } from "@/lib/types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are the generation engine for a communication-enhancement product.

Your job is to write two strategically distinct, multilayered paragraph options that help a message land more effectively. You are NOT a generic rewriting tool. You are a staged, audience-aware communication engine.

WHOSE MESSAGE THIS IS (critical):
- The "raw input" is the USER's own rough draft of what THEY want to say to the other person.
- Both options are stronger versions of THAT SAME message, written in the user's first-person voice and addressed to the other person.
- Preserve the user's intent and the point they are making — improve only the delivery so it lands better.
- NEVER treat the raw input as something the other person said to the user. NEVER write a reply, response, or reaction to it. You are rewriting the user's outgoing message, not answering an incoming one.
- Example: if the raw input is "you are annoying me", the options are gentler/clearer ways for the user to SAY that to the other person — not responses to being told it.

CORE RULES:
- Each output is one paragraph — intentionally structured, humanly staged, and audience-ready
- The two options must differ in their layered architecture, not just wording
- Never use manipulation, pseudo-therapy, fabricated authenticity, or false promises
- Never use pressure hidden inside warmth
- Ornament only when it serves the communication job — if plain is safest, keep it plain
- Use quotes only as seed crystals, never as the main answer
- One controlling image is better than many unrelated images
- The default is multilayered and intentionally staged

You will receive a generation brief and source packet. Follow them precisely.

Respond ONLY with valid JSON in the exact schema provided. No prose before or after.`;
}

function buildUserPrompt(brief: GenerationBrief, packet: SourcePacket): string {
  const sections: string[] = [];

  // Generation brief
  sections.push(`## GENERATION BRIEF
Domain: ${brief.domain}${brief.age_band ? ` | Age band: ${brief.age_band.replace(/_/g, " ")}` : ""}
What the user wants to say (their rough draft, to be rewritten in their voice): "${brief.raw_input}"
Inferred goal: ${brief.inferred_goal}
Topic type: ${brief.topic_type.replace(/_/g, " ")}
Emotional intensity: ${brief.emotional_intensity}
Risk level: ${brief.risk_level}
Likely barrier to landing: ${brief.likely_barrier.replace(/_/g, " ")}
Lead engine: ${brief.lead_engine.replace(/_/g, " ")}
Target length: ${brief.target_length} paragraph

Stack A (Option A must use this architecture): ${brief.stack_a}
Stack B (Option B must use this architecture): ${brief.stack_b}

Directness rule: ${brief.directness_rule}

Forbidden moves (never do these):
${brief.forbidden_moves.map(m => `- ${m}`).join("\n")}`);

  // Audience guidance (who the message is for) — tunes tone and guardrails
  const audienceGuidance = brief.audience
    ? AUDIENCE_GUIDANCE[brief.audience as Audience]
    : undefined;
  if (audienceGuidance) {
    sections.push(`## AUDIENCE — writing to ${audienceGuidance.label}
${audienceGuidance.instruction}
Apply this to BOTH options: it shapes tone, familiarity, and directness, while each option still keeps its distinct architecture.`);
  }

  // Directness override if present
  if (packet.directness_override) {
    sections.push(`## ⚠️ OVERRIDE\n${packet.directness_override}`);
  }

  // Domain playbook
  if (packet.domain_playbook) {
    const pb = packet.domain_playbook;
    sections.push(`## DOMAIN PLAYBOOK (${pb.domain})
Core principles:
${pb.core_principles.slice(0, 4).map(p => `- ${p}`).join("\n")}

When story helps: ${pb.when_story_helps.slice(0, 2).join("; ")}
When directness leads: ${pb.when_directness_leads.slice(0, 2).join("; ")}
Guardrails: ${pb.guardrails.slice(0, 3).join("; ")}${
  brief.age_band && pb.age_band_rules?.[brief.age_band]
    ? `\n\nAge band rules (${brief.age_band.replace(/_/g, " ")}):\n${pb.age_band_rules[brief.age_band].slice(0, 3).map(r => `- ${r}`).join("\n")}`
    : ""
}`);
  }

  // Stack definitions
  if (packet.stack_a_def) {
    const s = packet.stack_a_def;
    sections.push(`## STACK A: ${s.stack_name}
Sequence: ${s.core_sequence}
Primary effect: ${s.primary_effect}
Failure to avoid: ${s.failure_mode}`);
  }

  if (packet.stack_b_def && packet.stack_b_def.stack_name !== packet.stack_a_def?.stack_name) {
    const s = packet.stack_b_def;
    sections.push(`## STACK B: ${s.stack_name}
Sequence: ${s.core_sequence}
Primary effect: ${s.primary_effect}
Failure to avoid: ${s.failure_mode}`);
  }

  // Safety rules
  if (packet.safety_rules.length > 0) {
    sections.push(`## SAFETY RULES (must be followed)
${packet.safety_rules.slice(0, 5).map(r =>
  `- [${r.severity.toUpperCase()}] ${r.blocked_move} → Required: ${r.required_move}`
).join("\n")}`);
  }

  // Example seeds
  if (packet.examples.length > 0) {
    sections.push(`## EXAMPLE SEEDS (style and architecture reference — do not copy verbatim)
${packet.examples.slice(0, 2).map(e =>
  `Raw input: "${e.raw_input}"\nStack: ${e.stack_used}\nOutput: ${e.paragraph}\nWhy it works: ${e.why_it_works}`
).join("\n\n---\n\n")}`);
  }

  // Imagery/question bank (only if present)
  if (packet.imagery.length > 0) {
    sections.push(`## IMAGERY / QUESTION REFERENCE (use only if genuinely appropriate)
${packet.imagery.map(i =>
  `${i.family_name} (${i.type}): ${i.content}\nMisuse risk: ${i.misuse_risk}`
).join("\n\n")}`);
  }

  // Output contract
  sections.push(`## OUTPUT CONTRACT
Return ONLY this JSON object, no other text:

{
  "inferred_goal": "one phrase describing the communication goal",
  "likely_barrier": "one phrase describing the main barrier to landing",
  "stack_a_label": "a short, friendly plain-English name for Option A's approach (2-4 words). Describe how it FEELS or what it DOES in everyday words a normal person would use — not the technical technique name. Good examples: 'Kind but clear', 'Own it first', 'Ease into it', 'Say it plainly', 'Lead with care', 'Name the feeling'. AVOID jargon words like: boundary, runway, reset, reframe, accountability, repair, directness, validation, architecture.",
  "stack_b_label": "same style as stack_a_label, for Option B — plain, friendly, 2-4 words, and clearly different from label A",
  "breakdown_a": [
    { "text": "The first clause or sentence, exactly as written.", "note": "what this part is doing (max 12 words)" },
    { "text": "The next clause or sentence.", "note": "its communicative function" }
  ],
  "breakdown_b": [
    { "text": "First clause of option B.", "note": "what this part is doing" }
  ],
  "safety_flags": [],
  "confidence": 0.9
}

RULES FOR THE BREAKDOWN:
- breakdown_a is Option A split into 3–6 ordered segments. Reading the "text" fields in order, joined by single spaces, must form the complete, natural Option A paragraph. Do NOT include a separate full paragraph — the segments ARE the paragraph.
- Each segment is one clause or sentence — a meaningful beat of the message, not a single word.
- Each "note" explains, in plain language (max 12 words), what that beat is doing communicatively (e.g. "names the feeling so it can be heard", "states the boundary plainly").
- breakdown_b does the same for Option B.
- option_a (Stack A architecture) and option_b (Stack B architecture) must be strategically distinct — not cosmetic variants.`);

  return sections.join("\n\n");
}

// ─── Post-generation QA ───────────────────────────────────────────────────────

function runQA(output: GenerationOutput, brief: GenerationBrief): GenerationOutput {
  const flags: string[] = [...output.safety_flags];

  const forbiddenPatterns: Array<[RegExp, string]> = [
    [/\bi promise\b/i, "false-promise language detected"],
    [/\bi guarantee\b/i, "false-promise language detected"],
    [/\byou should feel\b/i, "pseudo-therapy language detected"],
    [/\bwhat you need to do is\b/i, "prescriptive therapy framing detected"],
  ];

  for (const [pattern, flag] of forbiddenPatterns) {
    if (pattern.test(output.option_a) || pattern.test(output.option_b)) {
      flags.push(flag);
    }
  }

  return { ...output, safety_flags: flags };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function generateOptions(
  brief: GenerationBrief,
  packet: SourcePacket
): Promise<GenerationOutput> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(brief, packet);

  const model = "gpt-5.4-mini";
  // Some newer models only accept the default temperature (1).
  const supportsCustomTemp = /^gpt-5\.4|^gpt-4o|^gpt-5-/.test(model);

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    ...(supportsCustomTemp ? { temperature: 0.75 } : {}),
    response_format: { type: "json_object" },
    max_completion_tokens: 1500,
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) throw new Error("No content returned from OpenAI");

  const parsed = JSON.parse(rawContent) as GenerationOutput;

  // Validate + clean labels (strip stray markdown / quotes the model may add)
  const cleanLabel = (s: string) =>
    s.replace(/[*_`#]/g, "").replace(/^["'\s]+|["'\s]+$/g, "").trim();
  for (const field of ["stack_a_label", "stack_b_label"] as const) {
    if (!parsed[field]) throw new Error(`Missing required field in generation output: ${field}`);
    parsed[field] = cleanLabel(parsed[field]);
  }

  // Prefer the stack's curated friendly label so the same technique always shows
  // the same plain-English name; fall back to the model's label if none is set.
  if (packet.stack_a_def?.friendly_label) parsed.stack_a_label = packet.stack_a_def.friendly_label;
  if (packet.stack_b_def?.friendly_label) parsed.stack_b_label = packet.stack_b_def.friendly_label;

  // Credibility (origin/principle) + "why this works" rationale for each option.
  parsed.stack_a_origin = packet.stack_a_def?.origin;
  parsed.stack_b_origin = packet.stack_b_def?.origin;
  parsed.stack_a_rationale = packet.stack_a_def?.rationale;
  parsed.stack_b_rationale = packet.stack_b_def?.rationale;

  // Validate + normalise breakdowns
  const normaliseBreakdown = (segs: unknown, which: string) => {
    if (!Array.isArray(segs) || segs.length === 0) {
      throw new Error(`Missing or empty ${which} in generation output`);
    }
    return segs
      .map(s => ({
        text: typeof (s as { text?: unknown }).text === "string" ? (s as { text: string }).text.trim() : "",
        note: typeof (s as { note?: unknown }).note === "string" ? (s as { note: string }).note.trim() : "",
      }))
      .filter(s => s.text.length > 0);
  };

  parsed.breakdown_a = normaliseBreakdown(parsed.breakdown_a, "breakdown_a");
  parsed.breakdown_b = normaliseBreakdown(parsed.breakdown_b, "breakdown_b");

  // Derive the full paragraphs from the segments (guarantees highlight ↔ text match)
  parsed.option_a = parsed.breakdown_a.map(s => s.text).join(" ");
  parsed.option_b = parsed.breakdown_b.map(s => s.text).join(" ");
  if (!Array.isArray(parsed.safety_flags)) parsed.safety_flags = [];

  return runQA(parsed, brief);
}
