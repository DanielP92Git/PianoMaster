# Feature Research

**Domain:** Launch prep capabilities for a COPPA-regulated children's piano education PWA
**Researched:** 2026-03-19
**Confidence:** HIGH (COPPA requirements from official FTC sources; ESLint data from live codebase scan)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must exist for the app to be considered production-ready or COPPA-compliant. Missing any of these means the app either violates regulation or cannot safely be released to real users.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hard delete Edge Function (post-grace-period) | COPPA 2025 amendments require permanent deletion after retention period; April 22, 2026 compliance deadline. Indefinite storage is now explicitly prohibited. | MEDIUM | Schema already exists: `deletion_scheduled_at` index, `account_status='suspended_deletion'` state. Need cron-triggered Edge Function using `service_role` key to call `auth.admin.deleteUser()` + cascade. Mirrors `send-daily-push` cron pattern. |
| Fix `verify:patterns` build validation script | Build-time integrity check is broken; trail has grown to 171 nodes since v1.3. Every deploy ships without validation. | LOW | Script at `scripts/verify-patterns.js` or similar. Likely a path or import change needed after node additions in v2.2/v2.4. |
| Apply pending `daily_challenges.sql` migration | `20260317000001_daily_challenges.sql` exists but has not been applied to production. Daily challenge feature in production has no DB backing. | LOW | One-time Supabase migration apply. No code changes. |
| ESLint warnings at 0 (or suppressed with rationale) | Professional codebases suppress or fix all lint issues before inviting real user traffic. 566 warnings obscure genuine bugs. | MEDIUM | Breakdown: 325 `no-undef` (test globals — vitest config gap), 180 `no-unused-vars`, 41 `react-hooks/exhaustive-deps`, 18 `react-refresh/only-export-components`. Most are mechanical fixes. |
| Structured production testing checklist | No manual QA checklist documented; games, auth flows, payment flows, and COPPA flows have never been end-to-end validated against a written spec. Required before sharing with real families. | LOW | Document-only work: auth flow, each game mode, subscription purchase + cancel, COPPA consent + deletion flow, push notifications, PWA install. |
| Legal documentation package for attorney review | COPPA fines up to $51,744 per affected child per violation. April 22, 2026 compliance deadline. Attorney review of Privacy Policy and COPPA procedures is required before real user acquisition. | LOW | Aggregation of existing artifacts: Privacy Policy page text, Terms of Service page text, data flow diagram (what is collected, where stored, retention periods), consent log schema, deletion workflow description, SDK/third-party inventory (Supabase, Brevo, Sentry, Lemon Squeezy, Umami). |

### Differentiators (Competitive Advantage)

Features beyond the minimum that would meaningfully improve production-readiness confidence.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Automated deletion cron schedule (pg_cron) | Deletion happens without manual operator intervention. No parent needs to follow up. Demonstrates COPPA good faith. | LOW | Add pg_cron entry calling `hard-delete-accounts` Edge Function daily. Mirrors existing `send-daily-push` cron. |
| Deletion confirmation email to parent | Closes the COPPA loop: parent receives proof that data was permanently destroyed. Differentiates from competitors who only promise deletion. | LOW | One Brevo email send inside the hard-delete function, using the `parent_email` already stored on the student record. |
| ESLint vitest globals fix via config (not suppression) | Fixes 325 of 566 warnings by adding `vitest/globals: true` to ESLint config — cleaner than suppressions and educates future developers. | LOW | Single line in `eslint.config.js`. No per-file changes. |
| Regression test run in production checklist | Vitest suite as part of the manual QA gate ensures no game logic regressions before user-facing testing. | LOW | Already have test files for patternBuilder and rhythmGenerator. Checklist step: `npm run test:run` must pass. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Suppress all ESLint warnings with `eslint-disable` comments | Fast way to reach 0 warnings | Masks real bugs; `react-hooks/exhaustive-deps` suppressions hide infinite loop risks; bulk suppression only works for rules set to "error" (warnings cannot be bulk-suppressed per ESLint v9.24+ docs). | Fix by category: vitest globals via config; unused vars via dead code removal; exhaustive-deps via hook restructure or `useCallback`. |
| Automated E2E testing suite (Playwright/Cypress) for production checklist | Sounds rigorous | Wrong tool for this milestone — building and maintaining E2E tests is a multi-week project. Does not address the April 22, 2026 COPPA deadline. | Manual QA checklist with documented pass/fail steps. Automated E2E is a future milestone candidate. |
| Immediate hard delete (no grace period) | Simpler implementation | Violates the existing 30-day grace period promise already communicated to users via the Privacy Policy. Grace period is COPPA-aligned (gives parents time to change their minds). | Scheduled delete: check `deletion_scheduled_at < NOW()` in the cron function. |
| Anonymize-instead-of-delete | Avoids deleting auth user | COPPA requires deletion of personal information, not just pseudonymization. FTC guidance is explicit: "delete using reasonable measures." | True hard delete of auth.users record + cascade to all public tables via existing FK ON DELETE CASCADE constraints already in schema. |
| Draft new Privacy Policy from scratch for attorney | Seems thorough | Attorney time is expensive; the policy page already exists with glassmorphism design. The attorney's job is review, not authoring. | Export existing policy page text + data flow context doc into a single PDF package for review. |

---

## Feature Dependencies

```
Hard Delete Edge Function
    └──requires──> deletion_scheduled_at field (EXISTS in students table from v1.0)
    └──requires──> service_role key pattern (EXISTS in cancel-subscription, lemon-squeezy-webhook)
    └──requires──> auth.admin.deleteUser() Supabase admin API
    └──enhances──> Deletion confirmation email to parent (same function, +1 Brevo call)

Daily pg_cron trigger
    └──requires──> Hard Delete Edge Function deployed and working
    └──mirrors──> send-daily-push cron pattern (CRON_SECRET header already established)

Legal documentation package
    └──requires──> Privacy Policy page text (EXISTS at /legal, PrivacyPolicyPage.jsx)
    └──requires──> Terms of Service page text (EXISTS at /legal, TermsOfServicePage.jsx)
    └──requires──> Data flow inventory (NEW — must be written, ~2 hours)
    └──requires──> SDK/third-party list (NEW — must be compiled)

Production testing checklist
    └──requires──> All game modes working (EXISTS)
    └──requires──> Subscription flow working (EXISTS)
    └──requires──> COPPA consent flow working (EXISTS)
    └──enhances──> Hard delete Edge Function (checklist verifies deletion end-to-end)

ESLint cleanup
    └──no code dependencies, standalone work
    └──splits into: config fix (no-undef vitest) → dead code removal (no-unused-vars)
                  → hook restructure (exhaustive-deps) → file split (react-refresh)
```

### Dependency Notes

- **Hard delete requires existing schema**: The `deletion_scheduled_at`, `deletion_requested_at`, and `account_status='suspended_deletion'` fields are already in production from v1.0. The Edge Function is the missing piece that acts on that data.
- **Legal package requires data flow doc**: The existing Privacy Policy makes claims about data collection and retention. The attorney needs the underlying technical inventory to verify those claims match implementation. This is a ~2-hour documentation task, not a code task.
- **ESLint no-undef test globals are 57% of all warnings**: Fixing the vitest config eliminates 325 of 566 warnings without touching a single source file. This should be the first ESLint task.

---

## MVP Definition

### Launch With (v2.5)

Minimum required before testing with real users and promoting the app.

- [ ] Hard delete Edge Function — COPPA legal requirement with April 22, 2026 deadline
- [ ] Fix `verify:patterns` script — prevents silent trail corruption on every deploy
- [ ] Apply `daily_challenges.sql` migration — production feature backed by schema
- [ ] ESLint warnings to 0 (or documented suppression rationale) — professional baseline
- [ ] Production testing checklist — documented manual QA pass before user acquisition
- [ ] Legal documentation package for attorney — required for COPPA compliance confidence

### Add After Validation (v2.5.x)

Features to add once the core launch-prep items are working.

- [ ] Deletion confirmation email to parent — closes COPPA audit trail; easy addition inside the hard-delete function once it exists
- [ ] Automated pg_cron schedule for hard deletes — convenience; manual trigger acceptable for initial validation

### Future Consideration (v3+)

- [ ] Automated E2E test suite (Playwright) — high value but wrong milestone scope
- [ ] COPPA Safe Harbor program enrollment — for rapid business growth; overkill for beta launch
- [ ] State-level children's privacy law review (KOSA, state AGE equivalents) — post-April 2026 when state patchwork crystallizes

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Hard delete Edge Function | HIGH (legal risk without it) | MEDIUM | P1 |
| Fix `verify:patterns` script | HIGH (integrity on every build) | LOW | P1 |
| Apply daily_challenges migration | HIGH (fixes silent production gap) | LOW | P1 |
| ESLint warnings cleanup | MEDIUM (developer safety net) | MEDIUM | P1 |
| Production testing checklist | HIGH (required before real users) | LOW | P1 |
| Legal documentation package | HIGH (required before promotion) | LOW | P1 |
| Deletion confirmation email | MEDIUM (COPPA audit trail) | LOW | P2 |
| Automated pg_cron for hard delete | LOW (manual trigger works initially) | LOW | P2 |

**Priority key:**
- P1: Must have for v2.5 launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Implementation Notes by Feature

### Hard Delete Edge Function

The function must:
1. Accept a `x-cron-secret` header (not a JWT — mirrors `send-daily-push` pattern with `verify_jwt = false` in config.toml)
2. Use `service_role` key to query `students` where `deletion_scheduled_at < NOW()` AND `account_status = 'suspended_deletion'`
3. For each student: call `auth.admin.deleteUser(studentId)` — this cascades to all `public.*` tables via `ON DELETE CASCADE` FK constraints already in schema
4. Optionally send Brevo deletion confirmation email to `parent_email` before deleting (preserve email for the send, then the delete follows)
5. Log count of processed deletions (no PII in logs — student IDs only)
6. Return `{ deleted: N, failed: N }`

Key constraint: `auth.admin.deleteUser()` requires the Supabase admin client (service role), not the anon key. The `cancel-subscription` function demonstrates the correct dual-client pattern already in use.

### ESLint Warnings Breakdown

Current 566 warnings split as:

| Rule | Count | Fix Strategy |
|------|-------|-------------|
| `no-undef` (vitest globals) | ~325 | Add `vitest/globals: true` to ESLint config's vitest environment block. Zero source file changes. |
| `no-unused-vars` | ~180 | Audit and remove dead variables. Many are stale imports from refactors. ~2 hours of mechanical work. |
| `react-hooks/exhaustive-deps` | ~41 | Case-by-case: add to dep array, extract with `useCallback`, or add suppression comment with rationale. Cannot be bulk-suppressed (it is a `warn`, not `error`). |
| `react-refresh/only-export-components` | ~18 | Move non-component exports (constants, utilities) to separate files, or add suppression comment if co-location is intentional. |

ESLint v9.24+ bulk suppressions only work for rules set to `"error"`. All 566 are currently `"warn"`, so bulk suppression does not apply. Each category must be addressed directly.

### Production Testing Checklist Scope

The checklist must cover:
- **Auth flows**: signup (student/teacher), login, logout, password reset, session timeout (30 min student, 2hr teacher), concurrent tabs
- **COPPA flows**: age gate (under/over 13 paths), parental consent email send, consent link verification, data export JSON download, deletion request (triggers 30-day grace), hard delete after grace period
- **All 4 game modes**: sight reading, notes recognition, rhythm/metronome, memory game — in both trail mode and free play; with mic and keyboard input
- **Trail system**: node unlock progression, star rating display, XP award, boss unlock 3-stage modal
- **Payment flows**: paywall display (free vs premium nodes), Lemon Squeezy checkout overlay, subscription confirmation page, cancel subscription, expired subscription fallback
- **Push notifications**: COPPA math gate, opt-in flow, push delivery, settings toggle off
- **PWA behavior**: install prompt (Android/iOS), offline fallback page, service worker cache version
- **i18n**: Hebrew RTL layout, English/Hebrew language switch, all translated strings

### Legal Documentation Package Contents

The package for attorney review should include:
1. Privacy Policy page text (export from `PrivacyPolicyPage.jsx`)
2. Terms of Service page text (export from `TermsOfServicePage.jsx`)
3. Data inventory table: data type, table where stored, purpose, retention period, who can access
4. Third-party processor list: Supabase (auth + DB — US region), Brevo (transactional email), Sentry (error monitoring — COPPA-safe, prod-only, no PII), Lemon Squeezy (payments — parents only), Umami (analytics — no personal data)
5. Parental consent flow diagram: DOB collection → under-13 detection → consent email → verification link → `consent_verified_at`
6. Deletion workflow diagram: parent request → `account_status='suspended_deletion'` → 30-day grace via `deletion_scheduled_at` → hard delete cron → confirmation email
7. COPPA directedness assessment: subject matter (piano education for 8-year-olds), target age explicitly stated, no advertising, no social features, age-neutral UI design

---

## Competitor Feature Analysis

| Feature | Duolingo Kids | Simply Piano | Our Approach |
|---------|---------------|--------------|--------------|
| COPPA hard delete | Documented in privacy policy | Not disclosed | Automated cron with audit log and confirmation email |
| Code quality gate | Not applicable (closed source) | Not applicable | Systematic ESLint cleanup by rule category |
| Legal review | Presumed (large legal team) | Presumed (large legal team) | Explicit attorney review package with technical data flow inventory |
| Production QA | Formal QA team | Formal QA team | Manual checklist with structured pass/fail across all flows |

---

## Sources

- [FTC COPPA Rule — official regulatory text](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa)
- [FTC COPPA Frequently Asked Questions](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [FTC Amends COPPA Rule — Davis Wright Tremaine, May 2025](https://www.dwt.com/blogs/privacy--security-law-blog/2025/05/coppa-rule-ftc-amended-childrens-privacy)
- [COPPA Compliance in 2025: Practical Guide for EdTech Apps](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)
- [Children's Online Privacy in 2025 — Loeb & Loeb analysis](https://www.loeb.com/en/insights/publications/2025/05/childrens-online-privacy-in-2025-the-amended-coppa-rule)
- [ESLint Bulk Suppressions — April 2025](https://eslint.org/blog/2025/04/introducing-bulk-suppressions/)
- [Supabase auth.admin.deleteUser documentation](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)
- Live ESLint scan of `src/`: 566 warnings — no-undef 325, no-unused-vars 180, react-hooks/exhaustive-deps 41, react-refresh/only-export-components 18
- Codebase audit: `supabase/migrations/20260201000001_coppa_schema.sql`, `supabase/functions/cancel-subscription/index.ts`, `supabase/functions/send-daily-push/index.ts`

---
*Feature research for: v2.5 Launch Prep — COPPA hard delete, ESLint cleanup, production testing, legal packaging*
*Researched: 2026-03-19*
