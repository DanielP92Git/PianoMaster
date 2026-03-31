# Phase 15: Verification & Deploy - Research

**Researched:** 2026-03-31
**Domain:** Daily goals service audit, deploy sequencing documentation, manual UAT checklist
**Confidence:** HIGH

## Summary

Phase 15 closes three operational loose ends. GOAL-01 requires verifying and adding regression tests for `dailyGoalsService.js`. Code inspection confirms the service already has no category filter — `calculateDailyProgress` counts all `students_score` rows from today plus all `student_skill_progress` rows with `last_practiced` today, regardless of game type. The tests do not yet exist; Wave 0 creates them. DEPLOY-01 requires a deploy sequencing document in `docs/` (a `docs/DEPLOY.md` exists but covers Lemon Squeezy webhook only — a new general deploy doc is needed). UAT-01 requires the user to run a 5-item device checklist from phase 08, all items still pending.

The test baseline as of this research run: 46/47 test files pass, 608 tests pass, 8 unhandled timer errors in `ArcadeRhythmGame.test.js` (pre-existing, unrelated to this phase).

**Primary recommendation:** Write the daily goals tests first (they require no device), then write the deploy doc, then produce the UAT checklist for the user to run on physical hardware.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Verify + add tests. Read `dailyGoalsService.js`, confirm all 5 goal types work with all 11 exercise types. Fix only if bugs are found.
- **D-02:** Always add regression tests regardless of whether bugs are found. Tests prove the service handles all game types and prevent future breakage if someone adds a category filter.
- **D-03:** Current code appears to count all game types already (no category filter in `calculateDailyProgress`). The audit should confirm this and verify edge cases (e.g., do ear training scores appear in `students_score`? Do arcade rhythm nodes appear in `student_skill_progress`?).
- **D-04:** Doc lives in `docs/` folder (alongside DESIGN_SYSTEM.md and SECURITY_GUIDELINES.md). Persistent, discoverable.
- **D-05:** Doc covers four areas: (1) deploy order (Supabase migration first, then Netlify), (2) rollback steps, (3) environment variable names only (no secret values), (4) Edge Function deploy process.
- **D-06:** Environment variables listed by name only (e.g., `CRON_SECRET`, `VAPID_PUBLIC_KEY`). No actual values in the doc.
- **D-07:** Claude creates a guided step-by-step testing checklist with exact actions and expected results. User runs it on device and reports pass/fail.
- **D-08:** Target devices: Android phone (PWA), iOS phone (Safari/PWA), Desktop browser. All 5 items tested on all applicable devices.
- **D-09:** If a UAT item fails, fix it within this phase. Don't defer failures to a future milestone.

### Claude's Discretion

- Test file naming and structure for daily goals tests
- Deploy doc formatting (markdown sections, tables, etc.)
- UAT checklist formatting and grouping by device

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                        | Research Support                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| GOAL-01   | dailyGoalsService handles all exercise types including ear training (no hardcoded category arrays) | Code confirmed: no category filter exists in `calculateDailyProgress`. Tests needed to prove this formally.              |
| DEPLOY-01 | Deploy sequencing documented -- Supabase migration runs before Netlify JS serves updated code      | `docs/DEPLOY.md` exists but is Lemon Squeezy-specific. A new `docs/DEPLOY_SEQUENCING.md` is required per D-04/D-05.      |
| UAT-01    | Phase 08 human verification items completed (5 pending: rhythm games, piano tone, PWA cache)       | All 5 items in `08-HUMAN-UAT.md` are `[pending]`. User must run on physical device. Results documented in the same file. |

</phase_requirements>

## Standard Stack

### Core

| Library                   | Version             | Purpose                      | Why Standard                                   |
| ------------------------- | ------------------- | ---------------------------- | ---------------------------------------------- |
| Vitest                    | ^3.2.4              | Unit/integration test runner | Already in project, all existing tests use it  |
| @testing-library/react    | ^16.3.0             | Component test utilities     | Already in project                             |
| @testing-library/jest-dom | (via setupTests.js) | DOM matchers                 | Already configured in `src/test/setupTests.js` |

### Supporting

| Library            | Version | Purpose                                  | When to Use           |
| ------------------ | ------- | ---------------------------------------- | --------------------- |
| Supabase CLI (npx) | 2.84.5  | Deploy Edge Functions, manage migrations | Deploy doc procedures |

**No new library installations required for this phase.** All test infrastructure is in place.

**Version verification:** Confirmed via `package.json` and `npx supabase --version`.

## Architecture Patterns

### Daily Goals Service Architecture

The service has two data paths that feed `calculateDailyProgress`:

**Path 1 — `students_score` table (non-trail games)**

```javascript
// From dailyGoalsService.js lines 253-259
const { data: todaysScores } = await supabase
  .from("students_score")
  .select("score, game_type, created_at")
  .eq("student_id", studentId)
  .gte("created_at", start)
  .lte("created_at", end);
// NO game_type filter — all game types counted
```

Games write to `students_score` via `updateStudentScore()` in `apiScores.js`. The `game_type` column stores strings like `"sight_reading"`, `"memory"`, `"rhythm"`, `"pitch_comparison"`, `"interval_id"`, etc.

**Path 2 — `student_skill_progress` table (trail games)**

```javascript
// From dailyGoalsService.js lines 265-271
const { data: todaysNodeProgress } = await supabase
  .from("student_skill_progress")
  .select("node_id, stars, exercises_completed, created_at, last_practiced")
  .eq("student_id", studentId)
  .gte("last_practiced", start)
  .lte("last_practiced", end);
// NO node category filter — all trail nodes counted
```

Trail games (including rhythm and ear training) write to `student_skill_progress` via `updateNodeProgress()` / `updateExerciseProgress()` in `skillProgressService.js`.

**exercisesCompleted aggregation (line 283):**

```javascript
const exercisesCompleted =
  (todaysScores?.length || 0) + (todaysNodeProgress?.length || 0);
```

This sums both paths. No category array. No `EXERCISE_TYPES` filter. Conclusion from code inspection: GOAL-01 is already satisfied at the implementation level — no bug exists.

### Test Pattern (established in project)

Plain Vitest service tests (no DOM needed for `dailyGoalsService.js`). Mocks for `supabase` and `authorizationUtils`. Pattern from `practiceLogService.test.js` and `skillProgressService.test.js`:

```javascript
// Standard mock pattern for supabase service tests
vi.mock("./supabase", () => ({
  default: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));
vi.mock("./authorizationUtils", () => ({
  verifyStudentDataAccess: vi.fn(),
}));

// Chainable mock builder for .from().select().eq().gte().lte()
const mockSelectChain = (resolvedValue) => {
  const lteMock = vi.fn().mockResolvedValue(resolvedValue);
  const gteMock = vi.fn().mockReturnValue({ lte: lteMock });
  const eq2Mock = vi.fn().mockReturnValue({ gte: gteMock });
  const selectMock = vi.fn().mockReturnValue({ eq: eq2Mock });
  supabase.from.mockReturnValue({ select: selectMock });
  return lteMock;
};
```

Note: `calculateDailyProgress`'s supabase call chain is `.from().select().eq().gte().lte()` — two separate calls (one for `students_score`, one for `student_skill_progress`). The mock must handle `supabase.from` being called twice with different table names. Use `mockReturnValueOnce` for the first call and `mockReturnValue` for the second, or use `mockImplementation` with a switch on the table name argument.

### Deploy Sequencing Pattern

The current `docs/DEPLOY.md` covers the Lemon Squeezy webhook function specifically. The new doc (`docs/DEPLOY_SEQUENCING.md`) covers the general deploy order. Key facts discovered:

- **Netlify build trigger:** `git push` to `main` → Netlify auto-builds via `npm run build` → serves new `dist/`
- **Supabase migrations:** Applied via Supabase dashboard SQL editor or `supabase db push` (CLI required)
- **Edge Functions:** Deployed via `npx supabase functions deploy <function-name>` (no `--no-verify-jwt` for most functions; only webhook functions need it)
- **Service worker cache:** Current version is `pianomaster-v9` in `public/sw.js`. Must be bumped if new routes/assets are added that the old cache would miss.
- **`netlify.toml` cache headers:** `/sw.js` and `*.html` are `max-age=0, must-revalidate` — clients always fetch latest service worker on next visit.

**Environment variable names** (safe to document by name):

- Netlify: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VITE_SITE_URL`, `SENTRY_DSN`, `VITE_SENTRY_DSN`
- Supabase Edge Functions (set via `supabase secrets set`): `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `BREVO_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`, `WEEKLY_REPORT_HMAC_SECRET`, `LS_SIGNING_SECRET`

### UAT Checklist Architecture

The 5 pending items from `08-HUMAN-UAT.md` are device-dependent. All require physical hardware or PWA installation. The checklist format should be:

- Grouped by test item (not device) since each item has a different scope
- Each item: exact steps + expected result + `Result on [Device]:` field for pass/fail
- PWA cache test (item 5) requires a deployment to `my-pianomaster.netlify.app` first

## Don't Hand-Roll

| Problem                | Don't Build                | Use Instead                         | Why                                             |
| ---------------------- | -------------------------- | ----------------------------------- | ----------------------------------------------- |
| Supabase mock chaining | Custom mock infrastructure | `vi.fn().mockReturnValue()` chain   | Already proven in 5 existing service tests      |
| Deploy checklist       | New tooling or scripts     | Markdown doc in `docs/`             | Human-run process; user confirmed docs/ pattern |
| UAT result tracking    | Custom tracking system     | Append results to `08-HUMAN-UAT.md` | File already exists and has correct structure   |

## Common Pitfalls

### Pitfall 1: Supabase Chain Mock Order

**What goes wrong:** `calculateDailyProgress` calls `supabase.from` twice (once for `students_score`, once for `student_skill_progress`). If the mock only stubs one call, the second returns `undefined`, causing a silent null-dereference in the test.
**Why it happens:** `vi.fn().mockReturnValue()` returns the same value for all calls; `calculateDailyProgress` needs different responses per table.
**How to avoid:** Use `supabase.from.mockImplementation((tableName) => ...)` with a conditional on `tableName`, or use `mockReturnValueOnce` twice in order.
**Warning signs:** Test passes but `exercisesCompleted` is always 0 or NaN.

### Pitfall 2: Date Range Boundary in Tests

**What goes wrong:** `getTodayDateRange()` generates ISO strings from `new Date()` at test runtime. Tests that inject mock data with timestamps near midnight may behave differently in different timezones.
**Why it happens:** The service uses local-time midnight boundaries (`new Date(year, month, day, 0, 0, 0)`), not UTC.
**How to avoid:** In tests, use timestamps well within today (e.g., current time) rather than boundary timestamps. Or mock `Date` to a fixed value with `vi.useFakeTimers`.
**Warning signs:** Tests pass locally but fail in CI at midnight or in different timezone.

### Pitfall 3: UAT Item 5 — PWA Cache Test Requires Live Deploy

**What goes wrong:** Testing PWA cache invalidation on `localhost` is not equivalent to testing on the deployed PWA at `my-pianomaster.netlify.app`.
**Why it happens:** Service worker installation, update detection, and cache eviction behave differently in development mode vs. production.
**How to avoid:** UAT checklist must clearly state "test on `https://my-pianomaster.netlify.app` installed as PWA, not localhost."
**Warning signs:** User reports test passed on localhost but the check is invalid.

### Pitfall 4: Deploy Doc Naming Collision

**What goes wrong:** A `docs/DEPLOY.md` already exists (covers Lemon Squeezy webhook). Creating another `DEPLOY.md` would overwrite it.
**Why it happens:** Both are deployment-related docs.
**How to avoid:** Name the new file `docs/DEPLOY_SEQUENCING.md` or `docs/DEPLOY_GUIDE.md`. Reference the existing `DEPLOY.md` for Lemon Squeezy specifics.

### Pitfall 5: `threeStarsEarned` test — `created_at` boundary

**What goes wrong:** The `threeStarsEarned` metric uses `created_at` (not `last_practiced`) to detect nodes first completed today. Mocks that omit `created_at` in `todaysNodeProgress` data will incorrectly show 0 three-star achievements.
**Why it happens:** The helper function `getLocalDateString(p.created_at)` will throw/NaN if `created_at` is undefined.
**How to avoid:** Always include `created_at` in mock `student_skill_progress` data in tests.

## Code Examples

Verified from `dailyGoalsService.js` source:

### calculateDailyProgress — exact query chain

```javascript
// Source: src/services/dailyGoalsService.js lines 253-271
// students_score query
const { data: todaysScores } = await supabase
  .from("students_score")
  .select("score, game_type, created_at")
  .eq("student_id", studentId)
  .gte("created_at", start)
  .lte("created_at", end);

// student_skill_progress query
const { data: todaysNodeProgress } = await supabase
  .from("student_skill_progress")
  .select("node_id, stars, exercises_completed, created_at, last_practiced")
  .eq("student_id", studentId)
  .gte("last_practiced", start)
  .lte("last_practiced", end);
```

### Mock pattern for two-table queries

```javascript
// Use mockImplementation to distinguish tables
supabase.from.mockImplementation((tableName) => {
  if (tableName === "students_score") {
    return buildChain({ data: mockScores, error: null });
  }
  if (tableName === "student_skill_progress") {
    return buildChain({ data: mockNodeProgress, error: null });
  }
});
```

### EXERCISE_TYPES reference (all 11 types)

```javascript
// Source: src/data/constants.js
export const EXERCISE_TYPES = {
  NOTE_RECOGNITION: "note_recognition",
  SIGHT_READING: "sight_reading",
  RHYTHM: "rhythm",
  MEMORY_GAME: "memory_game",
  BOSS_CHALLENGE: "boss_challenge",
  NOTE_CATCH: "note_catch",
  // v2.9 new game types
  RHYTHM_TAP: "rhythm_tap",
  RHYTHM_DICTATION: "rhythm_dictation",
  ARCADE_RHYTHM: "arcade_rhythm",
  PITCH_COMPARISON: "pitch_comparison",
  INTERVAL_ID: "interval_id",
};
```

## Environment Availability

| Dependency         | Required By                | Available | Version | Fallback      |
| ------------------ | -------------------------- | --------- | ------- | ------------- |
| Node.js            | Tests, build               | Yes       | 22.15.0 | —             |
| npm                | Test runner                | Yes       | 11.7.0  | —             |
| Vitest (npx)       | GOAL-01 tests              | Yes       | ^3.2.4  | —             |
| Supabase CLI (npx) | DEPLOY-01 doc verification | Yes       | 2.84.5  | —             |
| Android device     | UAT-01 items 1-5           | Unknown   | —       | User confirms |
| iOS device         | UAT-01 items 1-5           | Unknown   | —       | User confirms |
| Desktop browser    | UAT-01 items 1-5           | Yes       | —       | —             |

**Missing dependencies with no fallback:** None for automated tasks. UAT-01 requires physical devices — if unavailable, items must be marked as "not tested on [device]" with reason.

**Missing dependencies with fallback:** iOS device — if unavailable, items 1-4 can be tested on Android/Desktop; item 4 (piano tone / `usePianoSampler`) is most critical on iOS Safari.

## Validation Architecture

### Test Framework

| Property           | Value                                                   |
| ------------------ | ------------------------------------------------------- |
| Framework          | Vitest 3.2.4                                            |
| Config file        | `vitest.config.js` (root)                               |
| Quick run command  | `npx vitest run src/services/dailyGoalsService.test.js` |
| Full suite command | `npx vitest run`                                        |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                | Test Type   | Automated Command                                       | File Exists?              |
| --------- | ----------------------------------------------------------------------- | ----------- | ------------------------------------------------------- | ------------------------- |
| GOAL-01   | `calculateDailyProgress` counts scores from all game types              | unit        | `npx vitest run src/services/dailyGoalsService.test.js` | No — Wave 0               |
| GOAL-01   | `calculateDailyProgress` counts trail node progress from all categories | unit        | `npx vitest run src/services/dailyGoalsService.test.js` | No — Wave 0               |
| GOAL-01   | 5 goal types all calculate progress correctly                           | unit        | `npx vitest run src/services/dailyGoalsService.test.js` | No — Wave 0               |
| DEPLOY-01 | Deploy sequencing document exists and covers 4 required areas           | manual      | N/A — document review                                   | No — Wave 0               |
| UAT-01    | 5 device tests pass                                                     | manual-only | N/A — requires physical device                          | No — checklist doc Wave 0 |

**UAT-01 is manual-only** — it requires physical hardware and real network conditions. No automated test can substitute for it.

### Sampling Rate

- **Per task commit:** `npx vitest run src/services/dailyGoalsService.test.js`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/services/dailyGoalsService.test.js` — covers GOAL-01 (all 3 test behaviors above)
- [ ] `docs/DEPLOY_SEQUENCING.md` — covers DEPLOY-01 (four areas per D-05)
- [ ] UAT checklist document in `.planning/phases/15-verification-deploy/` or appended to `08-HUMAN-UAT.md` — covers UAT-01

## Open Questions

1. **Which `game_type` string do ear training games pass to `updateStudentScore`?**
   - What we know: Ear training games (`IntervalGame.jsx`, `NoteComparisonGame.jsx`) contain `switch` statements on exercise type but it's unclear if they call `updateStudentScore` directly or go through the trail path.
   - What's unclear: Do ear training non-trail sessions write to `students_score` at all, or only to `student_skill_progress`?
   - Recommendation: The audit in Task 1 should grep for `updateStudentScore` and `updateScore` calls in ear training game files to confirm. If they write to `students_score`, confirm the `game_type` string used. The service counts all rows regardless — this only affects what value appears in the `game_type` field for tests.

2. **Service worker cache version bump needed?**
   - What we know: Current version is `pianomaster-v9`. The phase adds no new routes or assets.
   - What's unclear: Whether the UAT item 5 test requires bumping from v9 to v10 to create a testable cache invalidation event.
   - Recommendation: Only bump if a deliberate cache-busting deploy is needed for UAT. The planner should decide if a test deploy increment is warranted.

## Sources

### Primary (HIGH confidence)

- Direct code inspection: `src/services/dailyGoalsService.js` — full source read, logic confirmed
- Direct code inspection: `src/data/constants.js` — EXERCISE_TYPES enum confirmed (11 types)
- Direct code inspection: `src/services/apiScores.js` — students_score insert confirmed, no game_type filter
- Direct code inspection: `public/sw.js` — cache version `pianomaster-v9` confirmed
- Direct code inspection: `netlify.toml` — cache headers confirmed
- Direct code inspection: `docs/DEPLOY.md` — existing LS-specific deploy doc confirmed
- Test run: `npx vitest run` — 608 pass, 8 pre-existing errors in ArcadeRhythmGame.test.js
- `npx supabase --version` — 2.84.5 available

### Secondary (MEDIUM confidence)

- Code inspection of `src/services/skillProgressService.test.js` and `practiceLogService.test.js` — established mock patterns

### Tertiary (LOW confidence)

- None

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all verified from package.json and existing test files
- Architecture: HIGH — all from direct code inspection of production source files
- Pitfalls: HIGH for items 1-4 (derived from code structure), MEDIUM for item 5 (date boundary is hypothetical)

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable codebase; no fast-moving dependencies in this phase)
