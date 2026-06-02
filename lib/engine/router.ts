import type {
  Domain, AgeBand, Goal, TopicType, EmotionalIntensity,
  RiskLevel, LikelyBarrier, LeadEngine, GenerationBrief, RelationshipTask
} from "@/lib/types";

// ─── Keyword heuristics ───────────────────────────────────────────────────────

const HIGH_STAKES_PARENTING_KEYWORDS = [
  "died", "death", "dead", "cancer", "ill", "illness", "sick",
  "divorce", "separating", "splitting up", "hospital", "accident",
  "emergency", "danger", "unsafe", "abuse", "hurt yourself", "hurt myself",
];

const HARMFUL_BEHAVIOR_KEYWORDS = [
  "hit", "hitting", "bite", "biting", "kick", "kicking", "throw",
  "throwing", "scream", "screaming", "shout", "shouting", "hurt",
];

const SAFETY_CRITICAL_KEYWORDS = [
  "suicide", "self-harm", "abuse", "danger", "emergency", "violence",
  "hurt yourself", "kill", "weapon",
];

const APOLOGY_KEYWORDS = [
  "sorry", "apologize", "apology", "forgive", "forgiveness", "i was wrong",
  "my fault", "i messed up", "i let you down",
];

const BOUNDARY_KEYWORDS = [
  "boundary", "limit", "stop", "enough", "not okay", "can't keep",
  "no longer", "won't tolerate", "need to stop",
];

const REPAIR_KEYWORDS = [
  "repair", "fix this", "make it right", "come back from", "recover",
  "reconnect", "bridge", "mend",
];

const EXPRESSION_KEYWORDS = [
  "i love", "love you", "care about", "miss you", "close to you",
  "mean to me", "grateful for", "marry", "proposal", "propose",
];

const CORRECTION_KEYWORDS = [
  "cannot", "can't", "must not", "shouldn't", "stop doing", "don't do",
  "not allowed", "have to stop",
];

const ENCOURAGE_KEYWORDS = [
  "keep trying", "you can do", "don't give up", "believe in you",
  "proud of you", "well done", "good job",
];

const REQUEST_KEYWORDS = [
  "need you to", "would you", "could you", "please", "asking you",
  "i need", "want you to",
];

const EXECUTIVE_KEYWORDS = [
  "decision", "recommend", "priority", "priorities", "stakeholder",
  "board", "strategy", "roadmap", "milestone", "forecast", "revenue",
];

// ─── Relationship task keyword groups ─────────────────────────────────────────

const PAUSE_KEYWORDS = [
  "need a break", "not tonight", "can we pause", "pause this", "stop here",
  "come back to this", "need space", "some space", "time out", "talk later",
  "not right now", "cool off", "step away",
];

const APPRECIATION_KEYWORDS = [
  "thank you", "thanks for", "grateful", "appreciate", "value you",
  "value how", "proud of you", "means a lot", "lucky to have", "love you",
  "in love with you",
];

const FUTURE_KEYWORDS = [
  "our future", "future together", "going forward", "where we're headed",
  "long term", "long-term", "move in", "marry", "propose", "proposal",
  "next chapter", "build a life", "spend my life", "rest of my life",
];

const DISTANCE_KEYWORDS = [
  "drifted", "distant", "growing apart", "feel far", "far apart",
  "disconnected", "miss us", "miss you", "close to you again", "reconnect",
  "lost touch", "feel alone", "strangers",
];

const REASSURANCE_KEYWORDS = [
  "reassure", "we're okay", "we'll be okay", "you matter to me", "i'm here",
  "still love", "don't worry", "nothing's wrong between", "we're good",
];

const EXPRESS_NEED_KEYWORDS = [
  "i need", "i'm scared", "im scared", "afraid", "worried", "anxious",
  "reassurance", "unimportant", "unwanted", "insecure", "i've been feeling",
  "ive been feeling", "makes me feel", "i feel like i",
];

const CORRECTION_RECURRING_KEYWORDS = [
  "you keep", "you always", "you never", "every time", "keeps happening",
  "again and again", "all the time", "constantly",
];

const TRUTH_KEYWORDS = [
  "be honest", "honestly", "tell you something", "need to say", "the truth is",
  "be real", "have to say", "admit", "something i've been", "something ive been",
];

// ─── Router ───────────────────────────────────────────────────────────────────

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function inferGoal(raw: string, domain: Domain, ageBand?: AgeBand): Goal {
  if (matchesAny(raw, APOLOGY_KEYWORDS)) return "repair";
  if (matchesAny(raw, EXPRESSION_KEYWORDS)) return "express";
  if (matchesAny(raw, BOUNDARY_KEYWORDS)) return "boundary";
  if (matchesAny(raw, REPAIR_KEYWORDS)) return "repair";
  if (matchesAny(raw, ENCOURAGE_KEYWORDS)) return "encourage";
  if (matchesAny(raw, CORRECTION_KEYWORDS)) return "correct";
  if (matchesAny(raw, REQUEST_KEYWORDS)) return "request";
  if (domain === "parenting" && matchesAny(raw, HARMFUL_BEHAVIOR_KEYWORDS)) return "correct";
  if (domain === "business" && matchesAny(raw, EXECUTIVE_KEYWORDS)) return "align";
  if (domain === "leadership") return "motivate";
  return "other";
}

function inferTopicType(raw: string, domain: Domain, ageBand?: AgeBand): TopicType {
  if (matchesAny(raw, SAFETY_CRITICAL_KEYWORDS)) return "high_stakes_truth";
  if (domain === "parenting" && matchesAny(raw, HIGH_STAKES_PARENTING_KEYWORDS)) return "high_stakes_truth";
  if (domain === "parenting" && matchesAny(raw, HARMFUL_BEHAVIOR_KEYWORDS)) return "harmful_behavior";
  if (matchesAny(raw, APOLOGY_KEYWORDS)) return "apology";
  if (matchesAny(raw, BOUNDARY_KEYWORDS)) return "boundary";
  if (matchesAny(raw, EXPRESSION_KEYWORDS)) return "tender_expression";
  if (matchesAny(raw, REPAIR_KEYWORDS)) return "apology";
  if (matchesAny(raw, CORRECTION_KEYWORDS)) return "correction";
  if (matchesAny(raw, REQUEST_KEYWORDS)) return "request";
  if (domain === "business" && matchesAny(raw, EXECUTIVE_KEYWORDS)) return "proposal";
  return "other";
}

function inferEmotionalIntensity(raw: string, topicType: TopicType): EmotionalIntensity {
  if (
    topicType === "high_stakes_truth" ||
    topicType === "harmful_behavior" ||
    topicType === "tender_expression"
  ) return "high";

  if (
    topicType === "apology" ||
    topicType === "boundary" ||
    topicType === "correction"
  ) return "medium";

  const exclamations = (raw.match(/!/g) || []).length;
  const caps = (raw.match(/[A-Z]{2,}/g) || []).length;
  if (exclamations + caps > 2) return "high";
  if (exclamations + caps > 0) return "medium";

  return "low";
}

function inferRiskLevel(
  topicType: TopicType,
  domain: Domain,
  raw: string
): RiskLevel {
  if (matchesAny(raw, SAFETY_CRITICAL_KEYWORDS)) return "safety_critical";
  if (topicType === "high_stakes_truth") return "high";
  if (topicType === "harmful_behavior") return "high";
  if (domain === "relationships" && topicType === "tender_expression") return "moderate";
  if (topicType === "apology") return "moderate";
  if (topicType === "boundary") return "moderate";
  return "low";
}

function inferBarrier(
  raw: string,
  topicType: TopicType,
  domain: Domain
): LikelyBarrier {
  if (topicType === "harmful_behavior") return "dysregulation";
  if (topicType === "apology") return "hurt";
  if (topicType === "boundary") return "resistance";
  if (topicType === "correction") return "shame";
  if (topicType === "tender_expression") return "low_trust";
  if (domain === "business") return "defensiveness";
  if (domain === "relationships") return "defensiveness";
  if (domain === "parenting") return "autonomy_pushback";
  return "other";
}

function inferLeadEngine(
  topicType: TopicType,
  riskLevel: RiskLevel,
  domain: Domain,
  ageBand?: AgeBand
): LeadEngine {
  if (riskLevel === "safety_critical") return "direct_first";
  if (topicType === "high_stakes_truth") return "direct_first";
  if (topicType === "harmful_behavior") return "direct_first";
  if (domain === "business" && topicType === "proposal") return "structure_led";
  if (domain === "leadership") return "hybrid";
  if (domain === "parenting" && ageBand === "young_child") return "hybrid";
  if (domain === "parenting" && ageBand === "teen") return "hybrid";
  if (topicType === "tender_expression") return "story_led";
  return "hybrid";
}

function selectStacks(
  domain: Domain,
  topicType: TopicType,
  goal: Goal,
  leadEngine: LeadEngine,
  ageBand?: AgeBand
): { stackA: string; stackB: string } {
  // Parenting stacks
  if (domain === "parenting") {
    if (topicType === "high_stakes_truth") {
      return {
        stackA: "Direct Fact → Comfort → Questions",
        stackB: "Direct Fact → Comfort → Questions",
      };
    }
    if (topicType === "harmful_behavior") {
      return {
        stackA: "Feeling Mirror → Boundary → Replacement Move",
        stackB: "Accountability → dignity → repair step",
      };
    }
    if (ageBand === "teen") {
      return {
        stackA: "Perspective → Collaborative Frame → Consequence → Ownership Question",
        stackB: "Question + Centre of Gravity",
      };
    }
    if (topicType === "apology") {
      return {
        stackA: "Accountability-First Repair",
        stackB: "Perspective + Reframe",
      };
    }
    return {
      stackA: "Recognition → Tiny Question → Guidance → Action",
      stackB: "Feeling Mirror → Boundary → Replacement Move",
    };
  }

  // Relationship stacks
  if (domain === "relationships") {
    if (topicType === "tender_expression" || goal === "express") {
      return {
        stackA: "Visceral Triptych → Plain Landing",
        stackB: "Earned",
      };
    }
    if (topicType === "apology" || goal === "repair") {
      return {
        stackA: "Accountability-First Repair",
        stackB: "Perspective + Reframe",
      };
    }
    if (topicType === "boundary") {
      return {
        stackA: "Direct-but-Gentle",
        stackB: "Owned Feeling → Concrete Example → Request",
      };
    }
    if (topicType === "request") {
      return {
        stackA: "Owned Feeling → Concrete Example → Request",
        stackB: "Question + Centre of Gravity",
      };
    }
    return {
      stackA: "Perspective + Reframe",
      stackB: "Direct-but-Gentle",
    };
  }

  // Business stacks
  if (domain === "business") {
    if (topicType === "proposal" || leadEngine === "structure_led") {
      return {
        stackA: "Answer-First + Narrative Support",
        stackB: "Question + Centre of Gravity",
      };
    }
    if (topicType === "feedback") {
      return {
        stackA: "Reflective Wisdom",
        stackB: "Humane Tension Release",
      };
    }
    return {
      stackA: "Reflective Wisdom",
      stackB: "Perspective + Reframe",
    };
  }

  // Leadership stacks
  if (domain === "leadership") {
    if (goal === "motivate" || goal === "encourage") {
      return {
        stackA: "Reflective Wisdom",
        stackB: "Future Echo",
      };
    }
    if (goal === "align") {
      return {
        stackA: "Question + Centre of Gravity",
        stackB: "Shared Continuity → Change → Next Step",
      };
    }
    return {
      stackA: "Question + Centre of Gravity",
      stackB: "Reflective Wisdom",
    };
  }

  return { stackA: "Reflective Wisdom", stackB: "Perspective + Reframe" };
}

function buildForbiddenMoves(
  domain: Domain,
  topicType: TopicType,
  riskLevel: RiskLevel,
  ageBand?: AgeBand
): string[] {
  const moves: string[] = [];

  // Universal forbidden
  moves.push("pressure hidden inside warmth");
  moves.push("fabricated authenticity");
  moves.push("false promises");
  moves.push("pseudo-therapy");
  moves.push("ornamental inflation");

  if (riskLevel === "safety_critical" || topicType === "high_stakes_truth") {
    moves.push("story or metaphor before direct fact");
    moves.push("delayed clarity");
  }

  if (topicType === "harmful_behavior") {
    moves.push("delayed boundary");
    moves.push("vague softening on the limit");
    moves.push("ornate metaphor before the rule");
  }

  if (topicType === "apology") {
    moves.push("self-exonerating explanation before ownership");
    moves.push("slow throat-clearing");
  }

  if (domain === "business") {
    moves.push("slow throat-clearing before main point");
    moves.push("decorative story detached from business job");
  }

  if (domain === "parenting" && ageBand === "teen") {
    moves.push("didactic or moralizing tone");
    moves.push("patronising story");
  }

  if (domain === "parenting") {
    moves.push("adult abstraction or jargon");
    moves.push("piled or mixed metaphors");
    moves.push("long explanation before the point");
  }

  return [...new Set(moves)];
}

function buildDirectnessRule(
  topicType: TopicType,
  riskLevel: RiskLevel,
  leadEngine: LeadEngine,
  domain: Domain
): string {
  if (riskLevel === "safety_critical") return "Direct fact required immediately. No runway.";
  if (topicType === "high_stakes_truth") return "Direct fact first, then comfort and questions.";
  if (topicType === "harmful_behavior") return "Firm boundary must land clearly. Warm entry permitted but limited.";
  if (topicType === "apology") return "Ownership and impact must arrive early. Explanation may follow briefly.";
  if (domain === "business" && leadEngine === "structure_led") return "Answer first always. Narrative support follows.";
  if (leadEngine === "direct_first") return "Direct point first. Context and texture after.";
  if (leadEngine === "story_led") return "Runway permitted but must build to a clear landing.";
  return "Balanced runway permitted. Point must land clearly by the end.";
}

function inferTargetLength(
  domain: Domain,
  ageBand?: AgeBand
): "short" | "medium" | "long" {
  if (domain === "parenting" && ageBand === "young_child") return "short";
  if (domain === "business") return "medium";
  return "medium";
}

// ─── Relationship task taxonomy → stack groups ────────────────────────────────

function inferTask(raw: string): RelationshipTask {
  if (matchesAny(raw, APOLOGY_KEYWORDS)) return "apology";
  if (matchesAny(raw, PAUSE_KEYWORDS)) return "pause";
  if (matchesAny(raw, BOUNDARY_KEYWORDS)) return "boundary";
  if (matchesAny(raw, CORRECTION_RECURRING_KEYWORDS)) return "correction";
  if (matchesAny(raw, FUTURE_KEYWORDS)) return "future_conversation";
  if (matchesAny(raw, APPRECIATION_KEYWORDS)) return "appreciation";
  if (matchesAny(raw, DISTANCE_KEYWORDS)) return "distance_reconnect";
  if (matchesAny(raw, REASSURANCE_KEYWORDS)) return "reassurance";
  if (matchesAny(raw, EXPRESS_NEED_KEYWORDS)) return "express_need";
  if (matchesAny(raw, REQUEST_KEYWORDS)) return "request";
  if (matchesAny(raw, REPAIR_KEYWORDS)) return "repair";
  if (matchesAny(raw, TRUTH_KEYWORDS)) return "truth_telling";
  return "truth_telling";
}

// Candidate stacks per task (docs/relationship_stack_library.md §4 — single
// source of truth). The engine picks a distinct A/B pair from the matching row;
// rotation walks the rest of the row on "Two more options".
const TASK_STACKS: Record<RelationshipTask, string[]> = {
  request: [
    "Owned Feeling → Concrete Example → Request",
    "Demand → Willing Request",
    "Question + Centre of Gravity",
    "Headline-First → Brief Why",
  ],
  repair: [
    "Accountability-First Repair",
    "Accountability + Reassurance",
    "Felt Understanding → Motive Clarity → Ask",
    "Perspective + Reframe",
    "Accusation Audit → Label → Calibrated Ask",
  ],
  apology: [
    "Impact Apology",
    "Accountability-First Repair",
    "Accountability + Reassurance",
    "Negative Acknowledgment → Clarification → Humane Path",
  ],
  reassurance: [
    "Continuity → Challenge → Next Step",
    "Future-Scene → Contrast → Invitation",
    "Perspective + Reframe",
  ],
  boundary: [
    "Clean Boundary",
    "Boundary with Relational Continuity",
    "Direct-but-Gentle",
  ],
  pause: [
    "Clean Boundary",
    "Gentle Startup → Clear Point",
  ],
  truth_telling: [
    "Direct-but-Gentle",
    "Warmer-with-Runway",
    "Plain-Language Reset",
    "Headline-First → Brief Why",
    "Negative Acknowledgment → Clarification → Humane Path",
  ],
  appreciation: [
    "Appreciation Story",
    "Visceral Triptych → Plain Landing",
    "Artifact + Insight",
    "Reflective Wisdom",
  ],
  future_conversation: [
    "Future-Scene → Contrast → Invitation",
    "Earned",
    "Permission-Gate → Runway → Reveal",
    "Continuity → Challenge → Next Step",
  ],
  express_need: [
    "Protest → Vulnerable Need",
    "Owned Feeling → Concrete Example → Request",
    "Permission-Gate → Runway → Reveal",
  ],
  correction: [
    "Coaching-Forward Correction",
    "Humane Tension Release",
    "Gentle Startup → Clear Point",
    "Accusation Audit → Label → Calibrated Ask",
  ],
  distance_reconnect: [
    "Shared Problem → De-personalise → Collaborative Question",
    "Reflective Question Ladder",
    "Question + Centre of Gravity",
  ],
};

function selectStacksByTask(
  task: RelationshipTask,
  rotation: number
): { stackA: string; stackB: string } {
  const list = TASK_STACKS[task] ?? TASK_STACKS.truth_telling;
  const n = list.length;
  const r = Math.max(0, Math.floor(rotation || 0));
  const a = list[(2 * r) % n];
  let b = list[(2 * r + 1) % n];
  if (b === a) b = list[(2 * r + 2) % n] ?? list[(r + 1) % n];
  return { stackA: a, stackB: b };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function buildGenerationBrief(
  rawInput: string,
  domain: Domain,
  ageBand?: AgeBand,
  rotation: number = 0
): Omit<GenerationBrief, "source_packet_ids"> {
  const goal = inferGoal(rawInput, domain, ageBand);
  const topicType = inferTopicType(rawInput, domain, ageBand);
  const emotionalIntensity = inferEmotionalIntensity(rawInput, topicType);
  const riskLevel = inferRiskLevel(topicType, domain, rawInput);
  const likelyBarrier = inferBarrier(rawInput, topicType, domain);
  const leadEngine = inferLeadEngine(topicType, riskLevel, domain, ageBand);
  const task = inferTask(rawInput);

  // Relationships (the live domain) route by task taxonomy + rotation; other
  // domains fall back to the legacy topic-based selection.
  let { stackA, stackB } =
    domain === "relationships"
      ? selectStacksByTask(task, rotation)
      : selectStacks(domain, topicType, goal, leadEngine, ageBand);

  // Safety override: if the message is safety-critical, force a clear, direct,
  // boundaried pair regardless of task.
  if (riskLevel === "safety_critical") {
    stackA = "Direct-but-Gentle";
    stackB = "Clean Boundary";
  }

  const forbiddenMoves = buildForbiddenMoves(domain, topicType, riskLevel, ageBand);
  const directnessRule = buildDirectnessRule(topicType, riskLevel, leadEngine, domain);
  const targetLength = inferTargetLength(domain, ageBand);

  return {
    raw_input: rawInput,
    domain,
    age_band: ageBand,
    task,
    inferred_goal: goal,
    topic_type: topicType,
    emotional_intensity: emotionalIntensity,
    risk_level: riskLevel,
    likely_barrier: likelyBarrier,
    lead_engine: leadEngine,
    stack_a: stackA,
    stack_b: stackB,
    forbidden_moves: forbiddenMoves,
    directness_rule: directnessRule,
    target_length: targetLength,
  };
}
