---
phase: 11-legal-gate-design-and-processor-setup
plan: 01
subsystem: subscription
tags: [monetization, coppa, i18n, config, testing]
dependency_graph:
  requires: []
  provides:
    - src/config/subscriptionConfig.js (free-tier gate definitions)
    - src/services/__tests__/subscriptionPayload.test.js (PII boundary regression guard)
    - src/components/subscription/ParentalConsentModal.jsx (COPPA consent modal)
    - src/locales/en/subscription.json (English consent strings)
    - src/locales/he/subscription.json (Hebrew consent strings)
  affects:
    - src/i18n/index.js (subscription namespace added)
tech_stack:
  added: []
  patterns:
    - Static config file as single source of truth for feature gating
    - PII field registry pattern for regression testing billing payloads
    - i18n interpolation for vendor-neutral consent disclosure ({{processorName}})
    - Forced acknowledgment modal (closeOnOverlayClick=false, closeOnEscape=false)
key_files:
  created:
    - src/config/subscriptionConfig.js
    - src/services/__tests__/subscriptionPayload.test.js
    - src/components/subscription/ParentalConsentModal.jsx
    - src/locales/en/subscription.json
    - src/locales/he/subscription.json
  modified:
    - src/i18n/index.js
decisions:
  - "Static IDs in subscriptionConfig.js (not dynamic) — gate changes must be intentional edits"
  - "processorName is an i18n interpolation variable, not hardcoded — processor TBD at registration"
  - "ParentalConsentModal cannot be dismissed by clicking outside or Escape — COPPA mandatory acknowledgment"
  - "CHILD_PII_FIELDS includes 7 fields: student_id, student_name, child_name, name, age, grade, birth_date"
metrics:
  duration: 3 minutes
  completed: 2026-02-26
  tasks_completed: 2
  files_created: 6
  tests_added: 3
---

# Phase 11 Plan 01: Subscription Config and Parental Consent Modal Summary

Static subscription config with 19 free + 3 paywalled boss node IDs, PII boundary regression tests guarding 7 child data fields, and a bilingual (EN/HE) COPPA-compliant parental consent modal with forced acknowledgment.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create subscription config and PII boundary test | 6bc69fa | src/config/subscriptionConfig.js, src/services/__tests__/subscriptionPayload.test.js |
| 2 | Create parental consent modal with bilingual i18n | c45a849 | src/components/subscription/ParentalConsentModal.jsx, src/locales/en/subscription.json, src/locales/he/subscription.json, src/i18n/index.js |

## What Was Built

### subscriptionConfig.js (single source of truth for gating)

The `src/config/` directory was created. The config exports:
- `FREE_TREBLE_NODE_IDS` — 7 IDs (treble_1_1 through treble_1_7), verified from trebleUnit1Redesigned.js
- `FREE_BASS_NODE_IDS` — 6 IDs (bass_1_1 through bass_1_6), verified from bassUnit1Redesigned.js
- `FREE_RHYTHM_NODE_IDS` — 6 IDs (rhythm_1_1 through rhythm_1_6), verified from rhythmUnit1Redesigned.js
- `PAYWALL_BOSS_NODE_IDS` — 3 IDs (boss_treble_1, boss_bass_1, boss_rhythm_1)
- `FREE_NODE_IDS` — Set of all 19 free nodes for O(1) lookup
- `FREE_TIER_SUMMARY` — metadata object `{ treble: {count:7}, bass: {count:6}, rhythm: {count:6}, total:19, bossNodeCount:3 }`
- `isFreeNode(nodeId)` — gate function returning `FREE_NODE_IDS.has(nodeId)`

Changing the free tier boundary requires editing only this one file.

### subscriptionPayload.test.js (PII regression guard)

Three tests guard against child PII leaking into billing payloads:
1. Checkout payload (`email`, `priceId`, `currency`, `quantity`) — asserts none of 7 CHILD_PII_FIELDS present
2. Webhook subscription record (`parent_email`, `paddle_subscription_id`, `status`, `current_period_end`) — asserts 5 sensitive child fields absent
3. Config structural test — asserts node counts (7/6/6/3) and ID format regex patterns

All 3 tests pass.

### ParentalConsentModal.jsx (COPPA 2025 compliance)

The `src/components/subscription/` directory was created. The component:
- Uses `useTranslation('subscription')` namespace
- Renders `Modal` with `closeOnOverlayClick={false}` and `closeOnEscape={false}` — mandatory acknowledgment
- Shows `showCloseButton={false}` — no X button; only the "I understand" button closes the modal
- Covers all 4 COPPA disclosure points:
  1. Processor: `{{processorName}}` interpolated (placeholder until processor confirmed at registration)
  2. Data shared: Only parent email; child name/age/grade never sent
  3. Recurring billing: Monthly or yearly until cancellation
  4. Cancellation: Anytime from within app, access continues through billing period
- Exported as both named (`ParentalConsentModal`) and default export

### i18n updates

`src/i18n/index.js` updated to:
- Import `enSubscription` and `heSubscription`
- Add `subscription: enSubscription / heSubscription` to resource bundles
- Add `"subscription"` to `ns` array

Both EN and HE translation files contain identical key structures under `consent.*`.

## Deviations from Plan

None — plan executed exactly as written.

## Notes for Phase 11 continuation

- `processorName` prop defaults to `'Your payment processor'` — update the default (or always pass it) once Paddle Israel registration is confirmed in Phase 11 research
- `PAYWALL_BOSS_NODE_IDS` in subscriptionConfig.js should be updated if boss node IDs change during trail redesign phases
- The PII test suite in `subscriptionPayload.test.js` should be extended as actual billing service functions are written in Phase 12+

## Self-Check: PASSED

Files verified:
- FOUND: src/config/subscriptionConfig.js
- FOUND: src/services/__tests__/subscriptionPayload.test.js
- FOUND: src/components/subscription/ParentalConsentModal.jsx
- FOUND: src/locales/en/subscription.json
- FOUND: src/locales/he/subscription.json

Commits verified:
- FOUND: 6bc69fa (feat(11-01): create subscription config and PII boundary test)
- FOUND: c45a849 (feat(11-01): create parental consent modal with bilingual i18n)

Tests: 3/3 pass
