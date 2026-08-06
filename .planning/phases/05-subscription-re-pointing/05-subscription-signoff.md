<!--
Migration:   20260805120000_add_parent_subscriptions_parent_id (Phase 5, v4.0)
Date:        2026-08-05
Description: Authoritative D-11 per-row before/after sign-off table for the parent_subscriptions
             parent_id backfill. Plan 05-02's backfill UPDATE (and its verification) is written
             FROM this file. The "Before backfill" table below is captured from live production
             data pre-migration; the "After backfill" table is populated post-migration in plan 05-09.
Predecessor: .planning/phases/01-identity-schema-expand/01-fk-checklist.md (sign-off doc format precedent)
Generated:   LIVE query (Q5) against production project hdltcvgqrtxuxgjdvzzu, Task 2 of plan 05-01
Total:       9
-->

# 05 — Subscription Sign-off (D-11)

**Live run:** project `hdltcvgqrtxuxgjdvzzu` · **9 rows** in `parent_subscriptions`.

> **SC-2 correction:** the plan's original acceptance criteria assumed "3 live subscriptions." The
> real count is 9. The owner reviewed the full per-row data (redacted emails below; full addresses
> were shown only in the uncommitted SQL Editor session) and made an explicit, recorded decision to
> scope this sign-off to **all 9 rows**, not just a subset presumed "live" — see
> `05-discovery.md` §2 for the full anomaly explanation (7 rows are the owner's own dev/test account
> from repeated manual checkout testing; 2 rows are manually-inserted out-of-band grants with
> non-numeric `ls_subscription_id` values that no real Lemon Squeezy webhook could produce). This is
> a more conservative scope than the plan's original assumption, not a less conservative one — every
> row in the table gets an owner-visible sign-off line before plan 05-02's backfill runs.

**PII rule (CLAUDE.md COPPA/GDPR-K minimization):** emails below are written in the same redacted
form the webhook already uses for logs — first character, then `***@domain` (e.g. `d***@gmail.com`).
The `ls_subscription_id` and `would_resolve_to_parent_id` UUIDs are the actual per-row identity keys
and are recorded in full; the `emails_match` column records the owner's `yes`/`no` comparison of the
two full addresses in the (never-committed) SQL Editor output.

## Before backfill

| ls_subscription_id | legacy_student_id | would_resolve_to_parent_id | resolve_probe | ls_parent_email (redacted) | auth_email_of_resolved_parent (redacted) | emails_match | status | current_period_end |
|---|---|---|---|---|---|---|---|---|
| 1924312 | 1f569340-c919-438c-b61c-246d7c3b4cac | 1f569340-c919-438c-b61c-246d7c3b4cac | probe1_parents | p***@gmail.com | d***@gmail.com | no | expired | 2026-04-02 09:42:33+00 |
| 1922957 | 1f569340-c919-438c-b61c-246d7c3b4cac | 1f569340-c919-438c-b61c-246d7c3b4cac | probe1_parents | p***@gmail.com | d***@gmail.com | no | expired | 2026-05-01 21:36:11+00 |
| 1924274 | 1f569340-c919-438c-b61c-246d7c3b4cac | 1f569340-c919-438c-b61c-246d7c3b4cac | probe1_parents | d***@gmail.com | d***@gmail.com | yes | expired | 2026-05-02 09:30:15+00 |
| 2027679 | 1f569340-c919-438c-b61c-246d7c3b4cac | 1f569340-c919-438c-b61c-246d7c3b4cac | probe1_parents | p***@gmail.com | d***@gmail.com | no | expired | 2026-07-03 21:57:22+00 |
| 2027684 | 1f569340-c919-438c-b61c-246d7c3b4cac | 1f569340-c919-438c-b61c-246d7c3b4cac | probe1_parents | p***@gmail.com | d***@gmail.com | no | expired | 2026-07-03 22:00:44+00 |
| 2027720 | 1f569340-c919-438c-b61c-246d7c3b4cac | 1f569340-c919-438c-b61c-246d7c3b4cac | probe1_parents | p***@gmail.com | d***@gmail.com | no | expired | 2026-07-03 22:18:15+00 |
| 1980417 | 1f569340-c919-438c-b61c-246d7c3b4cac | 1f569340-c919-438c-b61c-246d7c3b4cac | probe1_parents | p***@gmail.com | d***@gmail.com | no | expired | 2026-06-19 13:28:52+00 |
| uat-bypass-8650dc76-90f5-48d9-a7c0-aa18542b30d4 | 8650dc76-90f5-48d9-a7c0-aa18542b30d4 | 8650dc76-90f5-48d9-a7c0-aa18542b30d4 | probe1_parents | (null) | d***@gmail.com | n/a (null ls_parent_email) | on_trial | 2026-05-10 17:32:06.296796+00 |
| comp_e79437b8-dcf1-434d-9077-d8fa51223e26 | e79437b8-dcf1-434d-9077-d8fa51223e26 | e79437b8-dcf1-434d-9077-d8fa51223e26 | probe1_parents | h***@gmail.com | h***@gmail.com | yes | active | 2999-12-31 00:00:00+00 |

Every row resolved via `probe1_parents` with a non-null `would_resolve_to_parent_id` — zero
resolve-chain failures. No blocker per the plan's stop condition.

## After backfill

| ls_subscription_id | legacy_student_id | would_resolve_to_parent_id | resolve_probe | ls_parent_email (redacted) | auth_email_of_resolved_parent (redacted) | emails_match | status | current_period_end |
|---|---|---|---|---|---|---|---|---|

*(populated in plan 05-09, after the backfill migration actually runs)*

## OWNER SIGN-OFF

Per-row sign-off — checked in plan 05-09 once the backfill has actually been applied and the "After
backfill" table above is populated and diffed against "Before backfill":

- [ ] `1924312`
- [ ] `1922957`
- [ ] `1924274`
- [ ] `2027679`
- [ ] `2027684`
- [ ] `2027720`
- [ ] `1980417`
- [ ] `uat-bypass-8650dc76-90f5-48d9-a7c0-aa18542b30d4`
- [ ] `comp_e79437b8-dcf1-434d-9077-d8fa51223e26`

**Signed:**
**Date:**
