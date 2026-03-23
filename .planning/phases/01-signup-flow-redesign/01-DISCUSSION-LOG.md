# Phase 1: Signup Flow Redesign - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 01-signup-flow-redesign
**Areas discussed:** Step sequence & layout, Parent email purpose, Google OAuth placement, DB/consent cleanup

---

## Step Sequence & Layout

### Q1: How should the signup steps be organized?

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-step wizard | Separate screens: Role -> Birth Year (students) -> Parent Email (under-13) -> Credentials. Progress dots. Back buttons. | :heavy_check_mark: |
| Compact 2-step | Role selection, then everything else on one form. | |
| Single page | Everything on one scrollable page with no transitions. | |

**User's choice:** Multi-step wizard
**Notes:** Preview mockup selected showing 4-step flow with conditional steps for student/teacher paths.

### Q2: Should there be a visual progress indicator?

| Option | Description | Selected |
|--------|-------------|----------|
| Step dots | Small dots at top showing current step. Minimal. Steps vary by path. | :heavy_check_mark: |
| Numbered stepper bar | Horizontal bar with step numbers and labels. More explicit. | |
| No indicator | Just content with back/continue buttons. | |

**User's choice:** Step dots
**Notes:** None

### Q3: Teacher path — skip to credentials?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, skip to credentials | Teacher: Role -> Credentials directly. Fast path. | :heavy_check_mark: |
| Ask birth year but skip parent email | Teacher still provides birth year for analytics. | |

**User's choice:** Yes, skip to credentials
**Notes:** None

---

## Parent Email Purpose

### Q1: What happens with consent email flow?

| Option | Description | Selected |
|--------|-------------|----------|
| Remove consent email entirely | No verification email. Parent email for weekly reports/notifications only. Consent infrastructure becomes dead code. | :heavy_check_mark: |
| Keep consent email but non-blocking | Still send consent email, account active regardless. Could unlock future features. | |
| Replace with welcome email | Simple info email to parent, no token/verification. | |

**User's choice:** Remove consent email entirely
**Notes:** None

### Q2: Messaging for optional parent email step?

| Option | Description | Selected |
|--------|-------------|----------|
| Progress reports focus | "Want progress updates sent to a parent?" | |
| Safety/trust focus | "Add a parent or guardian email" with learning journey framing. | |
| Minimal | Just "Parent/Guardian Email (optional)" with no explanation. | |
| You decide | Claude picks best copy during implementation. | :heavy_check_mark: |

**User's choice:** You decide
**Notes:** None

---

## Google OAuth Placement

### Q1: Where should Google OAuth button appear?

| Option | Description | Selected |
|--------|-------------|----------|
| On credentials step | Google button on Step 4 alongside email/password form. Current pattern. Role known from Step 1. | :heavy_check_mark: |
| Dedicated screen after role | Choice screen: "Google" or "Email" before continuing wizard. | |
| On both role and credentials | Google button on role step AND credentials step. | |

**User's choice:** On credentials step
**Notes:** Preview mockup selected.

### Q2: Birth year for Google OAuth students?

| Option | Description | Selected |
|--------|-------------|----------|
| Collect before OAuth redirect | Student goes through birth year step before seeing Google button. | |
| Collect after OAuth callback | Post-OAuth, show birth year screen before dashboard. | |
| Skip for OAuth users | Don't collect, treat as 13+ by default. | |

**User's choice:** You decide
**Notes:** User deferred to Claude's discretion.

---

## DB/Consent Cleanup

### Q1: How to handle date_of_birth with year-only?

| Option | Description | Selected |
|--------|-------------|----------|
| Store as Jan 1 of birth year | Keep DATE column, store '2018-01-01'. is_under_13 trigger works. No migration. | :heavy_check_mark: |
| Add birth_year INTEGER column | New column, migrate data, update trigger. More accurate. | |
| Repurpose date_of_birth | Same as option 1 but update column comment. | |

**User's choice:** Store as Jan 1 of birth year
**Notes:** None

### Q2: What about consent infrastructure?

| Option | Description | Selected |
|--------|-------------|----------|
| Remove consent code, keep DB tables | Delete client code (consent service, pending component). Keep DB tables in place. | :heavy_check_mark: |
| Full cleanup with migration | Remove code AND drop DB tables/functions. | |
| Keep everything, just skip it | Don't delete code, just bypass. | |

**User's choice:** Remove consent code, keep DB tables
**Notes:** None

### Q3: Existing suspended_consent users?

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate to active | UPDATE students SET account_status = 'active' WHERE account_status = 'suspended_consent'. | :heavy_check_mark: |
| Leave as-is | Don't change existing data. | |
| Migrate + remove constraint | Activate AND remove 'suspended_consent' from CHECK constraint. | |

**User's choice:** Migrate to active
**Notes:** None

---

## Claude's Discretion

- Parent email step messaging/copy
- Google OAuth birth year collection approach for student users

## Deferred Ideas

None — discussion stayed within phase scope.
