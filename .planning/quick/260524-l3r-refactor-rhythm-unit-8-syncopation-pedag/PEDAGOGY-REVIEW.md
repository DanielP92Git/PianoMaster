# PEDAGOGY-REVIEW.md — Rhythm Unit 8 (Syncopation)

**Author:** edu-game-architect agent
**Date:** 2026-05-24
**Quick task:** 260524-l3r
**Status:** Diagnostic complete; awaits product owner decisions before planning.

## 1. Diagnosis of the Current 8-Node Flow

The unit is structurally sound but pedagogically and experientially flat. Concrete problems:

- **Two "Discoveries" of the wrong thing.** `rhythm_8_1` calls q–h–q "syncopation: hold across the beat." Strictly, q–h–q is an **agogic accent / tied-value emphasis**, not syncopation in the Kodaly/Gordon sense. It is an unstressed long value that crosses a strong beat, which is a useful gateway gesture, but framing it as "syncopation" muddies the concept the child will meet in `rhythm_8_3` (8–q–8, a true off-beat accent). The two Discoveries teach _different concepts under the same label_.
- **Identical question manifolds across nodes 2, 4, 5, 6.** Every one of those nodes uses the same 8-question template `tap → reading → visual → dictation → tap → syllable → reading → tap`, with only `durations` and `patternTags` swapped. From the child's seat the _game_ is the same; the _content_ feels almost the same too because 2-bar `patternTagMode: "any"` mixes in `quarter-only` and `quarter-half` fallback bars (nodes 2, 4, 5). So a "syncopation practice" bar often shows q q q q. Three of the five "syncopation" practice nodes can render bars with **zero syncopation in them**.
- **Tempo is the only thing visibly changing.** Tempos creep 62 → 65 → 67 → 72 → 74 → 76 → 83. A child cannot perceive a 4 BPM bump as a new node. There is no other inter-node novelty signal.
- **The "feeling moment" is missing.** Syncopation is, at root, a _bodily_ surprise: a sound where you expected silence (or stress where you expected rest). None of the current nodes ask the child to **first feel the strong beat with their body**, then **place a note off it**. The metronome plays underneath but there is no clap-on-the-beat / tap-off-the-beat split, no Kodaly call-and-response, no "spot the wrong one" perceptual contrast. Discovery cards do their job once, then we move to generic tap/read drills.
- **Boss is bloated and unfocused.** `boss_rhythm_8` carries 10 durations and 13 pattern tags including `dotted-half`, `sixteenth`, `whole-rest`, etc. The syncopation skill being assessed is diluted to perhaps 15-20% of rendered bars. A capstone should _over-index_ on the unit's headline skill, not under-index on it.
- **Speed Round (`rhythm_8_7`) uses an 8-tag cumulative pool**, so most arcade tiles aren't even syncopated. Same dilution problem.

**The "syncopation feeling moment"** — the one experience that would make this unit land — is the child realizing _"there is a sound where the beat isn't, and a silence where the beat is."_ No current node delivers that perceptual jolt as its single job.

## 2. Pedagogical First Principles for Syncopation at Age 8

- **Aural → bodily → visual → notational.** Kodaly Sequence (Choksy) places syncopation only after a stable inner pulse, eighth-note pairs (ti-ti), and the quarter rest are all secure. Gordon's Music Learning Theory is even stricter: aural/oral _audiation_ of the pattern precedes any symbolic encounter. For an 8-year-old, **the metronome (or steady tapping body part) must be the constant** while the rhythmic figure is introduced over it. This is exactly what current Discovery cards skip — they show notation and play audio, but they do not split the child's body into "pulse hand" + "rhythm hand."
- **q–h–q is easier than 8–q–8, but for a different reason than the unit assumes.** The current unit orders them long-first because "longer notes are easier." True at sight-singing. But the _syncopation perception_ in q–h–q is weaker (it's an agogic emphasis; many children won't hear it as off-beat at all). 8–q–8 is the canonical "Or-fé-o" / "pine-AP-ple" Kodaly figure and is the gesture children actually _recognize_ as syncopated. Recommendation: keep q–h–q first as a **bridge / warm-up**, but rename and reframe it as "long-note emphasis" — not as a syncopation discovery. Reserve the word "syncopation" for the 8–q–8 node.
- **Prerequisites.** Child should have: eighth-note pairs (Unit 3), quarter rest (Unit 4-ish), steady pulse to a metronome (Unit 1-6). Unit 7 (6/8) actually breaks the pulse-stability prerequisite a little because 6/8 retrains the body to feel 2 dotted-quarter beats. Going from 6/8 straight back to 4/4 syncopation is a meter-flip the child will pay for. A short "re-enter 4/4" pulse re-grounding (1 question, not a whole node) would help.
- **Literature placement.** Orff Schulwerk Vol. I introduces syncopation via spoken text ("Lem-on-ADE", "spa-GHET-ti") and body percussion _long_ before notation. Suzuki rhythm sheets introduce 8–q–8 around Book 1 piece 8 ("The Honeybee"). Dalcroze Eurhythmics handles it as a stepping/clapping split. All four traditions agree: **say it and move it before you read it**.
- **Naming.** Avoid the literal word "syncopation" for the child UI. Use "Off-Beat Magic" (already the unit name), "Surprise Beats", or Kodaly's "syn-co-PA". Keep "syncopation" for the design doc.

## 3. Engagement Principles

Duolingo's unit non-repetitiveness comes from four levers: **surface form** (different art/animation), **input modality** (type/tap/listen/speak), **reward cadence** (XP varied, occasional bonus chests), and **micro-context shift** (new character, story beat). Currently Unit 8 varies _zero_ of these between nodes 2-6.

- **Age 8 fatigue ceiling:** 6-8 questions per node is the sustainable max. Current 8-9 is at the edge. The Boss at 12 is over. Recommend 6-8 for regular nodes, 10 for boss.
- **Lever 1 — modality per node.** Instead of every node being a 60/40 mix of tap+read+sprinkle, make each node _monomodal_: one node is **pure listening**, one is **pure reading**, one is **pure body-split**, one is **creative/play**. This is how Yousician keeps "Lesson 3.2" feeling different from "Lesson 3.3."
- **Lever 2 — new visual or audio context per node.** The current TrailNode icon palette already supports this (Discovery/Practice/Speed/Boss). Add at least one **per-node "hook"** flagged below: a metronome that splits to two voices, a Kodaly syllable call-and-response, a "spot the syncopation" detective screen.
- **Lever 3 — a creative/milestone moment.** A single-question "Compose your own" node where the child arranges 2 measure-tiles from a palette and hears them play back is the kind of mechanic that breaks the worksheet feel. Flagged as stretch.
- **Lever 4 — variable XP and a clear arc.** Current XP creeps 70 → 75 → 80 → 85 → 85 → 90 → 250. Flat. Recommend a deliberate dip-then-spike: Discovery 60 (light) → Bridge 50 → Discovery 80 (heavier) → Practice 85 → Creative 100 (surprise bonus) → Speed 90 → Boss 250.

## 4. Proposed New Unit 8 Structure (7 nodes)

Renaming: **"Off-Beat Magic"** — keep. Frame the unit narrative as _"Most music puts notes on the beat. Today you learn to put them between."_

### Node 1 — `rhythm_8_1` "Hold-Across" Warm-Up (DISCOVERY, 4/4, 1 bar)

- **Role:** Re-ground the child in 4/4 after Unit 7's 6/8, AND teach the long-note-over-the-beat gesture (q–h–q). Framed not as syncopation but as "the long note that holds across a beat."
- **Content:** `durations: [q, h]`, strict `patternTags: ['long-syncopation']`, tempo 60-66.
- **Questions (6):** `discovery_intro(h)` → `pulse` (tap with the metronome — 4/4 re-grounding) → `rhythm_tap` → `visual_recognition` → `rhythm_tap` → `rhythm_reading`.
- **Engagement hook:** The discovery card animates a hand holding through beat 3 while the metronome ticks under it. Includes a `pulse` question — the child taps along to the bare metronome before any syncopation is added. This is the re-entry into 4/4 from 6/8.
- **Success criteria:** ≥ 80% on the 5 non-intro questions, and pulse tap accuracy ≥ 75% (engine already supports `pulse`).

### Node 2 — `rhythm_8_2` "Surprise Beat: Listen & Echo" (DISCOVERY, 4/4, 1 bar)

- **Role:** The headline syncopation moment. 8–q–8 introduced **aurally first**, with no notation until question 4. This is the _feeling moment_ the current unit lacks.
- **Content:** `durations: [8, q]`, strict `patternTags: ['syncopation']`, tempo 64-70.
- **Questions (7):** `discovery_intro(8)` (audio + animation, no read-along) → `rhythm_tap` → `rhythm_tap` → `visual_recognition` (now show notation: pick the one you just heard) → `syllable_matching` (Kodaly: "ti-ta-ti" / Hebrew equivalent) → `rhythm_tap` → `rhythm_reading`.
- **Engagement hook:** First three post-intro questions are **listen-and-echo only** — no staff is shown. The notation reveal in Q4 is the "aha." Syllable matching anchors it lexically.
- **Success criteria:** ≥ 80%, and ≥ 70% on the two `rhythm_tap` echo questions specifically (engine can check via per-question scoring — flag as stretch if not yet wired).

### Node 3 — `rhythm_8_3` "Read the Off-Beat" (PRACTICE, 4/4, 2 bars)

- **Role:** Notation fluency for 8–q–8. Pure reading focus. NO tap questions.
- **Content:** `durations: [q, h, 8]`, `patternTags: ['syncopation', 'quarter-half']`, `patternTagMode: 'any'`, tempo 70-78. Bars stay mixed so the child must _spot_ the syncopated bar visually.
- **Questions (6):** `rhythm_reading` × 4 interleaved with `visual_recognition` × 2.
- **Engagement hook:** "Detective mode" framing — in the `visual_recognition` questions, the prompt is "Which one has the off-beat?" with 3 notated options where only one is syncopated. Game-feel is completely different from Node 2's listening drill.
- **Success criteria:** ≥ 80%; flag any single reading question scored < 50% for review.

### Node 4 — `rhythm_8_4` "Body Split" (PRACTICE, 4/4, 1-2 bars)

- **Role:** Bodily integration. Child taps pulse with one input source (or the device buzzes/visually pulses) while tapping the syncopated rhythm with the other. This is Dalcroze in miniature.
- **Content:** `durations: [q, 8]`, strict `patternTags: ['syncopation']`, tempo 66-74.
- **Questions (6):** `pulse` → `rhythm_tap` × 4 (with a visible pulsing beat indicator on screen, not silent) → `rhythm_tap`.
- **Engagement hook:** A persistent on-screen "heartbeat" circle pulses at quarter-note rate behind every `rhythm_tap` question. Child sees the beat AND taps the off-beat. **STRETCH:** if MixedLessonGame doesn't already render a synchronized visual pulse during `rhythm_tap`, that is one small renderer addition. Falls back gracefully to plain `rhythm_tap` if not implemented.
- **Success criteria:** ≥ 80% accuracy and ≥ 75% timing accuracy on tap onsets relative to the visual pulse.

### Node 5 — `rhythm_8_5` "Build a Syncopation" (CHALLENGE, 4/4, 2 bars) — **STRETCH**

- **Role:** Creative milestone. The single most morale-changing addition to the unit.
- **Content:** One question, then 4 short verification questions.
- **Questions (5):** `compose_rhythm` (drag 4 tile-bars from a palette: [q q q q], [q h q], [8-q-8 q], [q 8-q-8], etc. — playback the chosen 2-bar phrase) → `rhythm_tap` × 2 (echo the phrase the child built) → `rhythm_reading` × 2 (read it back from notation).
- **Engagement hook:** Authorship. The child _makes_ a syncopated phrase and the app plays it. This is the one node nobody will forget.
- **STRETCH FLAG:** `compose_rhythm` does not exist in MixedLessonGame today (only `discovery_intro | rhythm_tap | rhythm_reading | visual_recognition | syllable_matching | rhythm_dictation | count_subdivision | pulse`). Building it = one new question component + a small tile palette UI. If we don't want to build it, fall back to a `rhythm_dictation` node that asks "tap what you'd want a friend to play," which is a weaker but shippable substitute.
- **Success criteria:** Composition completion + ≥ 75% on the 4 verification questions.

### Node 6 — `rhythm_8_6` "Off-Beat Speed Drill" (SPEED_ROUND, 4/4, ARCADE)

- **Role:** Speed + endurance on the new gesture.
- **Content:** `durations: [q, h, 8]`, `patternTags: ['syncopation', 'long-syncopation', 'quarter-eighth']` — **tighter than current 8-tag pool** so syncopated tiles dominate the arcade. Tempo 80-88.
- **Engagement hook:** Tile color/glow change for syncopated tiles (small renderer tweak, optional). Arcade game-feel does the heavy lifting; no further variety needed.
- **Success criteria:** Engine-default stars.

### Node 7 — `boss_rhythm_8` "Syncopation Boss" (BOSS, 4/4, 4 bars)

- **Role:** Capstone _of this unit's skill_ — not a kitchen-sink rhythm finale.
- **Content:** `durations: [q, h, 8]` (drop `qd, 16, hd, wr, hr` from current pool — they dilute), `patternTags: ['syncopation', 'long-syncopation', 'quarter-half', 'quarter-eighth']` with `patternTagMode: 'any'`. **≥ 50% of bars must be syncopated** — this may require a small generator weighting change or a curated pattern subset.
- **Questions (10, down from 12):** `rhythm_reading` × 4, `rhythm_dictation` × 3, `rhythm_tap` × 2, `visual_recognition` × 1.
- **Engagement hook:** Boss music + glow on syncopated bars during reading. Reward = badge already specified.
- **Success criteria:** ≥ 80% for 1 star, ≥ 90% for 2, ≥ 95% for 3 (engine standard).
- **NOTE:** This removes the "ultimate rhythm finale crossing 6/8 + 4/4 + all durations" framing the current code carries. That kind of meta-capstone belongs as a _separate_ "Rhythm Grandmaster" node or future Review unit — not stapled onto the syncopation unit.

### Removed / merged from current design

- Current `rhythm_8_2` (q–h–q 2-bar with fallback) folded into new Node 1 + Node 3 pool.
- Current `rhythm_8_4` (8–q–8 2-bar with fallback) replaced by stricter Node 3.
- Current `rhythm_8_5` (combined 2-bar) replaced by Node 5 (creative).
- Current `rhythm_8_6` (mixed syncopation phrases) absorbed into Node 6 Speed Round and Boss.

Net: **8 → 7 nodes**, but each one _feels_ distinct.

## 5. Risks and Open Questions

1. **Naming "syncopation."** Should we call q–h–q syncopation at all in child-facing UI? Recommendation: no, reserve the word for 8–q–8. Music teacher should confirm — there's defensible disagreement (Western classical theory accepts both as syncopation).
2. **6/8 → 4/4 re-entry cost.** Should we insert a 1-node pulse re-grounding between Unit 7 and Unit 8, or fold it into Unit 8 Node 1 as proposed? Folding is cheaper; a dedicated transition node is more pedagogically clean.
3. **Build the creative `compose_rhythm` question type, or punt?** Highest engagement payoff in the unit. Estimated 1-2 days of dev work for an MVP tile palette + playback. Riskiest assumption: that children at 8 can usefully arrange tiles without overwhelm. Mitigation: ship with only 4 tile options.
4. **Bar-level syncopation weighting in the Boss.** Without a generator tweak, `patternTagMode: 'any'` over `[syncopation, long-syncopation, quarter-half, quarter-eighth]` may still emit ~50% non-syncopated bars (pure chance, depending on pattern counts per tag). The cleanest fix is a tagged pattern subset like `syncopation-heavy`. Music teacher + dev should confirm scope.

**Riskiest assumption overall:** that splitting nodes by _modality_ (listen-only vs read-only vs body-split vs creative) won't read to children as "less of each skill per node." Mitigation: pulse the modality across the 7 nodes such that every skill (tap, read, listen, identify) appears in at least 3 nodes total — just not in equal ratios within each node.
