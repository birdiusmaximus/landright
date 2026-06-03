import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { Audience } from "@/lib/types";

// Lazy client so the build never needs the key at module-load time.
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

// Smallest/cheapest model on the project. Swap to a nano tier if the account has
// one — this only needs to produce a short, believable rough draft for testing.
const MODEL = "gpt-5.4-mini";

// Rough relationship situations, picked at random so samples vary run to run.
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
  "asking to talk about where the relationship is going",
];

const AUDIENCE_DESC: Record<Audience, string> = {
  partner: "romantic partner",
  friend: "close friend",
  family: "family member, such as a parent or sibling",
  other: "person they care about",
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { audience?: Audience };
    const aud = (body.audience && AUDIENCE_DESC[body.audience]) || "partner, friend or family member";
    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];

    const completion = await getClient().chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You generate realistic, rough first-draft messages for a relationship-communication app's test harness. Output the unpolished, emotionally real version a real person would actually type before getting help. Not polished, not therapeutic, not advice. Just the messy human message.",
        },
        {
          role: "user",
          content: `Write ONE short rough message, one or two sentences, that someone might actually type to their ${aud}, about: ${scenario}. Make it natural and specific, the kind of clumsy first draft they would want help improving. Write it in the first person, addressed to the other person. Return only the message text with no quotation marks and no preamble.`,
        },
      ],
      temperature: 1,
      max_completion_tokens: 90,
    });

    let message = completion.choices[0]?.message?.content?.trim() ?? "";
    message = message.replace(/^["'\s]+|["'\s]+$/g, "").slice(0, 500);
    if (!message) throw new Error("Empty sample");

    return NextResponse.json({ success: true, message });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not generate a sample";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
