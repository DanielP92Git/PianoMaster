# Phase 3: Parent-Only Signup & Age Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-03
**Phase:** 3-parent-only-signup-age-gate
**Areas discussed:** Wizard restructure, OAuth gating, DOB format & retention, Under-18 block UX

---

## Wizard restructure

### Q1 — Where should the neutral DOB age gate sit?

| Option                      | Description                                                                           | Selected |
| --------------------------- | ------------------------------------------------------------------------------------- | -------- |
| DOB first, gates everything | DOB screen first; email form + Google button hidden until 18+ confirmed. Recommended. |          |
| Role first, then DOB        | Keep role-first order (pick Parent/Teacher, then DOB).                                | ✓        |
| You decide                  | Delegate.                                                                             |          |

**User's choice:** Role first, then DOB.
**Notes:** Consequence recorded: DOB gate now sits after the role pick, so both the Parent and the
Teacher branch route through it — a minor cannot pick "Teacher" to dodge the gate. The OAuth-bypass
concern DOB-first would have covered is instead closed at the callback (see OAuth gating).

### Q2 — What replaces the Student-vs-Teacher role choice?

| Option                             | Description                                                        | Selected |
| ---------------------------------- | ------------------------------------------------------------------ | -------- |
| 'Parent' vs 'Teacher'              | "Student" card becomes "I'm a parent"; Teacher stays. Recommended. | ✓        |
| No role choice — parent by default | Drop public role picker; teachers get a separate entry.            |          |
| You decide                         | Delegate.                                                          |          |

**User's choice:** 'Parent' vs 'Teacher'.

### Q3 — Where should a Phase-3 parent signup END?

| Option                       | Description                                                            | Selected |
| ---------------------------- | ---------------------------------------------------------------------- | -------- |
| Bare parent account          | Create only the `parents` row; child creation is Phase 4. Recommended. | ✓        |
| Seed a first child at signup | Create one child profile during signup.                                |          |
| You decide                   | Delegate.                                                              |          |

**User's choice:** Bare parent account.
**Notes:** Consequence: the old under-13 "parent-email" wizard step is removed entirely; credentials
step now collects parent email + password + optional parent name, never child data.

---

## OAuth gating

### Q1 — How should the age gate be enforced for OAuth signups?

| Option                            | Description                                                                                                       | Selected |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| Gate at the post-OAuth callback   | Profile presence = returning (straight in) vs new (forced DOB+role completion before `parents` row). Recommended. | ✓        |
| Pre-redirect passed-gate token    | Stash a "passed 18+" flag before redirect; verify on return.                                                      |          |
| Gate the Google button everywhere | Require DOB before the button renders on both screens.                                                            |          |

**User's choice:** Gate at the post-OAuth callback.

### Q2 — What happens to a blocked under-18's just-created auth account?

| Option                    | Description                                                                     | Selected |
| ------------------------- | ------------------------------------------------------------------------------- | -------- |
| Sign out + show block     | Leave the auth row profile-less and inert (RLS denies everything). Recommended. | ✓        |
| Hard-delete the auth user | Delete via a service-role Edge Function.                                        |          |
| You decide                | Delegate.                                                                       |          |

**User's choice:** Sign out + show block.

### Q3 — Should the new-OAuth-user completion screen collect role too?

| Option                   | Description                                                  | Selected |
| ------------------------ | ------------------------------------------------------------ | -------- |
| Collect DOB + role       | Mirror the email path; teachers use Google too. Recommended. | ✓        |
| Assume Parent, skip role | Everyone via Google becomes a parent.                        |          |
| You decide               | Delegate.                                                    |          |

**User's choice:** Collect DOB + role.

---

## DOB format & retention

### Q1 — What DOB input format?

| Option                         | Description                                                   | Selected |
| ------------------------------ | ------------------------------------------------------------- | -------- |
| Full open-field month/day/year | Three open fields via existing ageUtils helpers. Recommended. | ✓        |
| Keep the year-only dropdown    | Reuse today's AgeGate dropdown.                               |          |
| You decide                     | Delegate.                                                     |          |

**User's choice:** Full open-field month/day/year.

### Q2 — How much of the parent's DOB do we keep?

| Option                              | Description                                                                     | Selected |
| ----------------------------------- | ------------------------------------------------------------------------------- | -------- |
| Discard DOB, keep a verified marker | Store only a boolean/timestamp marker on `parents`, no birth date. Recommended. | ✓        |
| Store nothing at all                | No marker, no column.                                                           |          |
| Persist full parent DOB             | Store the full birth date on `parents`.                                         |          |

**User's choice:** Discard DOB, keep a verified marker.

---

## Under-18 block UX

### Q1 — What does an under-18 see?

| Option                       | Description                                                               | Selected |
| ---------------------------- | ------------------------------------------------------------------------- | -------- |
| Friendly dead-end + guidance | "Ask a parent/guardian"; no account/data; Back to fix typos. Recommended. | ✓        |
| Actionable parent hand-off   | "Invite a parent" share/email flow.                                       |          |
| You decide                   | Delegate.                                                                 |          |

**User's choice:** Friendly dead-end + guidance.

### Q2 — Should the block event be logged?

| Option                    | Description                                 | Selected |
| ------------------------- | ------------------------------------------- | -------- |
| Don't log it              | No analytics event, no record. Recommended. | ✓        |
| Anonymous aggregate count | PII-free Umami event.                       |          |
| You decide                | Delegate.                                   |          |

**User's choice:** Don't log it.
**Notes:** Framing accepted — a self-attested DOB gate is neutral, not identity verification; goal is
a gate that doesn't encourage under-agers, not an unbeatable one.

---

## Claude's Discretion

- Post-signup landing screen for a bare parent account (minimal placeholder vs empty dashboard).
- Delete vs retain `ParentEmailStep.jsx` (dead for signup).
- Open-field DOB widget form (three inputs / segmented / native picker), as long as neutral + open-field.
- Age-verified marker column name/type and migration file naming.
- Copy/wording + EN/HE i18n keys for the new screens and relabeled role cards.
- Returning-vs-new detection mechanics in the OAuth callback.

## Deferred Ideas

- Hard-delete of inert profile-less auth rows from blocked under-18 OAuth attempts (service-role Edge Function).
- Anonymous aggregate count of block events (PII-free Umami event) — declined for Phase 3.
- Parent-settings placement of the Privacy Policy link (second half of SIGNUP-05) — rides with Phase 4.
- "Invite a parent" hand-off from the block screen — declined as scope creep + child-sourced collection.

## Privacy Policy link (SIGNUP-05) — accepted default (not a discussed topic)

- Surface the Privacy Policy link on the registration entry screen, in addition to the existing
  credentials-step Terms/Privacy links. Parent-settings placement deferred to Phase 4.
