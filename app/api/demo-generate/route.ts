import { NextRequest, NextResponse } from "next/server";
import type { GenerateRequest, GenerateResponse } from "@/lib/types";
import { runGenerate } from "@/lib/engine/run";

// Ungated, rate-limited generation for the onboarding "try yours" taste (used
// before sign-up). The real app uses /api/generate, which requires auth + an
// active subscription.
//
// NOTE: this limiter is in-memory and resets per serverless instance, so it's
// best-effort only. For production, back it with a shared store (Vercel KV /
// Upstash) keyed by IP so the free taste can't be abused for OpenAI cost.
const hits = new Map<string, number[]>();
const MAX = 8; // generations per window (onboarding makes 2 calls per submit → ~4 tries)
const WINDOW_MS = 10 * 60 * 1000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX) { hits.set(ip, recent); return true; }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json<GenerateResponse>(
        { success: false, error: "Demo limit reached. Sign up to keep going." },
        { status: 429 },
      );
    }

    const body = (await req.json()) as GenerateRequest;
    const r = await runGenerate(body);
    if (!r.ok) {
      return NextResponse.json<GenerateResponse>({ success: false, error: r.error }, { status: r.status });
    }
    return NextResponse.json(r.data);
  } catch (err) {
    console.error("Demo generation error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json<GenerateResponse>({ success: false, error: message }, { status: 500 });
  }
}
