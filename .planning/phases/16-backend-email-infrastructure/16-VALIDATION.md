---
phase: 16
slug: backend-email-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` (regression check — no Edge Function unit tests)
- **After every plan wave:** Run `npx vitest run` + manual smoke tests for deployed functions
- **Before `/gsd:verify-work`:** Full suite must be green + all manual smoke tests passing
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | BACK-01 | manual smoke | `curl -X POST ... send-feedback` with valid JWT + body → email arrives | N/A (Edge Fn) | ⬜ pending |
| 16-01-02 | 01 | 1 | SPAM-01 | manual smoke | `curl -X POST ... send-feedback` with no JWT → 401 | N/A (Edge Fn) | ⬜ pending |
| 16-01-03 | 01 | 1 | SPAM-04 | manual smoke | POST with message < 10 chars → 400 | N/A (Edge Fn) | ⬜ pending |
| 16-01-04 | 01 | 1 | SPAM-04 | manual smoke | POST with invalid type enum → 400 | N/A (Edge Fn) | ⬜ pending |
| 16-01-05 | 01 | 1 | SPAM-02 | manual smoke | 4 successive POSTs → 4th returns 429 | N/A (Edge Fn) | ⬜ pending |
| 16-01-06 | 01 | 1 | BACK-02 | manual smoke | Inspect email body: type, message, student prefix, version, timestamp | N/A (Edge Fn) | ⬜ pending |
| 16-02-01 | 02 | 2 | MAIL-01 | manual check | Brevo dashboard → senders list shows new Gmail verified | N/A (config) | ⬜ pending |
| 16-02-02 | 02 | 2 | MAIL-02 | manual smoke | Trigger consent email → arrives from new sender | N/A (integration) | ⬜ pending |
| 16-02-03 | 02 | 2 | MAIL-02 | manual smoke | Trigger weekly report → arrives from new sender | N/A (integration) | ⬜ pending |
| 16-03-01 | 03 | 1 | N/A | automated | `npx vitest run` → no regressions from `__APP_VERSION__` define | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

Edge Functions in this project are validated via manual curl smoke tests — no automated Edge Function test infrastructure exists or is needed. The Vitest suite covers client-side regression only.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Valid POST delivers email | BACK-01 | Edge Function runs on Supabase infra, not local test env | Deploy function → `curl -X POST` with valid JWT and body → check Gmail inbox |
| Unauthenticated POST rejected | SPAM-01 | JWT validation by Supabase gateway | `curl -X POST` without Authorization header → expect 401 |
| Input validation rejects bad data | SPAM-04 | Edge Function validation logic | POST with short message (<10 chars) → 400; POST with invalid type → 400 |
| Rate limit enforced at 3/hour | SPAM-02 | Requires real DB state across multiple requests | 4 successive POSTs with valid JWT → 4th returns 429 |
| Email body format correct | BACK-02 | Visual inspection of email content | Check email contains: type tag, message, student prefix (8 chars), version, UTC timestamp |
| Brevo sender updated | MAIL-01 | External service configuration | Brevo dashboard → Senders → new Gmail address shows "verified" |
| Existing emails use new sender | MAIL-02 | Cross-function integration | Trigger consent email + weekly report → both arrive from new Gmail |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
