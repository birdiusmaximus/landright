// ─── Domain & Age Band ────────────────────────────────────────────────────────

export type Domain =
  | "business"
  | "relationships"
  | "parenting"
  | "leadership";

export type AgeBand =
  | "young_child"
  | "older_child_preteen"
  | "teen";

// Light "who's this for" context — flavors generation, does not hard-route.
export type Audience =
  | "partner"
  | "friend"
  | "family"
  | "other";

// Per-audience guidance injected into the generation prompt. Each block tunes
// tone, directness, and the specific guardrails for that relationship.
export const AUDIENCE_GUIDANCE: Record<Audience, { label: string; instruction: string }> = {
  partner: {
    label: "a romantic partner",
    instruction:
      "This is an intimate, ongoing relationship. Lead with warmth and emotional honesty, and let some vulnerability show. Use shared, connected language (\"us\", \"we\") and own your own feelings rather than diagnosing theirs. You can be direct, but frame it as caring for the relationship, not as a complaint. Strictly avoid pressure dressed up as affection, score-keeping, ultimatums, and \"you always / you never\" framing.",
  },
  friend: {
    label: "a close friend",
    instruction:
      "This is a chosen relationship between equals. Keep it natural, warm, and candid — closer to how people actually talk than to a formal letter. Friends value honesty, so get to the point with less runway and trust them to handle it. Avoid stiff formality, therapy-speak, condescension, or making the moment heavier or more dramatic than it needs to be.",
  },
  family: {
    label: "a family member",
    instruction:
      "This is a long-standing relationship that often carries history and obligation. Be respectful, patient, and clear without slipping into old roles or rehashing past grievances. When setting a limit, pair it with care and continuity so it does not read as rejection. Strictly avoid guilt or obligation as leverage, moralizing, and reopening old wounds; keep it focused on the present.",
  },
  other: {
    label: "someone close to them",
    instruction:
      "Keep the tone warm, plain, and respectful. Lead with care, own your own feelings, and let the point land clearly without pressure.",
  },
};

// ─── Decision Engine Fields ───────────────────────────────────────────────────

export type Goal =
  | "motivate" | "align" | "persuade" | "reassure" | "challenge"
  | "request" | "explain" | "repair" | "boundary" | "correct"
  | "express" | "encourage" | "disclose" | "other";

export type TopicType =
  | "routine" | "correction" | "apology" | "difficult_truth" | "proposal"
  | "feedback" | "change_message" | "request" | "expression" | "boundary"
  | "harmful_behavior" | "high_stakes_truth" | "tender_expression"
  | "sensitive_question" | "other";

export type EmotionalIntensity = "low" | "medium" | "high";
export type RiskLevel = "low" | "moderate" | "high" | "safety_critical";

export type LikelyBarrier =
  | "defensiveness" | "shame" | "overwhelm" | "confusion" | "resistance"
  | "autonomy_pushback" | "low_memorability" | "hurt" | "dysregulation"
  | "low_trust" | "other";

export type LeadEngine =
  | "structure_led" | "hybrid" | "story_led" | "direct_first" | "speechcraft";

// Relationship task taxonomy (Relationship Master Reference v2 §11). Drives
// which group of stacks the engine draws its two options from.
export type RelationshipTask =
  | "request"
  | "repair"
  | "apology"
  | "reassurance"
  | "boundary"
  | "pause"
  | "truth_telling"
  | "appreciation"
  | "future_conversation"
  | "express_need"
  | "correction"
  | "distance_reconnect";

// ─── Knowledge Base Types ─────────────────────────────────────────────────────

export interface DomainPlaybook {
  domain: Domain;
  subtype: string;
  core_principles: string[];
  when_story_helps: string[];
  when_directness_leads: string[];
  guardrails: string[];
  age_band_rules?: Record<string, string[]>;
  source_doc: string;
}

export interface Operator {
  operator_name: string;
  domain_fit: Domain[];
  lead_engine: LeadEngine;
  progression_skeleton: string;
  primary_effect: string;
  best_use_cases: string[];
  avoid_when: string[];
  misuse_risk: string;
  evidence_status: string;
  pairs_well_with: string[];
  source_doc: string;
}

export interface StackFamily {
  stack_name: string;
  friendly_label?: string; // plain-English name shown to users
  origin?: string; // canonical source / method (credibility layer)
  citation?: string; // backing reference for the origin
  rationale?: string; // 2-line "why this works" shown to users
  allowed_domains: Domain[];
  core_sequence: string;
  primary_effect: string;
  failure_mode: string;
  overlays?: string[];
  source_doc: string;
}

export interface Example {
  example_id: string;
  domain: Domain;
  raw_input: string;
  inferred_goal: Goal;
  stack_used: string;
  paragraph: string;
  why_it_works: string;
  risk_notes: string;
  preferred_flag: boolean;
  source_doc: string;
}

export interface ImageryQuestion {
  item_id: string;
  type: "imagery" | "question" | "line_pattern";
  family_name: string;
  best_jobs: string[];
  misuse_risk: string;
  domains: Domain[];
  content: string;
  source_doc: string;
}

export interface SafetyRule {
  rule_id: string;
  domain: Domain | "all";
  trigger_type: string;
  blocked_move: string;
  required_move: string;
  severity: "advisory" | "required" | "hard_block";
  rationale: string;
}

export interface Benchmark {
  benchmark_id: string;
  domain: Domain;
  topic_type: TopicType;
  input: string;
  stack_a: string;
  stack_b: string;
  output_a?: string;
  output_b?: string;
  preferred_option?: "a" | "b";
  reason_preferred?: string;
}

export interface SourceSnippet {
  snippet_id: string;
  source_doc: string;
  domain: Domain | "all";
  tags: string[];
  excerpt: string;
  usage_note: string;
  quote_policy: "use_as_seed" | "reference_only" | "direct_use_ok";
}

// ─── Generation Brief ─────────────────────────────────────────────────────────

export interface GenerationBrief {
  raw_input: string;
  domain: Domain;
  age_band?: AgeBand;
  audience?: string; // audience code, e.g. "partner" (see AUDIENCE_GUIDANCE)
  task?: RelationshipTask; // classified relationship task driving stack selection
  inferred_goal: Goal;
  topic_type: TopicType;
  emotional_intensity: EmotionalIntensity;
  risk_level: RiskLevel;
  likely_barrier: LikelyBarrier;
  lead_engine: LeadEngine;
  stack_a: string;
  stack_b: string;
  forbidden_moves: string[];
  directness_rule: string;
  target_length: "short" | "medium" | "long";
  source_packet_ids: string[];
}

// ─── Source Packet (retrieval output) ────────────────────────────────────────

export interface SourcePacket {
  domain_playbook: DomainPlaybook | null;
  safety_rules: SafetyRule[];
  stack_a_def: StackFamily | null;
  stack_b_def: StackFamily | null;
  examples: Example[];
  imagery: ImageryQuestion[];
  directness_override: string | null;
}

// ─── Generation Output ────────────────────────────────────────────────────────

// One clause/sentence of an option, with a note on what it is doing.
export interface Segment {
  text: string;
  note: string;
}

export interface GenerationOutput {
  inferred_goal: string;
  likely_barrier: string;
  stack_a_label: string;
  stack_b_label: string;
  breakdown_a: Segment[];
  breakdown_b: Segment[];
  option_a: string; // derived server-side: breakdown_a joined
  option_b: string; // derived server-side: breakdown_b joined
  // credibility + rationale for each option (from the stack definition)
  stack_a_origin?: string;
  stack_b_origin?: string;
  stack_a_rationale?: string;
  stack_b_rationale?: string;
  safety_flags: string[];
  confidence: number;
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface GenerateRequest {
  raw_input: string;
  domain?: Domain;
  age_band?: AgeBand;
  audience?: Audience;
  rotation?: number; // increments on "Two more options" to rotate the stack pair
}

export interface GenerateResponse {
  success: boolean;
  result?: GenerationOutput;
  brief?: Partial<GenerationBrief>;
  error?: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  event_id: string;
  timestamp: string;
  raw_input: string;
  domain: Domain;
  age_band?: AgeBand;
  inferred_goal: string;
  likely_barrier: string;
  stack_a: string;
  stack_b: string;
  source_packet_ids: string[];
  output_a: string;
  output_b: string;
  user_choice?: "a" | "b" | null;
  regenerate_count: number;
}
