import type { GenerateRequest, GenerationBrief, Domain, Audience } from "@/lib/types";
import { AUDIENCE_GUIDANCE } from "@/lib/types";
import { buildGenerationBrief, relationshipPairCount } from "@/lib/engine/router";
import { buildSourcePacket, getSourcePacketIds } from "@/lib/engine/retrieval";
import { generateOne } from "@/lib/engine/generation";
import { screenInput } from "@/lib/engine/guard";

export type RunResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; error: string };

/**
 * Core single-option generation, shared by the paid /api/generate route and the
 * rate-limited /api/demo-generate route. Stateless; performs input sanitisation
 * and the prompt-injection screen before any model call.
 */
export async function runGenerate(body: GenerateRequest): Promise<RunResult> {
  if (!body.raw_input?.trim()) return { ok: false, status: 400, error: "raw_input is required" };

  // Landright is relationships-only. Domain is locked server-side.
  const domain: Domain = "relationships";

  // Strip the prompt fence tokens so a user can't close our «raw_input» block.
  const rawInput = body.raw_input.replace(/«\/?raw_input»/gi, "").trim().slice(0, 500);

  const screen = screenInput(rawInput);
  if (!screen.ok) return { ok: false, status: 400, error: screen.reason ?? "That input can't be processed." };

  const audienceCode = body.audience as Audience | undefined;
  const validAudience = audienceCode && audienceCode in AUDIENCE_GUIDANCE ? audienceCode : undefined;
  const rotation = Number.isFinite(body.rotation) ? Math.max(0, Math.floor(body.rotation as number)) : 0;
  const which: "a" | "b" = body.which === "b" ? "b" : "a";

  const brief = buildGenerationBrief(rawInput, domain, undefined, rotation) as GenerationBrief;
  brief.audience = validAudience;
  const packet = buildSourcePacket(brief);
  brief.source_packet_ids = getSourcePacketIds(packet);

  const divergeFrom = typeof body.diverge_from === "string" ? body.diverge_from.slice(0, 1500) : undefined;
  const option = await generateOne(brief, packet, which, divergeFrom);

  // Is there at least one more distinct pair after this rotation? Drives whether
  // the client offers "Two more" — so it never re-shows an already-seen title.
  const pairCount = brief.task ? relationshipPairCount(brief.task) : 1;
  const moreAvailable = rotation + 1 < pairCount;

  return {
    ok: true,
    data: {
      success: true,
      which,
      option,
      more_available: moreAvailable,
      brief: {
        domain: brief.domain, age_band: brief.age_band, task: brief.task,
        inferred_goal: brief.inferred_goal, topic_type: brief.topic_type,
        risk_level: brief.risk_level, stack_a: brief.stack_a, stack_b: brief.stack_b,
      },
      event_id: crypto.randomUUID(),
    },
  };
}
