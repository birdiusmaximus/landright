import { NextRequest, NextResponse } from "next/server";
import type { GenerateRequest, GenerateResponse } from "@/lib/types";
import { runGenerate } from "@/lib/engine/run";
import { requirePaid } from "@/lib/entitlement";

export async function POST(req: NextRequest) {
  try {
    // Server-side gate: only signed-in users with an active subscription.
    const gate = await requirePaid();
    if ("error" in gate) return gate.error;

    const body = (await req.json()) as GenerateRequest;
    const r = await runGenerate(body);
    if (!r.ok) {
      return NextResponse.json<GenerateResponse>({ success: false, error: r.error }, { status: r.status });
    }
    return NextResponse.json(r.data);
  } catch (err) {
    console.error("Generation error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json<GenerateResponse>({ success: false, error: message }, { status: 500 });
  }
}
