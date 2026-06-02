# Landright — Relationship Stack Library (Canonical / Single Source of Truth)

**Status:** ✅ LIVE — implemented in the engine. This document is the single
source of truth for the relationship stack library. When stacks or the task→stack
routing change, update this file first, then mirror it in:
- `data/stack_families.json` (the 30 stack definitions)
- `lib/engine/router.ts` → `TASK_STACKS` (the §4 task→candidate map) and `inferTask`
**Scope:** relationships domain only (the product is relationships-only for v0.x).

Each stack is a reusable *layered paragraph architecture* — a stable sequence of
moves, not a script. The engine picks **two strategically distinct stacks** per
message (A/B), drawn from the group that matches the detected **task**.

---

## 1. Task taxonomy (drives routing)

From the Relationship Master Reference v2 (§11 operating decision model). The
engine classifies the message into one task, then selects a varied A/B pair from
that task's candidate stacks.

`request · repair · apology · reassurance · boundary · pause · truth-telling ·
appreciation · future-conversation · express-need/fear · correction · distance-reconnect`

---

## 2. Source legend

| Tag | Report |
|-----|--------|
| BRIEF | Communication Council Master Brief (canonical handover) |
| PLAYBOOK | Elevated Inspiration Playbook (carried via BRIEF) |
| REL | Relationship / Emotionally Sensitive Communication Master Reference v2.0 |
| STORY | Storytelling Master Reference v2.0 |
| LCTS | Leadership / Coaching / Teaching / Speaking Master Reference v2.0 |
| BIZ | Business Communication Master Reference v2.0 |
| CORPUS | Inspiration Corpus — Structured Analysis (stack recipe bank) |
| PACK | Inspiration Corpus — Source Pack (examples / quote seeds) |

---

## 3. The full library (30 stacks)

`★` = new in this proposal · `●` = already in the engine today

### A. Currently in the engine (10)

| # | Stack | Core sequence | Best-fit tasks | Primary effect | Failure mode | Source |
|---|-------|---------------|----------------|----------------|--------------|--------|
| 1 ● | Reflective Wisdom | pattern/truth → elevated meaning → earned recommendation | truth-telling, appreciation | interpretive, wise, memorable | over-sermonising | PLAYBOOK |
| 2 ● | Perspective + Reframe | likely concern → humane validation → reframe → ask | repair, request, distance | disarming, non-reactive | "agreement theatre" | PLAYBOOK · REL |
| 3 ● | Artifact + Insight | object/image → interpretation → practical consequence | appreciation, truth-telling | concrete, sticky | precious / theatrical | PLAYBOOK · CORPUS r6 |
| 4 ● | Question + Centre of Gravity | reflective question → what matters most → recommendation | request, distance | participatory, clarifying | becomes evasive | PLAYBOOK |
| 5 ● | Humane Tension Release | acknowledge pressure → release accusation → systems view → path forward | correction, repair | firm but non-punitive | goes vague | PLAYBOOK |
| 6 ● | Direct-but-Gentle | gentle startup → motive clarity → owned language → clear landing | truth-telling, boundary | honest + hearable | stings if runway too short | REL §6–8 |
| 7 ● | Owned Feeling → Concrete Example → Request | observation → owned feeling → specific request | request, express-need | hearable, actionable | case-file evidence dump | REL App.B · PACK NVC |
| 8 ● | Accountability-First Repair | accountability → impact → apology → repair step | apology, repair | real ownership | self-erasure | REL §9, App.B |
| 9 ● | Visceral Triptych → Plain Landing | three related images → bridge → plain key phrase | appreciation, express-need | sensory, vivid, alive | "pretty fog" | PLAYBOOK |
| 10 ● | Earned | build emotional truth → land phrase → optional echo | future-conversation, express-need | deep, moving | runway runs too long | PLAYBOOK |

### B. New — from the Relationship report (10)

| # | Stack | Core sequence | Best-fit tasks | Primary effect | Failure mode | Source |
|---|-------|---------------|----------------|----------------|--------------|--------|
| 11 ★ | Warmer-with-Runway | soft context → emotional truth → clear point | truth-telling, repair | prepares a hard truth so it lands | padding buries the point | REL App.B (abrupt→runway+truth) |
| 12 ★ | Gentle Startup → Clear Point | soft opening (importance + calm intent) → the point | truth-telling, correction | lowers defensive trajectory | over-padded opening | REL App.B, §8 |
| 13 ★ | Protest → Vulnerable Need | name the reaction → underlying fear → what you need | express-need, repair | turns attack into vulnerability | tips into needy pressure | REL §4, App.B |
| 14 ★ | Demand → Willing Request | observation → specific doable ask → "would you be willing…" | request | cooperative, non-coercive | too soft when a firm limit is needed | REL App.B · PACK NVC |
| 15 ★ | Impact Apology | "I'm sorry" → specific impact → understanding of why it hurt | apology | remorse centred on *them* | self-focused apology drift | REL App.B |
| 16 ★ | Accountability + Reassurance | own it → impact → apology → reassurance of care/continuity | apology, repair | repairs *and* steadies the bond | reassurance dilutes accountability | REL output-pair logic |
| 17 ★ | Clean Boundary | guilt-stripped limit → what you will/won't do → next step | boundary, pause | firm, dignified | can read cold without warmth | REL App.B (guilt→clean) |
| 18 ★ | Boundary with Relational Continuity | boundary → care/continuity → next move | boundary | a limit without abandonment | over-explaining weakens the limit | REL output-pair logic |
| 19 ★ | Plain-Language Reset | strip therapy-speak → plain, owned statement | truth-telling, repair | authentic, un-performative | blunt if over-stripped | REL App.B (over-therapized→plain) |
| 20 ★ | Appreciation Story | specific moment → what it meant → why it mattered | appreciation | concrete, memorable gratitude | inflates a small thing | REL App.B (generic→story) |

### C. New — from the Structured Analysis recipe bank (4)

| # | Stack | Core sequence | Best-fit tasks | Primary effect | Failure mode | Source |
|---|-------|---------------|----------------|----------------|--------------|--------|
| 21 ★ | Felt Understanding → Motive Clarity → Ask | "I can see why this is hard" → "what I want is…" → "could we…" | repair, request | disarms a braced listener | motive line as manipulation cover | CORPUS r1 · PACK "Start with Heart" |
| 22 ★ | Shared Problem → De-personalise → Collaborative Question | name shared issue → split identity from issue → "how do we solve this?" | distance, correction | conflict → joint problem-solving | can feel cold / over-rational | CORPUS r4 |
| 23 ★ | Future-Scene → Contrast → Invitation | vivid shared future → gap with present → "let's…" | future-conversation, reassurance | mobilising, hopeful | drifts into pressure / hype | CORPUS r5 |
| 24 ★ | Negative Acknowledgment → Clarification → Humane Path | "there's no easy way to say this" → clarify reality → dignified next step | truth-telling (hard news) | hard news with dignity | meaning/consolation too soon | CORPUS r7 · PACK (Bixby/Stripe/Airbnb) |

### D. New — cross-domain imports (6)

| # | Stack | Core sequence | Best-fit tasks | Primary effect | Failure mode | Source |
|---|-------|---------------|----------------|----------------|--------------|--------|
| 25 ★ | Coaching-Forward Correction | observation (not verdict) → reflective bridge → name behaviour → consequence → requested change | correction | feedback without attack | too many beats; feels "managed" | LCTS (feedback best-mode) |
| 26 ★ | Reflective Question Ladder | open question → reflection → ownership question | distance, correction | partner self-generates insight | evasive; withholds your position | LCTS (coaching mode) |
| 27 ★ | Continuity → Challenge → Next Step | anchor what you've built/are → name the hard change → next move together | reassurance, future-conversation | steadies during change/conflict | continuity used to dodge the point | LCTS (context→continuity→challenge) |
| 28 ★ | Permission-Gate → Runway → Reveal | ask to say something → brief emotional runway → land the key phrase | express-need, future-conversation | stages tender/sensitive reveals | ceremony weakens impact; don't overuse | STORY (staging operators) · PLAYBOOK |
| 29 ★ | Accusation Audit → Label → Calibrated Ask | pre-name their likely reaction → label the emotion → no-pressure "how do we…" | repair, correction, distance | defuses defensiveness | reads as sarcasm if mistimed | PACK D4 (Voss) |
| 30 ★ | Headline-First → Brief Why | state the point/ask first → one line of context | request, truth-telling | anti-throat-clearing clarity | abrupt for tender topics | BIZ (answer-first / BLUF) |

---

## 4. Task → candidate-stack map (for routing)

The router detects the task, then picks a **distinct A/B pair** from its row;
"Two more options" rotates through the rest of the row.

| Task | Candidate stacks |
|------|------------------|
| request | Owned Feeling→Example→Request · Demand→Willing Request · Question+Centre of Gravity · Headline-First→Brief Why |
| repair | Accountability-First Repair · Accountability+Reassurance · Felt Understanding→Motive Clarity→Ask · Perspective+Reframe · Accusation Audit→Label→Ask |
| apology | Impact Apology · Accountability-First Repair · Accountability+Reassurance · Negative Acknowledgment→Clarification→Humane Path |
| reassurance | Continuity→Challenge→Next Step · Future-Scene→Contrast→Invitation · Perspective+Reframe |
| boundary | Clean Boundary · Boundary with Relational Continuity · Direct-but-Gentle |
| pause | Clean Boundary · Gentle Startup→Clear Point |
| truth-telling | Direct-but-Gentle · Warmer-with-Runway · Plain-Language Reset · Headline-First→Brief Why · Negative Acknowledgment→… |
| appreciation | Appreciation Story · Visceral Triptych→Plain Landing · Artifact+Insight · Reflective Wisdom |
| future-conversation | Future-Scene→Contrast→Invitation · Earned · Permission-Gate→Runway→Reveal · Continuity→Challenge→Next Step |
| express-need/fear | Protest→Vulnerable Need · Owned Feeling→Example→Request · Permission-Gate→Runway→Reveal |
| correction | Coaching-Forward Correction · Humane Tension Release · Gentle Startup→Clear Point · Accusation Audit→Label→Ask |
| distance-reconnect | Shared Problem→De-personalise→Collaborative Question · Reflective Question Ladder · Question+Centre of Gravity |

---

## 5. Supporting assets (not stacks, but referenced by them)

- **Speakability polish** *(LCTS — "write for the ear")*: shorten clauses, add
  pause-friendly punctuation. Apply when the message is meant to be *spoken aloud*
  (tender expressions, apologies). A post-pass flag, not a stack.
- **Acknowledge-impact-before-intent** *(STORY repair rule)*: a hard constraint
  baked into every apology/repair stack.
- **Imagery / quote-seed bank** *(PACK)* for tender + reassurance stacks:
  belonging frame (*Wild Geese*), non-transactional attachment (*Montaigne*),
  heart-and-reason (*Pascal*), timing/seasons (*Ecclesiastes* — legitimises
  "not yet / let's pause" without sounding evasive). Used as seeds, never crutches.

---

## 6. Hard guardrails (REL §10 — unchanged, apply to every stack)

No manipulation · no coercive vulnerability · no guilt engineering · no
pseudo-therapy framing · no fabricated authenticity. The engine may **soften,
sequence, clarify, humanise — but never counterfeit**.

---

## 7. Rollout status — ✅ full 30 shipped

All 30 stacks are live. Implementation:
1. ✅ All 30 stacks in `data/stack_families.json` (sequence + effect + failure + source).
2. ✅ Router rebuilt around the §1 task taxonomy (`inferTask`) with the §4
   task→candidate map (`TASK_STACKS`).
3. ✅ "Two more options" rotation: a `rotation` index walks each task's candidate
   row (pair `[2r, 2r+1] mod n`), surfaced through the API and the UI.

Safety override: any safety-critical message is forced to a clear, direct,
boundaried pair (Direct-but-Gentle + Clean Boundary) regardless of task.

## 8. Sources & evidence (canonical)

The 30 patterns draw on **18 source families**, shown to users as the
"Rooted in …" credibility line. Tiers reflect how strong the evidence is
(per the research reports' own evidence ladder).

### Tier 1 — Strong (relationship science)

| Source | Citation | Patterns |
|---|---|---|
| **The Gottman Method** | Gottman & Levenson (soft startup) | Kind but clear · Own it first · Soft start, clear point |
| **Effective-apology research** | Lewicki et al. (2016), apology components | A real apology |
| **Emotionally Focused Therapy (EFT)** | Johnson; Rathgeber et al. (2019) meta-analysis | Show what's underneath |
| **Gratitude research** | Algoe (gratitude, find-remind-bind); specificity effects | A specific thank you |
| **Perceived Partner Responsiveness** | Laurenceau et al. (1998); Arican-Dinc et al. (2023) | Own it, reassure them |

### Tier 2 — Framework (well-known method)

| Source | Citation | Patterns |
|---|---|---|
| **Coaching practice** | Coaching literature (question-led reflection) | Ask what matters · Point it out kindly · Let them get there |
| **Boundary-setting** | Boundary-communication practice | Hold the line kindly · A limit, with love |
| **Nonviolent Communication** | Rosenberg, NVC (requests vs demands) | Feeling, then ask · Ask, don't demand |
| **Answer-first (Minto Pyramid)** | Minto, The Pyramid Principle (BLUF) | Say it, then why |
| **Crucial Conversations** | Patterson et al., Crucial Conversations (Start with Heart) | Get them, then ask |
| **Getting to Yes** | Fisher & Ury, Getting to Yes | Us vs the problem |
| **Tactical empathy (Chris Voss)** | Voss, Never Split the Difference | Name it before they do |

### Tier 3 — Conceptual / practitioner (use with humility)

| Source | Citation | Patterns |
|---|---|---|
| **Narrative & staged delivery** | Staged delivery (permission & reveal) — practitioner / hypothesis | Use a real example · Paint it, then say it · Build up to it · Ease into it · Ask first, then share |
| **Reframing & perspective-taking** | Non-blaming / systems reframing | Step back and see it · See it their way first · Ease the pressure |
| **Change & continuity framing** | Change-communication (continuity under uncertainty) | We've got this, here's next |
| **Future-self framing** | Vision / future-self framing | Picture us ahead |
| **Humane bad-news delivery** | Procedural-justice bad-news communication | Hard news, said kindly |
| **Plain-language authenticity** | Plain-language & authenticity practice | Just say it plainly |

