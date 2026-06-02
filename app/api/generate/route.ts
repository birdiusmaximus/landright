import { NextRequest, NextResponse } from "next/server";
import type { GenerateRequest, GenerateResponse, GenerationBrief, Domain, Audience } from "@/lib/types";
import { AUDIENCE_GUIDANCE } from "@/lib/types";
import { buildGenerationBrief } from "@/lib/engine/router";
import { buildSourcePacket, getSourcePacketIds } from "@/lib/engine/retrieval";
import { generateOne } from "@/lib/engine/generation";

export async function POST(req: NextRequest) {
  try {
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

    // Sanitise input
    const rawInput = body.raw_input.trim().slice(0, 500);

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

    // Generate the requested single option (OpenAI)
    const option = await generateOne(brief, packet, which);

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
