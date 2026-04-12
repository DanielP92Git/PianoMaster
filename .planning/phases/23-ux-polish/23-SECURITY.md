---
phase: 23
slug: ux-polish
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-09
---

# Phase 23 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary                | Description                                                   | Data Crossing                              |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| localStorage read/write | Syllable toggle preference stored in localStorage             | UI preference boolean — no PII, no secrets |
| None (Plans 01, 02)     | Timing math, i18n strings, unit data files, VexFlow rendering | No auth, network, or data storage changes  |

---

## Threat Register

| Threat ID | Category                   | Component                    | Disposition | Mitigation                                                                                              | Status |
| --------- | -------------------------- | ---------------------------- | ----------- | ------------------------------------------------------------------------------------------------------- | ------ |
| T-23-01   | T (Tampering)              | i18n JSON files              | accept      | Display strings only, no secrets or logic. Version-controlled.                                          | closed |
| T-23-02   | I (Information Disclosure) | calculateTimingThresholds    | accept      | Timing thresholds are game UX parameters, not sensitive data.                                           | closed |
| T-23-03   | T (Tampering)              | Unit file data               | accept      | Version-controlled build-time constants. validateTrail.mjs enforces policy at build time.               | closed |
| T-23-04   | D (Denial of Service)      | Multi-stave rendering        | accept      | VexFlow renders max 4 staves (capped by policy). No user-controlled input determines stave count.       | closed |
| T-23-05   | T (Tampering)              | localStorage syllable toggle | accept      | UI preference (on/off). Tampering has zero security impact. No PII involved.                            | closed |
| T-23-06   | I (Information Disclosure) | VexFlow SVG text             | accept      | Syllable annotations are educational content (ta, ti-ti), not sensitive data. Visible in DOM by design. | closed |

_Status: open · closed_
_Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)_

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale                                                            | Accepted By               | Date       |
| ------- | ---------- | -------------------------------------------------------------------- | ------------------------- | ---------- |
| AR-01   | T-23-01    | i18n files contain only display strings                              | Claude (gsd-secure-phase) | 2026-04-09 |
| AR-02   | T-23-02    | Timing thresholds are non-sensitive game UX parameters               | Claude (gsd-secure-phase) | 2026-04-09 |
| AR-03   | T-23-03    | Unit files are build-time constants with build validator enforcement | Claude (gsd-secure-phase) | 2026-04-09 |
| AR-04   | T-23-04    | Max 4 staves capped by policy, no user-controlled stave count        | Claude (gsd-secure-phase) | 2026-04-09 |
| AR-05   | T-23-05    | localStorage toggle is UI-only preference with zero security impact  | Claude (gsd-secure-phase) | 2026-04-09 |
| AR-06   | T-23-06    | SVG text contains educational syllables, not sensitive data          | Claude (gsd-secure-phase) | 2026-04-09 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By                    |
| ---------- | ------------- | ------ | ---- | ------------------------- |
| 2026-04-09 | 6             | 6      | 0    | Claude (gsd-secure-phase) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-09
