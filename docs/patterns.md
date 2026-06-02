# Landright — Communication Patterns

The full library of communication **patterns** ("stacks") Landright draws from. Each is a
research-grounded sequence of moves for saying something hard, tender, or awkward so the other
person can actually hear it. The program picks the patterns; the model writes the words.

**30 patterns**, each rooted in an established communication or relationship-science principle.

> Single source of truth: `data/stack_families.json` (routing in `lib/engine/router.ts`).

---

## At a glance

| # | Pattern | Shown to users as | Rooted in | What it does |
|---|---------|-------------------|-----------|--------------|
| 1 | Boundary with Relational Continuity | A limit, with love | Boundary-setting | Sets a limit without signalling abandonment — the relationship survives the no |
| 2 | Impact Apology | A real apology | Effective-apology research | Remorse centred on the other person, not on the speaker's guilt |
| 3 | Appreciation Story | A specific thank you | Gratitude research | Concrete, memorable gratitude — specificity makes thanks land instead of sounding generic |
| 4 | Permission-Gate → Runway → Reveal | Ask first, then share | Narrative & staged delivery | Stages a tender or sensitive reveal so the other person is ready to receive it |
| 5 | Question + Centre of Gravity | Ask what matters | Coaching practice | Participatory, clarifying, humane — draws the audience into the thinking before landing a point |
| 6 | Demand → Willing Request | Ask, don't demand | Nonviolent Communication | Cooperative and non-coercive — a request that leaves the other person free to say yes |
| 7 | Earned | Build up to it | Narrative & staged delivery | Deep, moving, reflective — phrase arrives after the audience has been prepared |
| 8 | Warmer-with-Runway | Ease into it | Narrative & staged delivery | Prepares a hard truth so it can be heard — runway lowers abruptness before the point lands |
| 9 | Humane Tension Release | Ease the pressure | Reframing & perspective-taking | Firm but non-punitive — names a hard situation without blame, then moves forward |
| 10 | Owned Feeling → Concrete Example → Request | Feeling, then ask | Nonviolent Communication | Turns vague frustration or accusation into something hearable and actionable |
| 11 | Felt Understanding → Motive Clarity → Ask | Get them, then ask | Crucial Conversations | Disarms a braced listener — validation and visible motive restore safety before the ask |
| 12 | Negative Acknowledgment → Clarification → Humane Path | Hard news, said kindly | Humane bad-news delivery | Delivers hard news with dignity — names the difficulty honestly, then offers a path |
| 13 | Clean Boundary | Hold the line kindly | Boundary-setting | Firm and dignified — the limit lands without self-blame or apology weakening it |
| 14 | Plain-Language Reset | Just say it plainly | Plain-language authenticity | Authentic and un-performative — replaces borrowed clinical diction with real words |
| 15 | Direct-but-Gentle | Kind but clear | The Gottman Method | Honest without triggering defensiveness — the point lands fully but softly |
| 16 | Reflective Question Ladder | Let them get there | Coaching practice | Lets the other person self-generate the insight rather than being told |
| 17 | Accusation Audit → Label → Calibrated Ask | Name it before they do | Tactical empathy (Chris Voss) | Defuses defensiveness by naming the negative first and inviting collaboration |
| 18 | Accountability-First Repair | Own it first | The Gottman Method | Apology feels real and non-self-protective — leads with the effect not the excuse |
| 19 | Accountability + Reassurance | Own it, reassure them | Perceived Partner Responsiveness | Repairs the rupture and steadies the bond at the same time |
| 20 | Visceral Triptych → Plain Landing | Paint it, then say it | Narrative & staged delivery | Sensory, vivid, emotionally alive — for love, longing, proposal, or devotion |
| 21 | Future-Scene → Contrast → Invitation | Picture us ahead | Future-self framing | Mobilising and hopeful — makes a desired direction feel real and reachable together |
| 22 | Coaching-Forward Correction | Point it out kindly | Coaching practice | Feedback on a recurring behaviour without it landing as an attack |
| 23 | Headline-First → Brief Why | Say it, then why | Answer-first (Minto Pyramid) | Anti-throat-clearing clarity — says the thing plainly for an anxious over-explainer |
| 24 | Perspective + Reframe | See it their way first | Reframing & perspective-taking | Disarming, accurate, non-reactive — reduces defensiveness before making the point |
| 25 | Protest → Vulnerable Need | Show what's underneath | Emotionally Focused Therapy (EFT) | Converts attack-shaped language into owned vulnerability the other person can meet |
| 26 | Gentle Startup → Clear Point | Soft start, clear point | The Gottman Method | Lowers the defensive trajectory of a hard conversation — the opening sets the tone |
| 27 | Reflective Wisdom | Step back and see it | Reframing & perspective-taking | Interpretive, wise, memorable — gives the audience a new frame for something familiar |
| 28 | Shared Problem → De-personalise → Collaborative Question | Us vs the problem | Getting to Yes | Turns conflict into joint problem-solving — it's us vs the problem, not us vs each other |
| 29 | Artifact + Insight | Use a real example | Narrative & staged delivery | Concrete, imagistic, sticky — makes the point land through something physical or visual |
| 30 | Continuity → Challenge → Next Step | We've got this, here's next | Change & continuity framing | Steadies the relationship during change or conflict by leading with continuity |

---

## The patterns in detail

### Rooted in Answer-first (Minto Pyramid)
*Minto, The Pyramid Principle (BLUF)*

#### Headline-First → Brief Why
- **Shown as:** Say it, then why
- **Sequence:** State the point or ask first → one line of context
- **Primary effect:** Anti-throat-clearing clarity — says the thing plainly for an anxious over-explainer
- **Why it works:** Says the actual point first, then a line of why — so an anxious over-explainer gets heard instead of lost in preamble.
- **Failure mode to avoid:** Can feel abrupt for tender or high-emotion topics

### Rooted in Boundary-setting
*Boundary-communication practice*

#### Boundary with Relational Continuity
- **Shown as:** A limit, with love
- **Sequence:** Boundary → care and continuity → next move
- **Primary effect:** Sets a limit without signalling abandonment — the relationship survives the no
- **Why it works:** Holds the limit while signalling care, so a 'no' doesn't feel like rejection or abandonment.
- **Failure mode to avoid:** Over-explaining the care weakens the limit

#### Clean Boundary
- **Shown as:** Hold the line kindly
- **Sequence:** Guilt-stripped limit → what you will/won’t do → next step
- **Primary effect:** Firm and dignified — the limit lands without self-blame or apology weakening it
- **Why it works:** States the limit without guilt or over-explaining, so it stays firm and clear instead of getting talked out of.
- **Failure mode to avoid:** Can read cold if no warmth is present at all

### Rooted in Change & continuity framing
*Change-communication (continuity under uncertainty)*

#### Continuity → Challenge → Next Step
- **Shown as:** We've got this, here's next
- **Sequence:** Anchor what you’ve built / are → name the hard change → next move together
- **Primary effect:** Steadies the relationship during change or conflict by leading with continuity
- **Why it works:** Anchors what you've built before naming the hard change, so it steadies you both through a rough patch.
- **Failure mode to avoid:** Continuity is used to dodge or soften the hard point

### Rooted in Coaching practice
*Coaching literature; question-led reflection (CIPD)*

#### Question + Centre of Gravity
- **Shown as:** Ask what matters
- **Sequence:** Reflective question → what matters most → recommendation
- **Primary effect:** Participatory, clarifying, humane — draws the audience into the thinking before landing a point
- **Why it works:** Draws them into the thinking with a question, so the conclusion feels shared rather than imposed on them.
- **Failure mode to avoid:** Can become evasive if the recommendation never clearly arrives

#### Reflective Question Ladder
- **Shown as:** Let them get there
- **Sequence:** Open question → reflection → ownership question
- **Primary effect:** Lets the other person self-generate the insight rather than being told
- **Why it works:** Asks rather than tells, so they arrive at the insight themselves — which sticks far better than being lectured.
- **Failure mode to avoid:** Becomes evasive if the speaker withholds their own position entirely

#### Coaching-Forward Correction
- **Shown as:** Point it out kindly
- **Sequence:** Observation (not a verdict) → reflective bridge → name the behaviour → its consequence → requested change
- **Primary effect:** Feedback on a recurring behaviour without it landing as an attack
- **Why it works:** Leads with an observation, not a verdict, so feedback about a habit lands as help rather than an attack.
- **Failure mode to avoid:** Too many beats; can feel managed or clinical

### Rooted in Crucial Conversations
*Patterson et al., Crucial Conversations (Start with Heart)*

#### Felt Understanding → Motive Clarity → Ask
- **Shown as:** Get them, then ask
- **Sequence:** “I can see why this is hard” → “what I want here is…” → “could we…”
- **Primary effect:** Disarms a braced listener — validation and visible motive restore safety before the ask
- **Why it works:** Shows you get why it's hard and makes your good intent visible, so a braced listener relaxes enough to hear the ask.
- **Failure mode to avoid:** The motive line becomes a cover for control if it doesn't match behaviour

### Rooted in Effective-apology research
*Lewicki et al. (2016), apology components*

#### Impact Apology
- **Shown as:** A real apology
- **Sequence:** “I’m sorry” → specific impact named → understanding of why it hurt
- **Primary effect:** Remorse centred on the other person, not on the speaker's guilt
- **Why it works:** Centres the apology on how it affected them, not on your guilt — so it reads as real remorse and they feel understood.
- **Failure mode to avoid:** Self-focused apology drift (“I feel awful, I hate myself”) that makes them comfort you

### Rooted in Emotionally Focused Therapy (EFT)
*Johnson; Rathgeber et al. (2019) meta-analysis*

#### Protest → Vulnerable Need
- **Shown as:** Show what's underneath
- **Sequence:** Name the reaction → underlying fear → what you are needing
- **Primary effect:** Converts attack-shaped language into owned vulnerability the other person can meet
- **Why it works:** Trades attack-language for the fear underneath, so they meet your need instead of defending against a criticism.
- **Failure mode to avoid:** Tips into needy pressure if the need becomes a demand for reassurance

### Rooted in Future-self framing
*Vision / future-self framing*

#### Future-Scene → Contrast → Invitation
- **Shown as:** Picture us ahead
- **Sequence:** Vivid shared future → gap with the present → “let’s…”
- **Primary effect:** Mobilising and hopeful — makes a desired direction feel real and reachable together
- **Why it works:** Paints a hopeful shared future and invites them toward it, so a hard conversation points somewhere good.
- **Failure mode to avoid:** Drifts into pressure or hype if the future scene is idealised

### Rooted in Getting to Yes
*Fisher & Ury, Getting to Yes*

#### Shared Problem → De-personalise → Collaborative Question
- **Shown as:** Us vs the problem
- **Sequence:** Name the shared issue → separate identity from the issue → “how do we solve this?”
- **Primary effect:** Turns conflict into joint problem-solving — it's us vs the problem, not us vs each other
- **Why it works:** Frames it as the two of you versus the problem, so it becomes joint problem-solving instead of an accusation.
- **Failure mode to avoid:** Can feel cold or over-rational if the emotional reality is skipped

### Rooted in Gratitude research
*Algoe (gratitude, find-remind-bind); specificity effects*

#### Appreciation Story
- **Shown as:** A specific thank you
- **Sequence:** Specific moment → what it meant → why it mattered
- **Primary effect:** Concrete, memorable gratitude — specificity makes thanks land instead of sounding generic
- **Why it works:** Ties thanks to a specific moment, so gratitude feels real and memorable instead of generic and forgettable.
- **Failure mode to avoid:** Inflates a small thing into something it wasn't

### Rooted in Humane bad-news delivery
*Procedural-justice bad-news communication*

#### Negative Acknowledgment → Clarification → Humane Path
- **Shown as:** Hard news, said kindly
- **Sequence:** “There’s no easy way to say this” → clarify the reality → dignified next step
- **Primary effect:** Delivers hard news with dignity — names the difficulty honestly, then offers a path
- **Why it works:** Admits there's no easy way to say it, then offers a dignified next step — so hard news lands with care, not coldness.
- **Failure mode to avoid:** Reaches for meaning or consolation too soon and instrumentalises the pain

### Rooted in Narrative & staged delivery
*Staged delivery (permission & reveal) — practitioner / hypothesis*

#### Permission-Gate → Runway → Reveal
- **Shown as:** Ask first, then share
- **Sequence:** Ask to say something → brief emotional runway → land the key phrase
- **Primary effect:** Stages a tender or sensitive reveal so the other person is ready to receive it
- **Why it works:** Asks before sharing something tender, so they're ready to receive it — which makes a sensitive reveal feel safe.
- **Failure mode to avoid:** Ceremony weakens impact; overuse makes ordinary messages feel theatrical

#### Earned
- **Shown as:** Build up to it
- **Sequence:** Build emotional truth → land phrase → optional echo
- **Primary effect:** Deep, moving, reflective — phrase arrives after the audience has been prepared
- **Why it works:** Builds the emotional ground first, so the key line arrives feeling earned and moving rather than dropped cold.
- **Failure mode to avoid:** Runway becomes too long and the landing loses impact

#### Warmer-with-Runway
- **Shown as:** Ease into it
- **Sequence:** Soft context → emotional truth → clear point
- **Primary effect:** Prepares a hard truth so it can be heard — runway lowers abruptness before the point lands
- **Why it works:** Eases in with a little context before the hard truth, so it's received instead of triggering a shutdown.
- **Failure mode to avoid:** Padding buries the point; the runway becomes avoidance

#### Visceral Triptych → Plain Landing
- **Shown as:** Paint it, then say it
- **Sequence:** Three related sensory images → bridge sentence → plain key phrase
- **Primary effect:** Sensory, vivid, emotionally alive — for love, longing, proposal, or devotion
- **Why it works:** Builds feeling with vivid images, then lands on one plain phrase — so something tender hits with real emotional weight.
- **Failure mode to avoid:** Mixed emotional universes or an over-complicated landing destroy the effect

#### Artifact + Insight
- **Shown as:** Use a real example
- **Sequence:** Object or image → interpretation → practical consequence
- **Primary effect:** Concrete, imagistic, sticky — makes the point land through something physical or visual
- **Why it works:** Anchors your point to one concrete thing, so it's vivid and easy to grasp — and harder to brush off than an abstract claim.
- **Failure mode to avoid:** Can feel precious or theatrical if the image is forced or too ornate

### Rooted in Nonviolent Communication
*Rosenberg, NVC (requests vs demands)*

#### Demand → Willing Request
- **Shown as:** Ask, don't demand
- **Sequence:** Observation → specific doable ask → “would you be willing…”
- **Primary effect:** Cooperative and non-coercive — a request that leaves the other person free to say yes
- **Why it works:** Asks instead of demands, so they can say yes freely — which makes real cooperation far more likely.
- **Failure mode to avoid:** Too soft when a firm non-negotiable limit is actually required

#### Owned Feeling → Concrete Example → Request
- **Shown as:** Feeling, then ask
- **Sequence:** Owned feeling → concrete example → request
- **Primary effect:** Turns vague frustration or accusation into something hearable and actionable
- **Why it works:** Turns a vague complaint into an owned feeling, a clear example and a doable ask — so they can actually hear it and act.
- **Failure mode to avoid:** Can become a case-file evidence dump if the example section is too long

### Rooted in Perceived Partner Responsiveness
*Laurenceau et al. (1998); Arican-Dinc et al. (2023)*

#### Accountability + Reassurance
- **Shown as:** Own it, reassure them
- **Sequence:** Own it → impact → apology → reassurance of care and continuity
- **Primary effect:** Repairs the rupture and steadies the bond at the same time
- **Why it works:** Owns the mistake and steadies the bond at once, so they hear the repair without fearing the relationship is in question.
- **Failure mode to avoid:** Reassurance softens or dilutes the accountability it is paired with

### Rooted in Plain-language authenticity
*Plain-language & authenticity practice*

#### Plain-Language Reset
- **Shown as:** Just say it plainly
- **Sequence:** Strip therapy-speak → plain, owned statement
- **Primary effect:** Authentic and un-performative — replaces borrowed clinical diction with real words
- **Why it works:** Swaps borrowed therapy-speak for plain, honest words, so it sounds like you — and lands as sincere, not performed.
- **Failure mode to avoid:** Can feel blunt if stripped so far that warmth is lost

### Rooted in Reframing & perspective-taking
*Non-blaming / systems reframing*

#### Humane Tension Release
- **Shown as:** Ease the pressure
- **Sequence:** Acknowledge pressure → release accusation → systems view → path forward
- **Primary effect:** Firm but non-punitive — names a hard situation without blame, then moves forward
- **Why it works:** Names the hard situation without blaming anyone, so the pressure drops and you can move forward together instead of fighting.
- **Failure mode to avoid:** Can become vague if the path forward is too soft or the acknowledgement too long

#### Perspective + Reframe
- **Shown as:** See it their way first
- **Sequence:** Likely concern → humane validation → reframe → ask
- **Primary effect:** Disarming, accurate, non-reactive — reduces defensiveness before making the point
- **Why it works:** Names their likely worry first, so they feel understood before the reframe — which lowers defensiveness and keeps them open.
- **Failure mode to avoid:** Can become agreement theatre if the validation is too thick and the reframe too soft

#### Reflective Wisdom
- **Shown as:** Step back and see it
- **Sequence:** Pattern or truth → elevated meaning → earned recommendation
- **Primary effect:** Interpretive, wise, memorable — gives the audience a new frame for something familiar
- **Why it works:** Frames your point as a bigger truth, so it lands as insight rather than criticism — and stays with them afterward.
- **Failure mode to avoid:** Can over-sermonise or feel detached from practical reality if the truth is too abstract

### Rooted in Tactical empathy (Chris Voss)
*Voss, Never Split the Difference*

#### Accusation Audit → Label → Calibrated Ask
- **Shown as:** Name it before they do
- **Sequence:** Pre-name their likely reaction → label the emotion → no-pressure “how do we…” question
- **Primary effect:** Defuses defensiveness by naming the negative first and inviting collaboration
- **Why it works:** Names their likely reaction before they feel it, which disarms defensiveness and opens a real conversation.
- **Failure mode to avoid:** Reads as sarcasm or manipulation if mistimed or under-set-up

### Rooted in The Gottman Method
*Gottman & Levenson; Gottman Institute (gentle startup)*

#### Direct-but-Gentle
- **Shown as:** Kind but clear
- **Sequence:** Gentle startup → owned feeling → clear direct point → next step
- **Primary effect:** Honest without triggering defensiveness — the point lands fully but softly
- **Why it works:** Says the hard thing clearly but opens softly, so the point fully lands without putting them on the defensive.
- **Failure mode to avoid:** Can feel cold if the gentleness is stripped, or weak if the directness is

#### Accountability-First Repair
- **Shown as:** Own it first
- **Sequence:** Ownership → impact named → apology → repair step
- **Primary effect:** Apology feels real and non-self-protective — leads with the effect not the excuse
- **Why it works:** Leads with ownership instead of excuses, so the apology feels real and the repair can actually begin.
- **Failure mode to avoid:** Can become self-exonerating if explanation creeps before ownership

#### Gentle Startup → Clear Point
- **Shown as:** Soft start, clear point
- **Sequence:** Soft opening (importance + calm intent) → the point
- **Primary effect:** Lowers the defensive trajectory of a hard conversation — the opening sets the tone
- **Why it works:** Opens calmly to set the tone, because the first sentence largely decides whether the talk goes well or turns defensive.
- **Failure mode to avoid:** Over-padded opening that buries or delays the actual point

---

## How patterns are chosen per task

Landright infers the **task** from the message, then pairs two patterns: **A (clear)** — the
grounded, plain take — and **B (flair)** — the more expressive, crafted take. "Two more options"
rotates through each pool.

| Task | A · clear pool | B · flair pool |
|------|----------------|----------------|
| **Make a request** | Owned Feeling → Concrete Example → Request · Demand → Willing Request · Headline-First → Brief Why | Question + Centre of Gravity · Felt Understanding → Motive Clarity → Ask |
| **Repair after a rupture** | Accountability-First Repair · Impact Apology | Felt Understanding → Motive Clarity → Ask · Perspective + Reframe · Accusation Audit → Label → Calibrated Ask · Accountability + Reassurance |
| **Apologise** | Impact Apology · Accountability-First Repair | Accountability + Reassurance · Negative Acknowledgment → Clarification → Humane Path |
| **Reassure** | Perspective + Reframe · Continuity → Challenge → Next Step | Future-Scene → Contrast → Invitation · Permission-Gate → Runway → Reveal |
| **Set a boundary** | Clean Boundary · Direct-but-Gentle | Boundary with Relational Continuity · Humane Tension Release |
| **Ask for a pause** | Clean Boundary · Gentle Startup → Clear Point | Felt Understanding → Motive Clarity → Ask · Humane Tension Release |
| **Tell a hard truth** | Direct-but-Gentle · Plain-Language Reset · Headline-First → Brief Why | Warmer-with-Runway · Negative Acknowledgment → Clarification → Humane Path · Reflective Wisdom |
| **Show appreciation** | Appreciation Story · Plain-Language Reset | Visceral Triptych → Plain Landing · Artifact + Insight · Reflective Wisdom |
| **Open a big conversation** | Continuity → Challenge → Next Step · Headline-First → Brief Why | Future-Scene → Contrast → Invitation · Earned · Permission-Gate → Runway → Reveal |
| **Express a need** | Owned Feeling → Concrete Example → Request · Protest → Vulnerable Need | Permission-Gate → Runway → Reveal · Visceral Triptych → Plain Landing · Earned |
| **Offer a correction** | Gentle Startup → Clear Point · Coaching-Forward Correction | Humane Tension Release · Accusation Audit → Label → Calibrated Ask |
| **Reconnect across distance** | Question + Centre of Gravity · Owned Feeling → Concrete Example → Request | Shared Problem → De-personalise → Collaborative Question · Reflective Question Ladder · Future-Scene → Contrast → Invitation |

