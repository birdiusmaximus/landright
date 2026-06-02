import type {
  Domain, GenerationBrief, SourcePacket,
  DomainPlaybook, StackFamily, Example, SafetyRule, ImageryQuestion
} from "@/lib/types";
import playbooksRaw from "@/data/domain_playbooks.json";
import stacksRaw from "@/data/stack_families.json";
import examplesRaw from "@/data/examples.json";
import safetyRaw from "@/data/safety_rules.json";
import imageryRaw from "@/data/imagery_questions.json";

const playbooks = playbooksRaw as DomainPlaybook[];
const stacks = stacksRaw as StackFamily[];
const examples = examplesRaw as Example[];
const safetyRules = safetyRaw as SafetyRule[];
const imagery = imageryRaw as ImageryQuestion[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDomainPlaybook(domain: Domain): DomainPlaybook | null {
  return playbooks.find(p => p.domain === domain) ?? null;
}

function getStackDef(stackName: string): StackFamily | null {
  return stacks.find(s => s.stack_name === stackName) ?? null;
}

function getRelevantSafetyRules(brief: GenerationBrief): SafetyRule[] {
  return safetyRules.filter(r => {
    if (r.domain !== "all" && r.domain !== brief.domain) return false;

    // Match trigger types
    const triggers: Record<string, boolean> = {
      any: true,
      harmful_behavior: brief.topic_type === "harmful_behavior",
      high_stakes_truth: brief.topic_type === "high_stakes_truth",
      apology: brief.topic_type === "apology",
      intimate_question: brief.topic_type === "sensitive_question",
      executive_communication: brief.domain === "business" && brief.topic_type === "proposal",
      safety_critical: brief.risk_level === "safety_critical",
      correction: brief.topic_type === "correction",
      feedback: brief.topic_type === "feedback",
      teen: brief.age_band === "teen",
    };

    return triggers[r.trigger_type] ?? false;
  });
}

function getRelevantExamples(brief: GenerationBrief): Example[] {
  // First try: same domain + same or related stack
  const domainExamples = examples.filter(e => e.domain === brief.domain);

  const stackMatches = domainExamples.filter(
    e => e.stack_used === brief.stack_a || e.stack_used === brief.stack_b
  );

  if (stackMatches.length >= 2) return stackMatches.slice(0, 3);
  if (domainExamples.length >= 2) return domainExamples.slice(0, 3);
  return examples.slice(0, 2);
}

function getRelevantImagery(brief: GenerationBrief): ImageryQuestion[] {
  // Only retrieve imagery when appropriate
  const useImagery =
    brief.domain !== "parenting" ||
    brief.age_band !== "young_child" ||
    brief.topic_type === "routine";

  if (!useImagery) return [];

  return imagery
    .filter(i => i.domains.includes(brief.domain))
    .slice(0, 2);
}

function getDirectnessOverride(brief: GenerationBrief): string | null {
  if (brief.risk_level === "safety_critical") {
    return "SAFETY OVERRIDE: Output must begin with direct, unambiguous fact. No runway, no story, no imagery before the essential information.";
  }
  if (brief.topic_type === "high_stakes_truth") {
    return "HIGH-STAKES OVERRIDE: Direct fact must come first. Comfort and questions follow.";
  }
  if (brief.topic_type === "harmful_behavior") {
    return "BOUNDARY OVERRIDE: The limit must be clearly stated. Warm entry is permitted but the rule must land unambiguously.";
  }
  return null;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function buildSourcePacket(brief: GenerationBrief): SourcePacket {
  const sourcePacketIds: string[] = [];

  const domainPlaybook = getDomainPlaybook(brief.domain);
  if (domainPlaybook) sourcePacketIds.push(`playbook_${brief.domain}`);

  const safetyBlock = getRelevantSafetyRules(brief);
  safetyBlock.forEach(r => sourcePacketIds.push(r.rule_id));

  const stackADef = getStackDef(brief.stack_a);
  const stackBDef = getStackDef(brief.stack_b);
  if (stackADef) sourcePacketIds.push(`stack_${brief.stack_a.replace(/\s/g, "_")}`);
  if (stackBDef) sourcePacketIds.push(`stack_${brief.stack_b.replace(/\s/g, "_")}`);

  const relevantExamples = getRelevantExamples(brief);
  relevantExamples.forEach(e => sourcePacketIds.push(e.example_id));

  const relevantImagery = getRelevantImagery(brief);
  relevantImagery.forEach(i => sourcePacketIds.push(i.item_id));

  const directnessOverride = getDirectnessOverride(brief);

  return {
    domain_playbook: domainPlaybook,
    safety_rules: safetyBlock,
    stack_a_def: stackADef,
    stack_b_def: stackBDef,
    examples: relevantExamples,
    imagery: relevantImagery,
    directness_override: directnessOverride,
  };
}

export function getSourcePacketIds(packet: SourcePacket): string[] {
  const ids: string[] = [];
  if (packet.domain_playbook) ids.push(`playbook_${packet.domain_playbook.domain}`);
  packet.safety_rules.forEach(r => ids.push(r.rule_id));
  if (packet.stack_a_def) ids.push(`stack_${packet.stack_a_def.stack_name.replace(/\s/g, "_")}`);
  if (packet.stack_b_def) ids.push(`stack_${packet.stack_b_def.stack_name.replace(/\s/g, "_")}`);
  packet.examples.forEach(e => ids.push(e.example_id));
  packet.imagery.forEach(i => ids.push(i.item_id));
  return ids;
}
