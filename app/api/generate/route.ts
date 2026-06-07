import { NextRequest, NextResponse } from "next/server";
import type { GenerateRequest, GenerateResponse, GenerationBrief, Domain, Audience } from "@/lib/types";
import { AUDIENCE_GUIDANCE } from "@/lib/types";
import { buildGenerationBrief } from "@/lib/engine/router";
import { buildSourcePacket, getSourcePacketIds } from "@/lib/engine/retrieval";
import { generateOne } from "@/lib/engine/generation";
import { screenInput } from "@/lib/engine/guard";
import { requirePaid } from "@/lib/entitlement";

export async function POST(req: NextRequest) {
  try {
    // Server-side gate: only signed-in users with an active subscription.
    const gate = await requirePaid();
    if ("error" in gate) return gate.error;

    const body = (await req.json()) as GenerateRequest;

    // Validate input
    if (!body.raw_input?.trim()) {
      return NextResponse.json<GenerateResponse>(
        { success: false, error: "raw_input is required" },
        { status: 400 }
      );
    }

    // Landright is relationships-only. Domain is locked server-side.
    const domain: Domain = "relationships";

    // Sanitise input. Strip the prompt fence tokens so a user can't close our
    // «raw_input» block early and inject instructions after it.
    const rawInput = body.raw_input
      .replace(/«\/?raw_input»/gi, "")
      .trim()
      .slice(0, 500);

    // Guardrail: block clear prompt-injection / jailbreak attempts before we
    // spend a model call. Tuned not to trip on sincere emotional messages.
    const screen = screenInput(rawInput);
    if (!screen.ok) {
      return NextResponse.json<GenerateResponse>(
        { success: false, error: screen.reason ?? "That input can't be processed." },
        { status: 400 }
      );
    }

    // Resolve optional "who's this for" context (validated audience code).
    const audienceCode = body.audience as Audience | undefined;
    const validAudience =
      audienceCode && audienceCode in AUDIENCE_GUIDANCE ? audienceCode : undefined;

    // Rotation index for "Two more options" — walks the task's stack pool.
    const rotation = Number.isFinite(body.rotation) ? Math.max(0, Math.floor(body.rotation as number)) : 0;

    // Which option to generate. Hybrid: "a" = fast/clear model, "b" = eloquent model.
    // Each call is independent; the brief is deterministic so both stay in sync.
    const which: "a" | "b" = body.which === "b" ? "b" : "a";

    // Build generation brief (decision engine)
    const briefPartial = buildGenerationBrief(rawInput, domain, undefined, rotation);

    // Build source packet (retrieval)
    const brief = briefPartial as GenerationBrief;
    brief.audience = validAudience;
    const packet = buildSourcePacket(brief);
    const sourcePacketIds = getSourcePacketIds(packet);
    brief.source_packet_ids = sourcePacketIds;

    // Optional: steer this option away from an already-generated counterpart that
    // came back too similar (used by the client's "not too alike" safety net).
    const divergeFrom = typeof body.diverge_from === "string" ? body.diverge_from.slice(0, 1500) : undefined;

    // Generate the requested single option (OpenAI)
    const option = await generateOne(brief, packet, which, divergeFrom);

    // Stateless: nothing is stored. The id is just a client-side handle.
    const eventId = crypto.randomUUID();

    return NextResponse.json({
      success: true,
      which,
      option,
      // Brief tags (deterministic) — the client uses these from the "a" response.
      brief: {
        domain: brief.domain,
        age_band: brief.age_band,
        task: brief.task,
        inferred_goal: brief.inferred_goal,
        topic_type: brief.topic_type,
        risk_level: brief.risk_level,
        stack_a: brief.stack_a,
        stack_b: brief.stack_b,
      },
      event_id: eventId,
    });
  } catch (err) {
    console.error("Generation error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json<GenerateResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
