# Phase 33: Rhythm Issues Cleanup - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Triage and resolve the 13 rhythm issues captured in `33-SEED-ISSUES.md` from manual UAT after Phases 30–32 shipped. This is a **bug-fix + polish + data-audit** phase over the existing rhythm trail. No new game types, no new mechanics. Boundary: rhythm games, rhythm unit data, rhythm pattern generator, rhythm-game audio integration. Includes one Supabase migration deploy (rate-limit) tied to a console 404 surfaced during UAT.

The 13 seed issues split into four buckets:

- **Triage / scope** — many are likely already fixed by Phases 30/31/32; verify each before fixing
- **Curriculum & data integrity** — node 1_3 rests, section/content title mismatches, pulse generating wrong durations, combined-values nodes not shuffling all expected durations
- **Audio bugs that survived Phase 30** — first-play trim still reported, dictation listen fails inside MIXED_LESSON
- **Boss & Speed Challenge feel** — Phase 32 content levers shipped but user reports they still feel flat

</domain>

<decisions>
## Implementation Decisions

### Triage & Scope

- **D-01: Verify-first, fix-only-survivors approach.** Researcher reproduces each seed issue against current code before planning fixes. Phase 30/31/32 shipped real changes (TOTAL_PATTERNS=8, no-consecutive-identical, BOSS removed from EASY_NODE_TYPES, all 6 Mix-Up nodes deleted, long-press in PulseQuestion + RhythmTapQuestion confirmed shipped). Don't re-fix already-fixed code.
- **D-02: Verification format = triage doc + manual UAT confirmation.** Researcher writes a triage doc per issue: "expected behavior per current code", "reproduction steps for user". User plays through dev build and marks each issue confirmed-bug / resolved / cannot-reproduce. Fixes only target confirmed-bug entries.
- **D-03: Survivors of shipped phases are fair game for Phase 33.** Don't reopen Phase 30/31/32 — they are closed. If a Phase 31-era bug still reproduces, it gets a Phase 33 fix.
- **D-04: Drop Issue 11 (rhythm pattern feels same as practice) outright.** Phase 32 D-11 already removed all 6 Mix-Up nodes. Issue is structurally resolved — no investigation needed.
- **D-05: Drop Issue 12's session-length subclaim** ("10 exercises too long"). Phase 32 D-01 already reduced TOTAL_PATTERNS to 8. The "no halves variety" subclaim still gets retested under Boss/Speed feel discussion.
- **D-06: Done bar = all confirmed-survivor bugs fixed + manual UAT passes.** No automated regression-test requirement. Manual playthrough is the gate. Beta launch focus: ship, don't gold-plate.
- **D-07: Rate-limit migration in scope.** Apply `supabase/migrations/20260201000002_add_rate_limiting.sql` to remote Supabase as part of this phase. Closes the console 404 (issue 6) alongside the rest of cleanup.

### Curriculum & Data Integrity

- **D-08: Full data audit across all 8 rhythm unit files + pattern library.** Researcher reads every node's `rhythmConfig` (durations, focusDurations, contextDurations, patternTags) and every pattern definition tagged for those nodes. Flags every mismatch: tags containing durations not in node's `durations`, section names that don't match content, exercise sequences that aren't pedagogically ordered. Beta launch is close — catch the unreported bugs now.
- **D-09: Enforce node-allowed durations in `RhythmPatternGenerator`.** Single central fix: pattern generator filters resolved patterns against `rhythmConfig.durations` before returning. Protects pulse, dictation, reading, and tap simultaneously. Catches future tag-vs-duration drift automatically. Fixes issue 8 (pulse-generates-halves-in-quarter-only) at the root.
- **D-10: Combined-values variety rule = "at least one pattern per declared duration per session".** If `rhythmConfig.durations: ['q','h']`, a session must include >=1 pattern containing halves AND >=1 with quarters. Beyond that, random with Phase 32 D-02's no-consecutive-identical rule still active. Reuses existing variety machinery. Fixes issue 10.
- **D-11: Section/content title mismatches resolved via audit, not user-named list.** User flagged it as a general impression, not specific nodes. Researcher reads all `name`/`description`/exercise content per node, flags every drift, and proposes corrected text. User approves proposed fixes during UAT.
- **D-12: For node 1_3 rests issue, fix at the pattern-tag pool level.** Remove all rest-containing patterns from the `quarter-half` tag pool. Rests aren't introduced until later units; the tag should yield only quarters and halves. Same audit logic applies to every tag in early units (audit catches it system-wide).

### Audio Bugs

- **D-13: Dictation-listen-in-MIXED_LESSON fix uses a shared prewarm hook.** Extract "await resume → schedule" into a shared utility (e.g. `useEnsureAudioReady()` or equivalent). Every renderer mount uses it — standalone OR inside MixedLessonGame. Fixes issue 7 at the integration-pattern level, not just the symptom.
- **D-14: First-play trim (issues 1, 4) — investigate scheduler buffer + actual audio start time.** Likely the `audioContext.currentTime + 0.1` buffer is too small on some devices, OR `sound.start()` isn't waiting for actual context resume. Researcher traces actual playback start vs. scheduled start. May need larger lookahead OR an extra one-shot buffer on the very first play after a context resume. Pending triage confirmation that the bug actually still reproduces post-Phase 30.
- **D-15: For eighths first-play (issue 4), don't pre-decide between trim-only vs trim+sequence.** Triage will confirm whether AUDIO-03's 4-pair-with-pitch-alternation actually shipped. Plan covers either case.
- **D-16: Hardening scope = only the renderers that reproduce a bug.** Don't preemptively add the prewarm hook to every rhythm renderer. If only DictationQuestion + the trimming sites need it, only fix those. Smaller diff, smaller retest surface, beta launch focused.

### Boss & Speed Challenge Feel

- **D-17: Retest Phase 32 first; UX layer is contingent.** Triage step has user replay current bosses + speed challenges (post-Phase-32 build). If they now feel sufficiently differentiated, issues 12/13 are closed. Only if user reports they STILL feel flat after a fresh retest does Phase 33 add the UX layer.
- **D-18: Contingent boss UX = intro overlay + victory VFX, no new mechanics.** If retest shows boss still feels flat, add: a 2-second "BOSS FIGHT" intro overlay before the game starts, plus distinct victory VFX/sound on VictoryScreen for boss nodes only. No music swap, no new game mechanics, no boss-specific HUD. This pulls in two of Phase 32's deferred ideas.
- **D-19: Contingent speed-pool fix = mirror Phase 32 boss D-06 cumulative-units logic.** If retest shows quarters-only speed challenges still feel stale and the no-consecutive rule is genuinely active, the root cause is intrinsic pool size. Solution: speed challenge in unit N pulls patterns from units 1..N (same helper as boss D-06). Unit 1 stays small (intrinsic limit), unit 3+ feels much fresher. Same code helper as boss cumulative-units.
- **D-20: Plan must hold both contingent fixes ready as conditional plans.** Planner produces "IF contingent-boss-UX confirmed needed THEN execute plan X" / "IF speed-pool-expansion confirmed needed THEN execute plan Y". Avoids re-discussion if triage flips them on.

### Claude's Discretion

- Exact name and signature of the shared prewarm hook (`useEnsureAudioReady`, `useAudioPrewarm`, etc.)
- Whether the duration-filter in `RhythmPatternGenerator` (D-09) goes inside `resolveByTags()` or wraps it
- Concrete algorithm for "at least one pattern per declared duration" (rejection-sample-then-fill, weighted-pull, two-phase pick)
- Exact triage doc structure (markdown table, JSON manifest, per-issue subsection)
- How to handle nodes with `focusDurations`/`contextDurations` weighting in D-10 — strict equal coverage vs. lean toward focusDurations
- Visual treatment of boss intro overlay and VFX (if D-18 fires) — copy patterns from Phase 23 polish work
- Concrete buffer increase value for D-14 if confirmed (e.g., 200ms vs. 300ms)
- Whether to also add `excludeDurations` config field as a defense layer behind D-09/D-12 (belt-and-suspenders)
- Order of execution: triage → audio fixes → data audit → contingent UX, vs. fully parallel

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Seed input (the bug list this phase exists to address)

- `.planning/phases/33-rhythm-issues-cleanup/SEED-ISSUES.md` — original 13-issue UAT punch list

### Requirements & Roadmap

- `.planning/REQUIREMENTS.md` — AUDIO-01/02/03 (covered by Phase 30 — verify), PLAY-01 (Phase 31 — verify), PLAY-02/03/04 (Phase 32 — verify)
- `.planning/ROADMAP.md` — Phase 33 entry (goal currently "TBD" — replaced by this CONTEXT)

### Prior phase context (these are the phases whose work is being verified/extended)

- `.planning/phases/30-audio-fixes/30-CONTEXT.md` — D-01 await-resume-then-schedule, D-04 dictation prewarm, D-05/D-06 eighths 4-pair pitch alternation
- `.planning/phases/31-long-press-sustain/31-CONTEXT.md` — D-01..D-08 hold mechanics in listen&tap + pulse
- `.planning/phases/32-game-design-differentiation/32-CONTEXT.md` — D-01..D-17 speed/boss/Mix-Up changes; deferred ideas list (boss-only celebration VFX, per-node TOTAL_PATTERNS)

### Rhythm unit data (full audit surface — D-08)

- `src/data/units/rhythmUnit1Redesigned.js` — node 1_3 rests fix (D-12), section/content audit (D-11)
- `src/data/units/rhythmUnit2Redesigned.js` — full audit
- `src/data/units/rhythmUnit3Redesigned.js` — full audit
- `src/data/units/rhythmUnit4Redesigned.js` — full audit
- `src/data/units/rhythmUnit5Redesigned.js` — full audit
- `src/data/units/rhythmUnit6Redesigned.js` — full audit
- `src/data/units/rhythmUnit7Redesigned.js` — full audit
- `src/data/units/rhythmUnit8Redesigned.js` — full audit
- `src/data/PEDAGOGY.md` — 4-lever vocabulary from Phase 32 D-16; informs audit decisions

### Pattern generator + library (D-09 central fix)

- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — `resolveByTags()`, `getPattern()` — duration-filter goes here
- (Pattern definition file/library — researcher to locate via grep on `patternTags` consumers; D-12 rest-pool cleanup happens there)

### Audio infrastructure (D-13, D-14)

- `src/contexts/AudioContextProvider.jsx` — shared AudioContext lifecycle
- `src/hooks/useAudioEngine.js` — `resumeAudioContext`, `createPianoSound`, `initializeAudioContext`
- `src/components/games/rhythm-games/utils/rhythmTimingUtils.js` — `schedulePatternPlayback` (lookahead buffer lives here)
- `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx` — `handleListen` (D-13 integration point)
- `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` — eighths sequence (D-15 verification)
- `src/components/games/rhythm-games/MixedLessonGame.jsx` — wraps RhythmDictationQuestion (D-13 fix must work through this mount path)

### Game components (Speed Challenge + Boss surface for D-19, D-18)

- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — TOTAL_PATTERNS=8 (Phase 32 D-01), `lastPatternRef` (Phase 32 D-02), node-pool resolution
- `src/components/games/rhythm-games/MixedLessonGame.jsx` — boss MIXED_LESSON sequences
- `src/components/games/VictoryScreen.jsx` — boss-specific VFX hook point (D-18)

### Trail infrastructure

- `src/data/skillTrail.js` — `getNodeById()`, `getNodesByCategory()`
- `src/data/expandedNodes.js` — aggregates unit files
- `scripts/validateTrail.mjs` — prebuild validator (safety net for any data audit changes)

### Long-press (D-03 verification — already shipped)

- `src/components/games/rhythm-games/renderers/PulseQuestion.jsx` — `handlePressStart`, `handlePressEnd`, `isHoldNote` (confirmed shipped)
- `src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx` — same hold pattern (confirmed shipped)

### Database

- `supabase/migrations/20260201000002_add_rate_limiting.sql` — D-07 deploy target; closes issue 6 console 404

### Design system

- `docs/DESIGN_SYSTEM.md` — glassmorphism patterns (boss intro overlay must match if D-18 fires)
- `src/contexts/AccessibilityContext.jsx` — reduced-motion preference (boss VFX must respect)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `useAudioEngine.resumeAudioContext()` — already returns boolean success; D-13's shared hook can wrap this with `await + verify state==="running"`
- `RhythmPatternGenerator.resolveByTags()` — central pattern resolution; D-09 filter slots in here as a post-resolve step
- `lastPatternRef` (ArcadeRhythmGame.jsx:195) + binary signature dedup — Phase 32 D-02 mechanism; D-10 variety rule extends the same approach with per-duration-coverage check
- Phase 32 D-06 cumulative-units helper for boss patterns — D-19 reuses the same helper for speed challenge (rename/generalize from "boss only" to "any node that wants cumulative-units pull")
- `EASY_NODE_TYPES` set — already excludes BOSS (Phase 32 D-07), `mini_boss` retained — no change needed
- VictoryScreen already differentiates by node type (existing star thresholds vary) — D-18 boss VFX hooks into existing branch
- `validateTrail.mjs` runs on prebuild — will catch any data audit changes that break prereqs/cycles

### Established Patterns

- All rhythm renderers use `audioEngine.getCurrentTime()` + `enginePlayNote` wrapper — D-13's shared hook fits this pattern, doesn't replace it
- Rhythm unit files follow strict template (UNIT_ID, START_ORDER, nodes array with orderInUnit) — D-08 audit can lint each unit against the template
- Pattern tags are arrays of strings; resolveByTags pulls a flat list — D-09 filter is `patterns.filter(p => p.durations.every(d => node.durations.includes(d)))` style
- Phase 32 already added per-node `rhythmConfig` fields (e.g., `includePreviousUnits` if shipped) — D-19 may reuse or add a similar field for speed challenge

### Integration Points

- `MixedLessonGame.jsx` mounts `RhythmDictationQuestion` as one of its question components → D-13 hook applied at every mount of any audio-using renderer covers both standalone and MixedLessonGame paths
- D-09's duration filter runs at pattern resolution, before any game consumes the pattern → all four rhythm games benefit without per-game changes
- D-12's pattern-tag-library cleanup propagates through `resolveByTags()` → all consumers see the cleaned tag instantly; no per-node migration needed
- Rate-limit migration (D-07) is purely additive (creates RPC); no client code change needed once deployed — frontend warning silently disappears

</code_context>

<specifics>
## Specific Ideas

- **Beta-launch framing.** Phase 33 is the last cleanup before the user starts beta UAT with real children. Bias toward ship-ready: fix what's broken, don't gold-plate, don't refactor opportunistically. The "verify-first" approach exists specifically to keep the diff small.
- **Phase 30/31/32 should be assumed shipped correctly until triage proves otherwise.** Code review confirms the changes landed. If user's UAT pass was on a stale build (e.g., before the deploy that included Phase 32), most boss/speed/Mix-Up complaints will simply close after a fresh retest.
- **The rate-limit migration is the only ops task in Phase 33.** Treat carefully — applying a migration to remote Supabase is a hard-to-reverse action; verify the migration is idempotent and won't break existing tables before applying.
- **D-09's central duration-filter is the highest-leverage fix in this phase.** It closes issue 8 directly and prevents a class of future bugs. Strongly preferred over per-node patches.
- **The contingent UX layer (D-18, D-19) is intentionally gated.** If Phase 32's content levers turn out to feel sufficient after a fresh retest, the phase ends smaller. If not, the contingent plans activate without re-discussion.
- **Per Phase 32 D-17, `RHYTHM_COMPLEXITY` enum (SIMPLE/MEDIUM/VARIED/ALL) is still flagged for cleanup but explicitly not in this phase.** Don't refactor it during the data audit — flag and skip.

</specifics>

<deferred>
## Deferred Ideas

- **Automated regression test suite for rhythm games** — D-06 picked manual UAT over automated tests. If post-beta the manual gate isn't catching enough, a future phase adds vitest coverage for issue scenarios (audio prewarm, pattern duration filter, variety rule, hold-note scoring).
- **Boss-specific music sting / theatrical music swap during boss play** — considered as a richer alternative to D-18's intro+VFX. Out of scope for cleanup phase. Future polish phase.
- **Hand-authored pattern variation library expansion** — bulking up "quarter-only" tag with rhythm variants (accents, syncopation hints). Considered as alternative to D-19's cumulative-units pull. Deferred — D-19 covers the variety problem with no new content authoring.
- **`excludeDurations` config field on rhythmConfig** — defense-in-depth on top of D-09's central filter and D-12's tag-pool cleanup. Skipped to keep config surface lean; revisit only if D-09/D-12 prove insufficient.
- **Per-node `TOTAL_PATTERNS` override** — Phase 32 deferred this; still deferred. D-05 closes the "too many" claim by retest; per-node override is speculative.
- **Proactive audio prewarm hardening across ALL rhythm renderers** — D-16 explicitly limits hardening to renderers that reproduce a bug. If post-beta other audio bugs surface, a future phase rolls the prewarm hook out across the rhythm renderer set.
- **Curriculum redesign to introduce rests in Unit 1** — considered as an alternative to D-12. Out of scope for cleanup phase; a curriculum phase if anyone wants to revisit pedagogical ordering.
- **`RHYTHM_COMPLEXITY` enum cleanup** — still flagged from Phase 32 D-17. Future code-quality phase.

</deferred>

---

_Phase: 33-rhythm-issues-cleanup_
_Context gathered: 2026-05-02_
