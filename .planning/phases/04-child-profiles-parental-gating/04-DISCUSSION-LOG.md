# Phase 4: Child Profiles & Parental Gating - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-04
**Phase:** 4-Child Profiles & Parental Gating
**Areas discussed:** Switcher entry model, Gate lifetime & switch-away, Data rights surface, Profile CRUD & avatars

---

## Switcher Entry Model

### Launch model

| Option                             | Description                                                                                                                    | Selected |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Resume last, switch anytime        | Remember last active child (localStorage), drop into dashboard; switcher always one tap away; single-child never sees a picker | ✓        |
| Always show 'Who's playing?' first | Full-screen picker on every launch, even for one child                                                                         |          |
| Picker only when 2+ children       | One child → dashboard; 2+ → picker on launch                                                                                   |          |

### Switcher UI

| Option                            | Description                                      | Selected |
| --------------------------------- | ------------------------------------------------ | -------- |
| Tap active-child avatar in header | Header avatar opens the 'Who's playing?' overlay | ✓        |
| Sidebar / menu entry              | 'Switch profile' item in nav                     |          |
| Only inside Settings              | Switching lives on the settings page             |          |

### Empty state (zero children)

| Option                                         | Description                           | Selected |
| ---------------------------------------------- | ------------------------------------- | -------- |
| 'Add your first child' prompt, gated to create | Empty picker CTA → gate → create flow | ✓        |
| Auto-open create flow immediately              | Drop straight into the create form    |          |

**User's choice:** All three recommended options.
**Notes:** Optimizes for the common single-child case (all 15 live accounts) while serving shared-tablet and zero-child (fresh Phase-3) states.

---

## Gate Lifetime & Switch-Away

### Gate life

| Option                                   | Description                                                                                                            | Selected |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| Short shared window, auto-closes (~3min) | Shared gate across parent surfaces; closes on timeout/switch/blur/leave-to-child; every gated route re-checks on mount | ✓        |
| Re-solve on every gated surface          | Gate re-arms on every mount of every gated screen                                                                      |          |
| Open until you leave the parent area     | Stays open within parent surfaces, no timer                                                                            |          |

### Switch-away (Open Question 3)

| Option                             | Description                                                                  | Selected |
| ---------------------------------- | ---------------------------------------------------------------------------- | -------- |
| No gate — switching free both ways | Consistent with D-07; sibling-as-sibling accepted (Netflix-kids trust model) | ✓        |
| Gate required to switch away       | Leaving a child pops the gate; contradicts D-07's shared-tablet intent       |          |

### Gate scope (multiSelect)

| Option                                        | Description                                   | Selected         |
| --------------------------------------------- | --------------------------------------------- | ---------------- |
| Child profile CRUD                            | create/rename/delete/avatar                   | ✓                |
| Account settings + subscription/billing       | /parent-portal, /settings, /subscribe, cancel | ✓                |
| Data rights (review/export/delete/deactivate) | COPPA-03..06 surfaces                         | ✓                |
| Viewing a child's own progress stats          | read-only Quick Stats / heatmap               | (left unchecked) |

**User's choice:** Short auto-closing window; no gate on switch-away (OQ3 resolved); gate the three action surfaces but NOT read-only stat viewing.
**Notes:** Deliberately leaving stat-viewing ungated means today's fully-gated Parent Portal must be split — read-only stats visible, actions gated.

---

## Data Rights Surface

### Location

| Option                                     | Description                                                                                                           | Selected |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | -------- |
| 'Manage Children' screen → per-child panel | New gated list; each child drills into rename/avatar/review/export/deactivate/delete; portal keeps account-wide items | ✓        |
| Extend Parent Portal in place              | Add per-child section into the existing dense portal                                                                  |          |

### Deactivate semantics

| Option                             | Description                                                                             | Selected |
| ---------------------------------- | --------------------------------------------------------------------------------------- | -------- |
| Freeze & hide, reversible          | is_active=false: hidden from switcher, data retained, reactivate anytime (§312.6(a)(1)) | ✓        |
| Deactivate == recoverable deletion | Front of 30-day soft-delete grace                                                       |          |

### Export / Delete behavior

| Option                                                | Description                                                                                                                              | Selected |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Export=JSON download; Delete=permanent + name-confirm | Reuse dataExportService (complete STUDENT_DATA_TABLES first); delete immediate/permanent, gated + nickname-typed, parent stays logged in | ✓        |
| Export=JSON; Delete=30-day recoverable grace          | Per-child mirror of account-level soft delete                                                                                            |          |

**User's choice:** All three recommended options.
**Notes:** Deactivate (reversible) and delete (permanent) kept as distinct levers — that's what makes COPPA-06 real rather than a rename of delete.

---

## Profile CRUD & Avatars

### Avatar picker

| Option                     | Description                                                                                          | Selected |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| Compact inline preset grid | Small selectable grid in create/edit form, writes child_profiles.avatar_id; accessories out of scope | ✓        |
| Reuse/retarget Avatars.jsx | Extend the full-page picker to accept childId                                                        |          |

### Nickname guidance

| Option                                 | Description                                                                      | Selected |
| -------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| Inline helper text, non-blocking       | Static helper copy under the field                                               |          |
| Inline helper + soft warning heuristic | Also warn (non-blocking) if entry looks like a full name (two capitalized words) | ✓        |

### Post-create behavior

| Option                                        | Description                                   | Selected |
| --------------------------------------------- | --------------------------------------------- | -------- |
| Auto-switch into the new child, ready to play | Set new child active, land on their dashboard | ✓        |
| Return to the Manage Children list            | Return to list for batch setup                |          |

**User's choice:** Compact inline preset grid; inline helper + soft full-name heuristic (chose the stronger option over recommended helper-only); auto-switch into the new child.
**Notes:** Heuristic must stay non-blocking, localized EN+HE, tuned conservatively against false positives (hyphenated / two-word nicknames).

---

## Claude's Discretion

- Exact gate window length (~2–5 min) and the precise close-trigger implementation.
- Cache-clear mechanism on switch (scout recommends mirroring logout's `removeQueries()` + localStorage purge, minus signOut); whether to force a full remount.
- The `localStorage` active-child key name and its slot in the logout purge.
- Switch-transition UX; cap (if any) on number of children; "review data" summary vs raw JSON.
- Which preset avatars populate the grid; all copy/i18n keys (EN+HE).
- Last-child deletion/deactivation → bare parent account (allowed).

## Deferred Ideas

- Per-child progress tile on the switcher; multi-child comparison dashboard (Future Requirements).
- Gating switch-away / per-child PIN (declined — contradicts D-07).
- Rich "review data" summary screen vs raw export JSON.
- Accessory layering in the avatar picker (out of scope — preset avatars only).
