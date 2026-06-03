import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { Audience } from "@/lib/types";

// Lazy client so the build never needs the key at module-load time.
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

// Smallest/fastest tier for cheap, throwaway test drafts.
const MODEL = "gpt-5-nano";

// A wide spread of real relationship pressure points so samples keep varying.
const SCENARIOS = [
  "an apology you keep over-explaining instead of just owning",
  "setting a boundary without it sounding cold or final",
  "saying you felt hurt without it turning into blame",
  "asking for more time or attention without sounding needy",
  "reconnecting after a stretch of distance or silence",
  "telling a hard truth you have been avoiding",
  "asking them to stop doing something that keeps bothering you",
  "saying thank you for something you do not usually say out loud",
  "feeling taken for granted and not sure how to bring it up",
  "wanting to pause a heated argument before it gets worse",
  "admitting you were wrong about something specific",
  "asking where the relationship is going",
  "feeling left out of a plan or decision",
  "being annoyed they were late or cancelled again",
  "money or who pays for what feeling unfair",
  "feeling like you always text first",
  "jealousy about someone in their life",
  "asking for help without feeling like a burden",
  "checking in because they have seemed off lately",
  "needing space without them thinking you are pulling away",
  "a small thing that has quietly built up over weeks",
  "wanting more effort on dates or quality time",
  "feeling dismissed when you raise something",
  "asking them to meet your family or friends",
  "saying you miss how things used to feel",
  "owning that you overreacted earlier",
];

// A second axis of variety: register and shape of the draft.
const ANGLES = [
  "as a hesitant question",
  "as a blunt vent",
  "as a careful, gentle opener",
  "mid-frustration, a bit raw",
  "trying hard to sound calm",
  "casual and lowercase, like a quick text",
  "tired and resigned",
  "warm but unsure how to start",
];

const AUDIENCE_DESC: Record<Audience, string> = {
  partner: "romantic partner",
  friend: "close friend",
  family: "family member, such as a parent or sibling",
  other: "person they care about",
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { audience?: Audience };
    const aud = (body.audience && AUDIENCE_DESC[body.audience]) || "partner, friend or family member";
    const scenario = pick(SCENARIOS);
    const angle = pick(ANGLES);

    const completion = await getClient().chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You generate realistic rough first-draft messages for a relationship-communication app's test harness. Output only the unpolished, emotionally real version a real person would actually type before getting help. Not polished, not advice, not therapeutic.",
        },
        {
          role: "user",
          content: `Write ONE message, a single sentence only, that someone might actually type to their ${aud}. Situation: ${scenario}. Write it ${angle}. First person, addressed to the other person. Invent a specific, concrete detail rather than staying generic. Never use placeholders, brackets, or "X". Keep it to one sentence. Return only the sentence, no quotation marks and no preamble.`,
        },
      ],
      // gpt-5 family runs at the default temperature; variety comes from the
      // randomly chosen scenario and angle above. "minimal" reasoning keeps the
      // nano model from spending its whole budget thinking before it writes.
      reasoning_effort: "minimal",
      max_completion_tokens: 600,
    });

    let message = completion.choices[0]?.message?.content?.trim() ?? "";
    message = message.replace(/^["'\s]+|["'\s]+$/g, "");
    // Enforce a single sentence: keep up to the first terminal punctuation.
    const m = message.match(/^[\s\S]*?[.?!](?=\s|$)/);
    if (m) message = m[0].trim();
    message = message.slice(0, 300);
    if (!message) throw new Error("Empty sample");

    return NextResponse.json({ success: true, message });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not generate a sample";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
