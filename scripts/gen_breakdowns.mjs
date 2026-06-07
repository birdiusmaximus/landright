// One-off: author per-route, beat-by-beat breakdowns for the onboarding
// line_breakdown screen and write them into data/onboarding_demos.json.
// Every span is verified to be a verbatim substring of its route text before
// the file is written (segmentMessage() locates spans via indexOf).
import { readFileSync, writeFileSync } from "node:fs";

const PATH = new URL("../data/onboarding_demos.json", import.meta.url);
const demos = JSON.parse(readFileSync(PATH, "utf8"));

// [span, why, rootedIn] per route. Spans must be exact substrings of the text.
const BEATS = {
  apology_without_self_defence: {
    a: [
      ["I’m sorry I snapped at you.", "Opens with the apology itself, no run-up.", "Lead with the apology"],
      ["You didn’t deserve to be spoken to like that", "Centers the impact on them before any explanation.", "Impact first"],
      ["I can see how it would make you feel attacked instead of heard", "Shows you understand how it landed for them.", "Perspective-taking"],
      ["I’m responsible for how I handle my frustration", "Owns the behaviour without shifting blame.", "Clear accountability"],
      ["next time I need a pause I’ll say that plainly instead of taking it out on you", "Names a concrete repair for next time.", "Repair, made specific"],
    ],
    b: [
      ["I want to clean up my part", "Frames it as taking ownership, not negotiating.", "Own your part"],
      ["raising my voice was not okay", "States the fault plainly before any context.", "Responsibility first"],
      ["I also felt cornered in that moment", "Adds context, but only after the apology.", "Context, placed second"],
      ["I should have said, 'I need a minute,' instead of snapping", "Offers the better move you could have made.", "Concrete alternative"],
      ["I don’t want the fact that I felt pushed to sound like permission", "Names the pressure without using it as an excuse.", "Context without excuse"],
    ],
  },
  need_without_pressure: {
    a: [
      ["I’ve been feeling lonely and a little pushed to the edge of your life lately", "Names the feeling, owned as yours.", "Owned feeling"],
      ["When we go a couple weeks without making an actual plan", "Gives a concrete pattern, not a global complaint.", "Specific example"],
      ["like this past weekend when we only texted in between other things", "Anchors it to a real, recent moment.", "Concrete detail"],
      ["I start to miss feeling close to you", "Connects the pattern back to the need.", "Name the need"],
      ["Could we pick one night this week to be together without rushing", "Turns it into a clear, doable request.", "Willing request"],
    ],
    b: [
      ["Would you be open to finding a time soon that feels good for both of us?", "Opens with an invitation, not a demand.", "Autonomy-preserving ask"],
      ["I don’t want to corner you or turn your schedule into a test", "Names and disarms the pressure.", "Remove the pressure"],
      ["I just noticed we’ve had a few near-misses lately", "Gives the evidence gently, low blame.", "Low-blame example"],
      ["I care about us", "Keeps the relationship visible.", "Care made explicit"],
      ["I’d rather you tell me honestly than fit me in out of guilt", "Leaves them a real way out.", "No guilt leverage"],
    ],
  },
  hurt_without_blame: {
    a: [
      ["When you made that comment about me at dinner", "Anchors to the specific event, not a pattern.", "Specific event"],
      ["I felt exposed and small", "Owns the feeling in the first person.", "Owned feeling"],
      ["I’m not saying you meant to hurt me", "Separates impact from intent so they don’t defend.", "Motive separation"],
      ["it landed as embarrassing in front of everyone", "Keeps the focus on impact, not accusation.", "Impact, not accusation"],
      ["I’d rather you tell me privately so I can actually hear you", "Offers a better way to handle it next time.", "Constructive ask"],
    ],
    b: [
      ["What hurt most wasn’t just the joke itself", "Moves past the surface event.", "Past the surface"],
      ["it was feeling like I didn’t have you with me in that room", "Names the deeper need underneath.", "Underlying need"],
      ["I need to feel that we protect each other’s dignity around other people", "States the value at stake.", "Shared value"],
      ["I felt alone and embarrassed", "Keeps it in owned feeling.", "Owned feeling"],
      ["I want us to talk about how we handle moments like that", "Turns it toward repair, not blame.", "Toward repair"],
    ],
  },
  boundary_without_coldness: {
    a: [
      ["I’m going to stop having these conversations late at night", "States the limit cleanly and first.", "Clean boundary"],
      ["I care about what’s happening between us", "Keeps the relationship visible.", "Care made visible"],
      ["when it turns into hours of arguing or processing before sleep, I’m not okay the next day", "Gives the honest reason without blame.", "Reason, not blame"],
      ["If it’s after 10, I’m going to pause", "Makes the boundary concrete and predictable.", "Specific limit"],
      ["we can pick it up tomorrow at a time we both choose", "Turns the limit into a pause, not a wall.", "Pause, not rejection"],
    ],
    b: [
      ["I want us to get through this", "Leads with the shared goal.", "Shared goal"],
      ["I can stay with you for a little while", "Offers connection before the limit.", "Connection first"],
      ["then I need us to close the conversation and rest", "States the limit clearly.", "Clear limit"],
      ["even if everything isn’t solved yet", "Accepts the discomfort of an open thread.", "Tolerate the open thread"],
      ["stepping away tonight isn’t me stepping away from you", "Names the fear and answers it.", "Reassurance"],
    ],
  },
  reconnect_after_distance: {
    a: [
      ["I don’t want the silence to turn into its own story between us", "Names the risk without blame.", "Name the distance"],
      ["I know we may both have reasons for pulling back", "Shares responsibility both ways.", "Shared ownership"],
      ["treat the distance as the thing we’re trying to understand", "Puts the problem, not the person, in the centre.", "Problem, not person"],
      ["not as proof that either of us doesn’t care", "Removes the worst interpretation.", "Reframe the meaning"],
      ["Can we name what’s making it hard to talk right now?", "Opens a low-pressure door.", "Open question"],
    ],
    b: [
      ["Can I ask what feels most important to you right now", "Leads with their reality, not your ask.", "Their reality first"],
      ["space, a clearer conversation, or something else", "Offers options so it isn’t loaded.", "Low-pressure options"],
      ["I miss being in touch", "Keeps your care honest and visible.", "Honest care"],
      ["I don’t want to push past what you need", "Protects their autonomy.", "Respect their pace"],
      ["just tell me where you are with this", "Makes responding easy.", "Easy next step"],
    ],
  },
  pause_before_escalation: {
    a: [
      ["This is getting too heated for me to keep listening well", "Names your own state, not their fault.", "Self-regulation language"],
      ["I don’t want to say something careless just to get out of it", "Frames the pause as protective.", "Protect the relationship"],
      ["I’m going to take a break now", "States the pause clearly.", "Clear pause"],
      ["I’ll come back at 7:30", "Gives a concrete return point.", "Return point"],
      ["I’ll pause it again instead of pushing through", "Sets the rule for next time.", "Repeatable plan"],
    ],
    b: [
      ["I’m not leaving this conversation because you don’t matter", "Names the fear the pause could trigger.", "Pre-empt the fear"],
      ["I’m too overwhelmed to take in what you’re saying right now", "Owns your capacity honestly.", "Owned state"],
      ["I need to stop for a bit and settle myself", "States the pause and its purpose.", "Clear pause"],
      ["I want to try again after dinner", "Commits to returning.", "Return point"],
      ["when I can actually hear you and answer without snapping", "Names what the break is for.", "Purposeful pause"],
    ],
  },
  truth_without_attack: {
    a: [
      ["I don’t think this relationship is working for me anymore", "States the hard truth plainly.", "Plain truth"],
      ["I care about you", "Holds care alongside the truth.", "Care alongside truth"],
      ["I’m not saying this to punish you or force a reaction", "Removes the threat from the message.", "Disarm the threat"],
      ["pretending we’re okay is starting to hurt us both", "Gives the honest reason.", "Honest reason"],
      ["with as much kindness and respect as we can manage", "Sets the tone for what comes next.", "Set the tone"],
    ],
    b: [
      ["This is hard to say", "Signals weight and care up front.", "Soft start"],
      ["there are still parts of us that matter deeply to me", "Anchors in what is real and good.", "Anchor in care"],
      ["Lately I’ve felt more lonely and tense in this relationship than connected", "Owns the feeling specifically.", "Owned feeling"],
      ["I don’t want to keep brushing that aside", "Names why now.", "Why now"],
      ["I’d like us to slow down and talk honestly about where we go from here", "Opens the conversation, not a verdict.", "Open the conversation"],
    ],
  },
};

// ── Verify every span is a verbatim substring of its route text ──────────────
const failures = [];
for (const [moment, routes] of Object.entries(BEATS)) {
  for (const r of ["a", "b"]) {
    const text = demos[moment].routes[r].text;
    for (const [span] of routes[r]) {
      if (text.indexOf(span) < 0) failures.push(`${moment}.${r}: NOT FOUND -> ${span}`);
    }
  }
}

if (failures.length) {
  console.error("✗ Span verification failed; file NOT written:\n" + failures.join("\n"));
  process.exit(1);
}

// ── Write per-route breakdowns into the demos file ───────────────────────────
for (const [moment, routes] of Object.entries(BEATS)) {
  demos[moment].breakdown = {
    a: routes.a.map(([span, why, rootedIn]) => ({ span, why, rootedIn })),
    b: routes.b.map(([span, why, rootedIn]) => ({ span, why, rootedIn })),
  };
}

writeFileSync(PATH, JSON.stringify(demos, null, 2) + "\n");
const counts = Object.entries(BEATS).map(([m, r]) => `${m}: a=${r.a.length} b=${r.b.length}`);
console.log("✓ All spans verified and written.\n" + counts.join("\n"));
