# Project Research Summary

**Project:** PianoApp2 — v2.5 Launch Prep
**Domain:** COPPA-regulated children's piano education PWA (launch readiness)
**Researched:** 2026-03-19
**Confidence:** HIGH

## Executive Summary

PianoApp2 is a mature, feature-complete piano learning PWA entering its pre-launch validation phase. The v2.5 milestone is not about building new user-facing capabilities — it is about achieving legal compliance, production safety, and code quality standards required before acquiring real users. The most urgent driver is the COPPA 2025 amendments with an April 22, 2026 compliance deadline: the app must permanently delete child data after its 30-day grace period, and all three compliance mechanisms (hard delete Edge Function, attorney-reviewed legal docs, and a tested consent-to-deletion flow) must be in place before promotion to real families.

The recommended approach is sequential and risk-ordered. All infrastructure to support hard deletion already exists in production: the `deletion_scheduled_at` field, `account_status` states, service_role patterns, and ON DELETE CASCADE constraints are in the schema. What is missing is the cron-triggered Edge Function that acts on them. This function should be built first, validated with a dry-run mode, and verified against a production-equivalent test account before the cron schedule is enabled. The ESLint cleanup (574 warnings) and build tooling fixes (`verify:patterns`) are parallel-safe work that require no new knowledge and can proceed independently.

The principal risks are not technical complexity — they are COPPA timing and silent data integrity failures. Deleting a student row without removing the corresponding `auth.users` entry leaves valid login credentials behind. Failing to cancel the Lemon Squeezy subscription before the DB delete creates an orphan billing record that charges a parent for a deleted account. ESLint bulk-fixing `react-hooks/exhaustive-deps` without individual review risks introducing infinite render loops in audio-heavy game components. All three risks are fully mitigated by the phase sequencing and pre-implementation checklists documented in the research.

## Key Findings

### Recommended Stack

The v2.5 milestone requires zero new runtime dependencies. All four feature areas (hard delete, ESLint cleanup, production QA, legal docs) map to existing infrastructure with configuration changes, one import path fix, a new Edge Function (Deno/TypeScript following the established codebase pattern), and documentation authoring.

**Core technologies (all existing — zero new dependencies):**
- `@supabase/supabase-js@2` (via esm.sh in Edge Functions): Admin client for hard delete — identical pattern to `cancel-subscription` and `lemon-squeezy-webhook`, already in production
- `Deno.serve()` + service_role key: Hard delete function authorization model — `verify_jwt = false` in config.toml, `x-cron-secret` header, same as `send-daily-push`
- ESLint 9.9.1 flat config globals layering: Vitest globals for test files and node globals for config files — eliminates ~330 of 574 warnings via one config change, zero source file changes required

**Critical version note:** `globals.vitest` named set may not exist in the installed `globals` package version. Declare each vitest global explicitly (`vi`, `expect`, `describe`, `it`, `test`, `beforeEach`, `afterEach`, etc.) rather than relying on a named spread.

### Expected Features

**Must have (table stakes — v2.5 launch blockers):**
- Hard delete Edge Function — COPPA legal requirement, April 22, 2026 deadline; schema already exists, function is the missing piece
- Fix `verify:patterns` build validation script — one-line import extension fix; restores integrity checking on every deploy
- Apply `daily_challenges.sql` migration — production feature (`DailyChallengeCard`) silently returning empty data without its DB table
- ESLint warnings to 0 (or documented suppression rationale) — 574 warnings obscure genuine bugs before real-user traffic
- Production testing checklist — no manual QA spec exists; COPPA flows, payment flows, and all game modes require explicit pass/fail documentation
- Legal documentation package for attorney review — required before promoting to real families

**Should have (add after core launch items validated):**
- Deletion confirmation email to parent — closes the COPPA audit trail; a single Brevo call inside the hard-delete function once it exists
- Automated pg_cron schedule for hard deletes — manual trigger acceptable for initial validation; automate immediately afterward

**Defer (v3+):**
- Automated E2E test suite (Playwright/Cypress) — high value but wrong scope for this milestone; manual checklist is sufficient
- COPPA Safe Harbor program enrollment — overkill for beta launch
- State-level children's privacy law review (KOSA, state AGE equivalents) — wait for post-April 2026 regulatory crystallization

### Architecture Approach

The v2.5 architecture is additive: one new Edge Function (`hard-delete-accounts`) plus configuration, a one-line import fix, and documentation. The existing three-layer deletion pattern must be followed precisely. Storage files have no Postgres FK and must be deleted explicitly. The `students` row deletion triggers ON DELETE CASCADE for all verified child tables. Then `auth.admin.deleteUser()` must be called explicitly via the Admin API — there is no cascade from `students` to `auth.users`. The `parent_subscriptions` FK cascade status is unconfirmed in local migration files and requires a one-time SQL Editor audit before the function is written.

**Major components and their v2.5 change status:**
1. `supabase/functions/hard-delete-accounts/index.ts` (NEW) — cron-triggered, service_role, three-layer deletion, dry-run mode, returns `{ deleted, failed }`
2. `supabase/config.toml` (MODIFIED) — add `[functions.hard-delete-accounts]` block with `verify_jwt = false`
3. `eslint.config.js` (MODIFIED) — add test file globals override block + node globals override block for config files
4. `src/components/games/sight-reading-game/utils/keySignatureUtils.js` (MODIFIED) — add `.js` extension to `keySignatureConfig` import on line 1
5. `supabase/migrations/20260317000001_daily_challenges.sql` (APPLY to remote) — manual verification of table/RLS state before applying via `supabase db push`

### Critical Pitfalls

1. **Hard delete misses auth.users — student row deleted but login still works** — The `students` CASCADE does not reach `auth.users`. Prevention: explicit `supabase.auth.admin.deleteUser(studentId)` with a service-role admin client as the final step in every deletion loop iteration; wrap in try/catch and log failures rather than skipping.

2. **parent_subscriptions orphan after delete — parent continues to be billed** — FK cascade from `parent_subscriptions` to `students` is unconfirmed; if absent, billing persists for deleted accounts. Prevention: audit `pg_constraint` before coding; cancel Lemon Squeezy subscription via API before the DB delete if `ls_subscription_id` exists; read and store `parent_email` before any row deletion for the confirmation email.

3. **Grace-period accounts deleted early — COPPA violation** — misconfigured cron timing could match accounts still inside their 30-day window. Prevention: add 1-hour buffer (`deletion_scheduled_at < NOW() - INTERVAL '1 hour'`), `LIMIT 50` batch cap, and implement a dry-run mode before enabling live deletion.

4. **exhaustive-deps bulk fix creates infinite render loops** — audio-heavy game components (`SightReadingGame.jsx`, `NotesRecognitionGame.jsx`) have intentionally omitted hook deps. Prevention: process `exhaustive-deps` warnings one file at a time, never in bulk; use `eslint-disable-next-line` with a written rationale comment for intentional omissions; profile with React DevTools after each fix.

5. **daily_challenges migration partial state — table exists without RLS** — migration lacks `IF NOT EXISTS` guards; if table was manually created in dev, `supabase db push` may record the migration as applied while RLS and the index were never created. Prevention: run `SELECT to_regclass('public.student_daily_challenges')` and check `relrowsecurity` before applying; apply only missing statements if partial state is detected.

## Implications for Roadmap

Based on combined research, dependency analysis, and risk ordering, five phases are suggested:

### Phase 1: DB Migration and Build Tooling Fixes
**Rationale:** Zero-risk, isolated fixes with no dependencies on other phases. Applying the migration validates the production DB state before it is assumed correct in the QA checklist. Fixing `verify:patterns` restores build integrity checking for all subsequent work. These should be done first to establish a clean baseline.
**Delivers:** `student_daily_challenges` table live in production with RLS confirmed; `npm run verify:patterns` exits 0; both `verify:patterns` and `npm run build` confirmed passing together.
**Addresses:** "Fix verify:patterns script" and "Apply daily_challenges migration" from the must-have list.
**Avoids:** Pitfall 8 (verify:patterns fix breaking Vite) — by running both scripts together to confirm before proceeding. Pitfall 6 (migration partial state) — by pre-checking table existence and RLS status before applying.
**Research flag:** Standard patterns — no research-phase needed.

### Phase 2: ESLint Warnings Cleanup
**Rationale:** Cleaning lint before hard delete work prevents the risk of accidentally removing unused-looking variables in auth or security service files during a high-stakes compliance phase. The config-only fix that eliminates ~330 warnings should be committed independently before any source file changes. Separating the four warning categories into distinct passes (config fix → unused vars → hook deps → react-refresh) limits blast radius and allows per-batch test verification.
**Delivers:** 0 ESLint warnings; `npm run test:run` passing after every batch; `npm run build` passing at completion of all passes.
**Addresses:** "ESLint warnings to 0" from the must-have list.
**Avoids:** Pitfall 4 (infinite render from exhaustive-deps bulk fix) — by processing exhaustive-deps last and one file at a time. Pitfall 5 (import removed as unused-var) — by distinguishing import-level vs. local-variable warnings and running test suite after each batch.
**Research flag:** Standard patterns — ESLint flat config globals approach is well-documented. No research-phase needed.

### Phase 3: Hard Delete Edge Function
**Rationale:** This is the highest-consequence deliverable with a hard legal deadline. It must be built after the DB migration is confirmed (Phase 1 validates the Supabase connection patterns used here). It must be thoroughly validated with a dry-run mode before the cron schedule is enabled. The pre-implementation `parent_subscriptions` FK audit is a required first step and may surface a migration requirement.
**Delivers:** `supabase/functions/hard-delete-accounts` deployed; dry-run mode confirmed against a test account with `deletion_scheduled_at` set to past; three-layer deletion verified (storage, CASCADE, auth.users absent); deletion confirmation email sent to parent via Brevo; pg_cron schedule active at 02:00 UTC; `STUDENT_DATA_TABLES` in `dataExportService.js` audited and updated.
**Addresses:** "Hard delete Edge Function" and "Deletion confirmation email to parent" from the feature list.
**Avoids:** Pitfall 1 (auth.users not deleted), Pitfall 2 (parent_subscriptions orphan), Pitfall 3 (grace-period deletion) — addressed by three-layer sequence, pre-implementation FK audit, 1-hour query buffer, batch cap, and dry-run mode.
**Research flag:** Patterns are well-established in this codebase (`cancel-subscription`, `send-daily-push`). No research-phase needed for implementation approach. The `parent_subscriptions` FK cascade audit is a one-time SQL query, not a research task.

### Phase 4: Production Testing Checklist
**Rationale:** The QA checklist validates all preceding phases plus all existing features against a documented pass/fail spec. It must come after hard delete is deployed so the full COPPA deletion flow (request → grace → hard delete → confirmation email) can be tested end-to-end. This phase is documentation and manual testing execution, not code.
**Delivers:** Signed-off QA checklist covering all auth flows, 4 game modes (trail + free play, keyboard + mic), payment flows (paywall, checkout, cancel, webhook, subscription gate enforcement), COPPA flows (consent email, verification, deletion request, cancel-within-grace, hard delete, confirmation email), push notifications (COPPA math gate, opt-in, delivery, toggle off), PWA install, i18n (EN/HE RTL), and accessibility.
**Addresses:** "Production testing checklist" from the must-have list. Explicitly includes all 6 COPPA sub-scenarios as non-optional checklist items.
**Avoids:** Pitfall 7 (COPPA flows untested) — COPPA scenarios are first-class checklist items with dedicated test email address for Brevo delivery verification.
**Research flag:** Standard — no research-phase needed. Requires a dedicated test email address (e.g., a Gmail alias with `+coppa-test`) and patience for timed state transitions (test `deletion_scheduled_at` set manually to a past timestamp).

### Phase 5: Legal Documentation Package
**Rationale:** Comes last because it should reference the completed and QA-tested deletion flow, not just the privacy policy text. The attorney needs to review both the document content and confirmation that the consent and deletion flows work as described. The QA results from Phase 4 (COPPA scenario pass/fail) should accompany the legal package.
**Delivers:** PDF-exportable privacy policy and terms of service; data inventory table (data type, table, purpose, retention period, access); third-party processor list (Supabase, Brevo, Sentry, Lemon Squeezy, Umami); parental consent flow diagram; deletion workflow diagram (including the new hard delete step); COPPA directedness assessment; QA results from Phase 4 COPPA scenarios attached as evidence.
**Addresses:** "Legal documentation package for attorney review" from the must-have list.
**Avoids:** The security mistake of the attorney receiving draft policy text without reviewing actual consent flow behavior — both artifacts are delivered together with QA evidence.
**Research flag:** No research-phase needed. Documentation authoring and browser print-to-PDF for policy pages — estimated 2-3 hours of writing.

### Phase Ordering Rationale

- Phase 1 before Phase 3: Production DB state must be confirmed before the hard delete pre-implementation schema audit is meaningful. Phase 1 also restores build validation that makes subsequent development safer.
- Phase 2 before Phase 3: ESLint cleanup touching auth and security service files during a high-stakes COPPA compliance phase creates unnecessary risk of accidental regressions. Clean codebase first, then add the critical function.
- Phase 3 before Phase 4: The QA checklist must include the full COPPA deletion flow. Testing before the hard delete function exists leaves the most legally consequential flow untested.
- Phase 4 before Phase 5: The attorney receives QA evidence alongside the policy text. Running the QA before documentation ensures the two artifacts are consistent and the attorney is not approving text that describes an untested flow.

### Research Flags

All five phases use standard, well-documented patterns. No phases require `/gsd:research-phase` during planning.

Phases with standard patterns (skip research-phase):
- **Phase 1:** DB migration pre-check queries are standard SQL introspection; one-line import fix is unambiguous.
- **Phase 2:** ESLint flat config globals layering is the canonical ESLint v9 pattern; confirmed against installed version 9.9.1.
- **Phase 3:** Edge Function pattern is a direct extension of two existing functions in the codebase. The `parent_subscriptions` FK audit is a SQL query, not a research task.
- **Phase 4:** Manual QA checklist — no tooling research needed. COPPA flow testing requirements are fully specified in PITFALLS.md Pitfall 7.
- **Phase 5:** Legal documentation is authoring and export — no tooling research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All claims verified against installed packages and live `npm run lint` output (2026-03-19); zero new dependencies confirmed by direct inspection |
| Features | HIGH | COPPA requirements sourced from official FTC regulatory text and 2025 amended rule analysis; feature list verified against live codebase audit |
| Architecture | HIGH | All integration points confirmed via direct codebase inspection; migration files, Edge Function patterns, import chains, and CASCADE relationships all read directly from source |
| Pitfalls | HIGH | Direct codebase review: `accountDeletionService.js`, `dataExportService.js`, `upsertSubscription.ts`, and live ESLint output all inspected; pitfalls are confirmed gaps in existing code, not theoretical risks |

**Overall confidence:** HIGH

### Gaps to Address

- **parent_subscriptions FK cascade status (Phase 3 prerequisite):** Not confirmed in local migration files. Resolution: run `SELECT conname, confdeltype FROM pg_constraint WHERE confrelid = 'students'::regclass` in the Supabase SQL Editor before Phase 3 coding begins. If no CASCADE, a new migration adding it (or explicit delete before the `students` row delete) is required.

- **STUDENT_DATA_TABLES completeness (Phase 3):** `dataExportService.js` does not include `parent_subscriptions` or `push_subscriptions`. These must be added as part of Phase 3 (COPPA audit scope), not deferred to Phase 5. This affects both the data export right-to-access flow and the deletion scope documentation.

- **Brevo confirmation email before delete ordering (Phase 3):** Parent email must be read from `parent_subscriptions` and stored in a local variable before any row deletion begins. The deletion sequence must: (1) fetch and store `parent_email`, (2) delete storage, (3) delete `parent_subscriptions` if no CASCADE, (4) delete `students` row, (5) delete `auth.users`, (6) send Brevo confirmation. This ordering must be explicit in the Phase 3 plan.

- **daily_challenges migration idempotency (Phase 1):** Current migration lacks `IF NOT EXISTS` guards. If the table already exists in production from manual SQL Editor use, the migration will error. The pre-check query is mandatory before attempting `supabase db push`.

## Sources

### Primary (HIGH confidence)
- `C:/Development/PianoApp2/package.json` — installed versions; zero new dependencies confirmed
- `npm run lint` output (2026-03-19) — 574 warnings: no-undef 330, no-unused-vars 183, exhaustive-deps 41, react-refresh 18
- `supabase/functions/cancel-subscription/index.ts` — service_role pattern and CORS structure reference
- `supabase/functions/send-daily-push/index.ts` — cron secret pattern, pg_cron schedule pattern
- `supabase/migrations/20260201000001_coppa_schema.sql` — CASCADE audit baseline, deletion state machine
- `supabase/migrations/20260317000001_daily_challenges.sql` — no IF NOT EXISTS guards confirmed
- `src/services/accountDeletionService.js` — two-step hard delete intent documented in code comments
- `src/services/dataExportService.js` — STUDENT_DATA_TABLES completeness gap confirmed
- `src/components/games/sight-reading-game/utils/keySignatureUtils.js` — bare import on line 1 confirmed as root cause of verify:patterns failure
- `eslint.config.js` — no test environment globals confirmed as root cause of ~330 no-undef warnings
- `npm run verify:patterns` output — exact error message and import chain confirmed

### Secondary (MEDIUM confidence)
- [FTC COPPA Rule — official regulatory text](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa)
- [FTC Amends COPPA Rule — Davis Wright Tremaine, May 2025](https://www.dwt.com/blogs/privacy--security-law-blog/2025/05/coppa-rule-ftc-amended-childrens-privacy)
- [Children's Online Privacy in 2025 — Loeb & Loeb analysis](https://www.loeb.com/en/insights/publications/2025/05/childrens-online-privacy-in-2025-the-amended-coppa-rule)
- [COPPA Compliance in 2025 — Practical Guide for EdTech Apps](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)
- [ESLint Bulk Suppressions — April 2025](https://eslint.org/blog/2025/04/introducing-bulk-suppressions/) — confirms bulk suppression only applies to "error" rules, not "warn"
- [Supabase auth.admin.deleteUser documentation](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)

---
*Research completed: 2026-03-19*
*Ready for roadmap: yes*
