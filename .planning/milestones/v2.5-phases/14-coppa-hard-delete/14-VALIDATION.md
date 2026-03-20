---
phase: 14
slug: coppa-hard-delete
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (globals: true) — but Edge Functions are Deno-runtime, not testable with Vitest |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run src/services/accountDeletionService.test.js` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Dry-run mode against seeded test account
- **After every plan wave:** Full dry-run + live test against dedicated test account
- **Before `/gsd:verify-work`:** All 5 success criteria from phase definition must pass
- **Max feedback latency:** N/A — manual verification via Supabase dashboard

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | DEL-01 | manual (dry-run) | N/A — Edge Function | N/A | ⬜ pending |
| 14-01-02 | 01 | 1 | DEL-02 | manual (live mode + DB inspect) | N/A | N/A | ⬜ pending |
| 14-01-03 | 01 | 1 | DEL-03 | manual (attempt login after deletion) | N/A | N/A | ⬜ pending |
| 14-01-04 | 01 | 1 | DEL-04 | manual (check LS dashboard) | N/A | N/A | ⬜ pending |
| 14-01-05 | 01 | 1 | DEL-05 | manual (check Brevo sent log) | N/A | N/A | ⬜ pending |
| 14-01-06 | 01 | 1 | DEL-06 | manual (DB inspect after deletion) | N/A | N/A | ⬜ pending |
| 14-01-07 | 01 | 1 | DEL-07 | manual (run function twice) | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test account setup: Create a student row with `account_status = 'suspended_deletion'` and `deletion_scheduled_at` in the past (seeded manually in Supabase)
- [ ] Verify `AUDIT_HMAC_SECRET` is defined in Supabase Vault before Edge Function deployment
- [ ] Confirm FK cascade type for `parent_subscriptions` via: `SELECT conname, confdeltype FROM pg_constraint WHERE confrelid = 'students'::regclass`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Eligible accounts query returns accounts past grace period | DEL-01 | Edge Function (Deno runtime) — cannot unit test with Vitest | Call function with `?dry_run=true`, verify logs show correct accounts |
| All student data rows removed | DEL-02 | Destructive operation on real DB | Run live mode, inspect all 13 tables for student_id absence |
| auth.users entry deleted | DEL-03 | Requires Supabase Admin API | Attempt login with deleted user's credentials — must fail |
| LS subscription cancelled | DEL-04 | External API side-effect | Check Lemon Squeezy dashboard for cancelled status |
| Parent confirmation email sent | DEL-05 | External email service | Check Brevo activity log for sent email |
| push_subscriptions + parent_subscriptions deleted | DEL-06 | Subset of DEL-02 check | Query specific tables after deletion |
| Idempotent re-run | DEL-07 | Must verify no errors on second invocation | Run function twice on same deleted account, check logs |

---

## Validation Sign-Off

- [ ] All tasks have manual verification via dry-run/live test instructions
- [ ] Sampling continuity: dry-run after each code change, live test per wave
- [ ] Wave 0 covers all pre-requisites (test account, env vars, FK verification)
- [ ] No watch-mode flags
- [ ] Feedback latency: manual — within minutes via Supabase dashboard
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
