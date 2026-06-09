import { NextRequest, NextResponse } from "next/server";
import type { GenerateRequest, GenerateResponse } from "@/lib/types";
import { runGenerate } from "@/lib/engine/run";
import { requirePaid } from "@/lib/entitlement";
import { recordGeneration } from "@/lib/usage";
import { AUTH_DISABLED } from "@/lib/admin";

export async function POST(req: NextRequest) {
  try {
    // Server-side gate: only signed-in users with an active subscription.
    const gate = await requirePaid();
    if ("error" in gate) return gate.error;

    const body = (await req.json()) as GenerateRequest;

    // Per-subscriber monthly cap. Counted once per generation, on the primary
    // "a" call — the "b" option and any retries belong to the same generation.
    // Only when billing is on (free web app + admins are exempt inside).
    if (!AUTH_DISABLED && body.which !== "b") {
      const usage = await recordGeneration(gate.userId);
      if (!usage.allowed) {
        return NextResponse.json<GenerateResponse>(
          { success: false, error: "Monthly generation limit reached.", limit_reached: true, limit: usage.limit, resets_at: usage.resetsAt },
          { status: 429 },
        );
      }
    }

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
