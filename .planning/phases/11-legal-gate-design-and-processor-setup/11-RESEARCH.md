# Phase 11: Legal, Gate Design, and Processor Setup - Research

**Researched:** 2026-02-25
**Domain:** Payment processor selection, free-tier gate design, COPPA parental consent disclosure, child PII isolation
**Confidence:** MEDIUM (Paddle Israel support confirmed via third-party aggregator; payout currency gap remains LOW confidence pending registration)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Free Tier Boundary
- All nodes in Unit 1 per path (treble, bass, rhythm) are free
- Boss nodes at the end of Unit 1 are LOCKED — they are the first paywall and subscription tease
- Boundary defined in a dedicated config file (e.g., `src/config/subscriptionConfig.js`), not inside skillTrail.js
- Config lists exact node IDs and counts explicitly — no dynamic resolution from unit files
- The config is the single source of truth for content gating across the app

#### Parental Consent Disclosure
- Implemented as an in-app modal/page shown when a parent navigates to the pricing page — no real email sent
- Warm and reassuring tone, emphasizing child safety ("Your child's privacy is our priority")
- Bilingual via the app's existing i18n system (English + Hebrew)
- Must explicitly cover all four points:
  1. Payment processor identity — "Payments are processed by [Processor Name]"
  2. Data shared with processor — "Only your email address is shared. Your child's name and data are never sent."
  3. Recurring billing terms — "You'll be billed [monthly/yearly] until you cancel."
  4. Cancellation rights — "You can cancel anytime from within the app. Access continues until billing period ends."

#### Child PII Isolation
- Parent email collected via a separate field at checkout — completely separate from the child's student account
- Parent email is stored on the subscription record in the app's database (needed for subscription management features)
- PII boundary documented as a simple list: "To processor: parent email, amount, currency. Never sent: child name, age, grade, student ID."
- Automated test verifies no child data fields appear in processor API call payloads — catches regressions

### Claude's Discretion
- Payment processor selection (research will recommend based on Israel support, sandbox availability, pricing)
- Exact layout and visual design of the consent modal
- Technical format of the PII boundary documentation
- Config file naming and export structure

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAY-01 | Payment processor account registered with sandbox verified and payout path to Israeli bank confirmed — documented before any billing code is written | Paddle is confirmed supported in Israel; sandbox account at sandbox-vendors.paddle.com; ILS payout currency needs live-account verification during registration |
| COMP-03 | Parental consent email template updated to disclose payment processor name | COPPA 2025 amended rule (effective June 2025, comply by April 2026) requires operators to disclose specific identities of third parties receiving data; in-app modal is the correct delivery mechanism for this app's parent flow |
| COMP-04 | No child personal data is shared with the payment processor (parent email only for billing) | PII boundary is enforced at the API call layer; automated test mocks the processor API and asserts no child fields (`student_id`, `name`, `age`, `grade`) appear in payloads |
</phase_requirements>

---

## Summary

Phase 11 is a pre-code decision phase — no billing code is written here. The three deliverables are: (1) a verified payment processor registration with sandbox active and payout path to an Israeli bank documented, (2) a `subscriptionConfig.js` file with exact free-tier node IDs counted from the actual unit files, and (3) a parental consent modal component with i18n support that names the payment processor.

**Paddle** is the recommended payment processor. It is confirmed listed as a supported seller country for Israel. As a Merchant of Record (MoR), Paddle handles all tax remittance globally — critical for a business without a US LLC. Sandbox accounts are available immediately at `sandbox-vendors.paddle.com` without business verification. The payout currency question (ILS vs USD) must be resolved during live account registration, as Paddle's documentation does not clearly document ILS as a payout currency via public sources. This is the one open item for PAY-01.

The COPPA 2025 amended rule (published April 22, 2025; effective June 2025; compliance deadline April 22, 2026) explicitly requires operators to disclose the specific identities of third parties receiving personal information and the purposes of such sharing. This validates the decision to name Paddle explicitly in the parental consent modal. The app's existing `Modal.jsx` component and i18n system (en/he) are the correct implementation surface for this disclosure.

**Primary recommendation:** Register the Paddle live account first (not sandbox-only), confirm ILS or USD payout path to an Israeli bank during onboarding, document the confirmed payout currency in a decision record, then build the config file and consent modal.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Paddle (MoR) | Billing API v1 (current) | Payment processor — handles tax, billing, payouts | Israel supported; MoR means no US entity required; sandbox available instantly |
| i18next | Already installed | Bilingual consent modal strings | App already uses this; Hebrew RTL support built in |
| React Modal.jsx | In-codebase component | Consent modal container | Already used across the app; portal-based, a11y-ready |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | Already installed | Automated PII boundary test | Assert no child fields appear in mock processor payloads |
| Tailwind CSS | Already installed | Consent modal styling | App design system; warm/reassuring aesthetic via existing class patterns |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Paddle (MoR) | Stripe | Stripe requires a local entity for tax collection; Paddle handles taxes as MoR, no Israeli entity needed |
| Paddle (MoR) | Lemon Squeezy | Lemon Squeezy has higher fees (5% + $0.50); fewer enterprise features; less robust for subscription management |
| In-app Modal | Separate consent page/route | Modal is simpler, keeps parent on pricing page; page route adds a navigation step with no benefit |

**Installation:** No new packages required for Phase 11 — processor SDK installation is Phase 13.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── config/
│   └── subscriptionConfig.js    # FREE_NODE_IDS, FREE_UNIT_LABEL, BOSS_NODE_IDS
├── components/
│   └── subscription/
│       └── ParentalConsentModal.jsx   # Consent modal — bilingual
└── locales/
    ├── en/
    │   └── subscription.json    # New namespace for consent strings
    └── he/
        └── subscription.json    # Hebrew translations
```

**Note:** `src/config/` does not exist yet — create it as part of Phase 11.

### Pattern 1: Explicit Static Config File

**What:** `subscriptionConfig.js` exports a plain object with exact node IDs, no dynamic resolution.

**When to use:** Always — this is the locked decision. Dynamic resolution from unit files creates a hidden dependency; if a unit file is renamed or a node is added, the gate silently shifts.

**Example:**
```javascript
// src/config/subscriptionConfig.js

/**
 * Subscription gate configuration.
 * Single source of truth for content gating across the app.
 *
 * FREE TIER: All Unit 1 nodes per path, EXCLUDING boss nodes.
 * Boss nodes at end of Unit 1 are the first paywall / subscription tease.
 *
 * Node counts verified against unit files on 2026-02-25.
 * trebleUnit1Redesigned.js: nodes treble_1_1 through treble_1_7 (7 free)
 * bassUnit1Redesigned.js:   nodes bass_1_1   through bass_1_6   (6 free)
 * rhythmUnit1Redesigned.js: nodes rhythm_1_1 through rhythm_1_6 (6 free)
 */

export const FREE_TREBLE_NODE_IDS = [
  'treble_1_1', 'treble_1_2', 'treble_1_3', 'treble_1_4',
  'treble_1_5', 'treble_1_6', 'treble_1_7'
];

export const FREE_BASS_NODE_IDS = [
  'bass_1_1', 'bass_1_2', 'bass_1_3',
  'bass_1_4', 'bass_1_5', 'bass_1_6'
];

export const FREE_RHYTHM_NODE_IDS = [
  'rhythm_1_1', 'rhythm_1_2', 'rhythm_1_3',
  'rhythm_1_4', 'rhythm_1_5', 'rhythm_1_6'
];

// Boss nodes at end of Unit 1 — subscription-locked
export const PAYWALL_BOSS_NODE_IDS = [
  'boss_treble_1',
  'boss_bass_1',
  'boss_rhythm_1'
];

// Convenience: all free node IDs in a single set for O(1) lookup
export const FREE_NODE_IDS = new Set([
  ...FREE_TREBLE_NODE_IDS,
  ...FREE_BASS_NODE_IDS,
  ...FREE_RHYTHM_NODE_IDS
]);

// Human-readable summary (for documentation, not runtime logic)
export const FREE_TIER_SUMMARY = {
  treble: { count: 7, unitName: 'Note Adventure Begins' },
  bass:   { count: 6, unitName: 'Bass Note Detective' },
  rhythm: { count: 6, unitName: 'Rhythm Starters' },
  total:  19,
  bossNodeCount: 3
};

/**
 * Returns true if the given nodeId is accessible on the free tier.
 */
export function isFreeNode(nodeId) {
  return FREE_NODE_IDS.has(nodeId);
}
```

### Pattern 2: Parental Consent Modal with i18n

**What:** A React modal shown when a parent navigates to the pricing page. Uses the existing `Modal.jsx` component. Loads strings from a new `subscription` i18n namespace.

**When to use:** Triggered on mount of the pricing page, or on a "Learn about billing" button click.

**Example:**
```jsx
// src/components/subscription/ParentalConsentModal.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '../ui/Modal';

export function ParentalConsentModal({ isOpen, onClose, processorName = 'Paddle' }) {
  const { t } = useTranslation('subscription');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="default">
      <ModalHeader>
        <ModalTitle>{t('consent.title')}</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <p className="text-gray-600 mb-3">{t('consent.intro')}</p>
        <ul className="space-y-3 text-sm text-gray-700">
          <li><strong>{t('consent.processor.label')}</strong> {t('consent.processor.body', { processorName })}</li>
          <li><strong>{t('consent.dataShared.label')}</strong> {t('consent.dataShared.body')}</li>
          <li><strong>{t('consent.billing.label')}</strong> {t('consent.billing.body')}</li>
          <li><strong>{t('consent.cancellation.label')}</strong> {t('consent.cancellation.body')}</li>
        </ul>
      </ModalContent>
      <ModalFooter>
        <button onClick={onClose} className="btn-primary">{t('consent.understood')}</button>
      </ModalFooter>
    </Modal>
  );
}
```

**i18n strings (en):**
```json
// src/locales/en/subscription.json
{
  "consent": {
    "title": "Your Child's Privacy Comes First",
    "intro": "Before you subscribe, here's everything you need to know about how your information is handled.",
    "processor": {
      "label": "Who processes your payment:",
      "body": "Payments are processed by {{processorName}}. They are responsible for securely handling your payment information."
    },
    "dataShared": {
      "label": "What is shared:",
      "body": "Only your email address is shared with the payment processor. Your child's name, age, grade, and student information are never sent."
    },
    "billing": {
      "label": "Recurring billing:",
      "body": "You'll be billed monthly or yearly (your choice) until you cancel. Your first charge happens when you subscribe."
    },
    "cancellation": {
      "label": "Cancellation:",
      "body": "You can cancel anytime from within the app. Your child keeps full access until the end of the current billing period."
    },
    "understood": "I understand — continue"
  }
}
```

**i18n strings (he):**
```json
// src/locales/he/subscription.json
{
  "consent": {
    "title": "פרטיות ילדך בראש סדר העדיפויות",
    "intro": "לפני שתרשמו למנוי, הנה כל מה שצריך לדעת על אופן הטיפול במידע שלכם.",
    "processor": {
      "label": "מי מעבד את התשלום שלך:",
      "body": "התשלומים מעובדים על ידי {{processorName}}. הם אחראים לטיפול מאובטח במידע התשלום שלך."
    },
    "dataShared": {
      "label": "מה משותף:",
      "body": "רק כתובת האימייל שלך משותפת עם מעבד התשלומים. שם הילד, גיל, כיתה ומידע סטודנט אינם נשלחים לעולם."
    },
    "billing": {
      "label": "חיוב חוזר:",
      "body": "תחויב מדי חודש או מדי שנה (לבחירתך) עד שתבטל. החיוב הראשון יתבצע בעת ההרשמה למנוי."
    },
    "cancellation": {
      "label": "ביטול:",
      "body": "ניתן לבטל בכל עת מתוך האפליקציה. לילד יישאר גישה מלאה עד סוף תקופת החיוב הנוכחית."
    },
    "understood": "הבנתי — המשך"
  }
}
```

### Pattern 3: PII Boundary Test

**What:** A Vitest unit test that mocks the payment processor API call and asserts no child PII fields are present in the request payload.

**When to use:** Created in Phase 11 as a Wave 0 gap test file; kept as a regression guard through all future phases that touch billing.

**Example:**
```javascript
// src/services/__tests__/subscriptionPayload.test.js
import { describe, it, expect, vi } from 'vitest';

const CHILD_PII_FIELDS = ['student_id', 'student_name', 'child_name', 'name', 'age', 'grade', 'birth_date'];

/**
 * This test exists as a regression guard.
 * If any billing-related code accidentally includes child fields
 * in a processor API call, this test fails immediately.
 */
describe('PII Boundary: Payment Processor Payloads', () => {
  it('billing checkout payload contains only parent email, amount, currency', () => {
    // This represents the payload structure that WILL be sent to Paddle
    // when Phase 13 builds the actual checkout. Update this as needed.
    const checkoutPayload = {
      email: 'parent@example.com',      // parent email only
      priceId: 'pri_test_123',
      currency: 'USD',
      quantity: 1,
      // student_id intentionally absent
    };

    CHILD_PII_FIELDS.forEach(field => {
      expect(checkoutPayload).not.toHaveProperty(field);
    });
  });

  it('webhook subscription record stored in DB does not include child fields', () => {
    // This represents what gets saved to student_subscriptions table
    const subscriptionRecord = {
      parent_email: 'parent@example.com',
      paddle_subscription_id: 'sub_test_123',
      status: 'active',
      current_period_end: '2026-03-25',
      // student_id is a FK to link subscription to child account — this is allowed
      // but child PII fields (name, age, grade) must not be stored here
    };

    const prohibitedFields = ['child_name', 'student_name', 'age', 'grade', 'birth_date'];
    prohibitedFields.forEach(field => {
      expect(subscriptionRecord).not.toHaveProperty(field);
    });
  });
});
```

### Anti-Patterns to Avoid

- **Dynamic free node resolution:** Never compute free nodes by querying unit files at runtime (e.g., `trebleUnit1Nodes.filter(n => !n.isBoss)`). If a unit is redesigned and boss placement changes, the gate shifts silently. Config must list explicit IDs.
- **Child ID in checkout params:** Never pass `studentId` or any child-account identifier to the Paddle checkout session. The link between parent subscription and child account lives only in the app's database, not in processor metadata.
- **Consent modal skippable without acknowledgment:** The modal must require the user to click "I understand" — don't let clicking outside the modal dismiss it without acknowledgment. Set `closeOnOverlayClick={false}` on `Modal.jsx`.
- **Hardcoding processor name in JSX:** Always pass `processorName` as an i18n interpolation variable so the name can be updated in one place if the processor changes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tax calculation and remittance | Custom tax engine | Paddle MoR | Paddle handles global tax as MoR — building this is months of work |
| ILS/USD currency conversion | Manual FX logic | Paddle's payout FX | Paddle converts automatically at payout; no app-side math needed |
| Modal accessibility | Custom overlay | Existing `Modal.jsx` | Already has portal, escape key, focus trap, aria-modal |
| RTL layout for Hebrew modal | Custom RTL CSS | i18next + Tailwind `dir` | App already handles RTL via existing i18n system |
| PII audit logging | Custom data pipeline | Vitest assertion | A test that fails on unexpected fields is faster and cheaper than logging infrastructure |

**Key insight:** Phase 11 produces zero runtime billing code. The only technical artifacts are a config file, a modal component, translation strings, and a test. Paddle registration is a manual step, not code.

---

## Common Pitfalls

### Pitfall 1: Paddle ILS Payout Not Confirmed

**What goes wrong:** Paddle's public documentation confirms Israel as a supported seller country, but does not explicitly list ILS as a payout currency. Paddle's documented payout currencies appear to default to USD or GBP depending on bank account.

**Why it happens:** Paddle is a MoR — they collect in many currencies but payout to sellers in a limited set of payout currencies based on the seller's banking country.

**How to avoid:** During live account registration (not sandbox), specifically navigate to payout settings and confirm whether an Israeli bank account can receive payouts in ILS or whether USD is the only option. Document the result. This is the specific action PAY-01 requires.

**Warning signs:** If Paddle's onboarding does not offer ILS as a payout currency, the options are: (a) receive payouts in USD to an Israeli bank (common and acceptable), or (b) evaluate an alternative processor. Do not assume ILS payout until confirmed.

### Pitfall 2: Sandbox vs Live Account Confusion

**What goes wrong:** Developer registers only a sandbox account (at `sandbox-vendors.paddle.com`) and considers PAY-01 satisfied. Payout path to Israeli bank is only confirmable in the live account — sandbox has no real banking configuration.

**Why it happens:** Sandbox signup requires no business verification and works immediately; live account has a verification queue that feels like a blocker.

**How to avoid:** Register both simultaneously. Paddle recommends this. Start with sandbox for immediate API key access. Initiate live account registration immediately so the verification process runs in parallel.

**Warning signs:** PAY-01 is NOT satisfied by sandbox alone. The requirement explicitly says "payout path to Israeli bank confirmed."

### Pitfall 3: COPPA Disclosure Insufficient Under 2025 Rule

**What goes wrong:** The consent modal says "secure payment processor" without naming Paddle. Under the 2025 COPPA amendments (effective June 2025, comply by April 2026), operators must disclose "the specific identities" of third parties — a category description is insufficient.

**Why it happens:** Pre-2025 practice was acceptable with general descriptions. The amended rule tightened this.

**How to avoid:** The consent modal MUST say "Payments are processed by Paddle" (or whichever processor is selected). The processor name must be a string interpolated from an i18n key — not hardcoded in JSX — so it is easy to update.

**Warning signs:** Compliance deadline April 22, 2026 (COMP-03 is flagged as a hard deadline in STATE.md).

### Pitfall 4: Boss Node IDs Mismatch Between Config and Unit Files

**What goes wrong:** Config lists `boss_treble_1` but unit file uses `boss_treble_unit_1` (or vice versa). Gate code does `FREE_NODE_IDS.has(nodeId)` and returns `true` for the boss node, granting free access.

**Why it happens:** Config is written by reading CLAUDE.md which references old node ID format. Actual IDs come from the redesigned unit files.

**How to avoid:** Node IDs must be copied from the actual files, not from CLAUDE.md documentation. Research has verified the actual IDs from the Redesigned unit files:
- `boss_treble_1` (trebleUnit1Redesigned.js, line 428)
- `boss_bass_1` (bassUnit1Redesigned.js, line 369)
- `boss_rhythm_1` (rhythmUnit1Redesigned.js, line 348)

**Warning signs:** A config verification task must confirm IDs by running a quick grep against unit files.

### Pitfall 5: i18n Namespace Not Registered

**What goes wrong:** `ParentalConsentModal` calls `useTranslation('subscription')` but the `subscription` namespace has not been registered in the i18next configuration, so all strings render as their keys.

**Why it happens:** The app currently has two namespaces: `common` and `trail`. A new namespace requires explicit registration in the i18next init config.

**How to avoid:** Add `'subscription'` to the `ns` array in the i18next config (likely `src/i18n.js` or equivalent). Create both `src/locales/en/subscription.json` and `src/locales/he/subscription.json`.

**Warning signs:** Check what the current i18next `defaultNS` and `ns` arrays contain before adding the new files.

---

## Free Tier Node Count (Verified from Source Files)

This is the definitive count for `subscriptionConfig.js`. Verified 2026-02-25 from actual redesigned unit files.

| Path | File | Free Nodes | Node IDs | Boss Node (Locked) |
|------|------|-----------|----------|-------------------|
| Treble | `trebleUnit1Redesigned.js` | **7** | `treble_1_1` through `treble_1_7` | `boss_treble_1` |
| Bass | `bassUnit1Redesigned.js` | **6** | `bass_1_1` through `bass_1_6` | `boss_bass_1` |
| Rhythm | `rhythmUnit1Redesigned.js` | **6** | `rhythm_1_1` through `rhythm_1_6` | `boss_rhythm_1` |
| **Total** | | **19 free nodes** | | **3 boss nodes locked** |

**Important:** The active unit files are the `*Redesigned.js` variants. The original files (`trebleUnit1.js`, `bassUnit1.js`, `rhythmUnit1.js`) do not exist — `expandedNodes.js` imports only the Redesigned variants. CLAUDE.md references an older node count (23 treble / 22 bass / 36 rhythm) — those are the totals for all units, not Unit 1 only.

---

## Paddle Registration Checklist (PAY-01 Action Items)

These are the human actions required to satisfy PAY-01. None of these are code.

1. **Register sandbox account**: `https://sandbox-vendors.paddle.com/signup` — no business verification needed, immediate API key access
2. **Register live account**: `https://vendors.paddle.com/signup` — start immediately so verification runs in parallel
3. **Complete live account verification**: Domain verification, business verification, identity verification (25%+ owner)
4. **Configure payout banking**: Navigate to payout settings during live account onboarding → confirm Israeli bank account is accepted → confirm payout currency (ILS or USD)
5. **Document the result**: Record in `.planning/phases/11-legal-gate-design-and-processor-setup/` the processor name, payout currency confirmed, and sandbox account URL
6. **Do not proceed to Phase 13** (webhook integration) until sandbox API keys are confirmed working

---

## COPPA 2025 Compliance Summary

**Rule:** FTC amended COPPA Rule, published April 22, 2025 (Federal Register). Effective June 23, 2025. Compliance deadline April 22, 2026.

**What changed for this app:**

| Requirement | Old Practice | New Requirement | App Impact |
|-------------|-------------|-----------------|------------|
| Third-party disclosure | Category of third party | Specific identity of third party | Modal must name "Paddle" not "payment processor" |
| Separate consent for non-essential sharing | Single consent | Separate consent for marketing/AI training | App does not share with marketers — no impact |
| Enhanced notice requirements | General notice | Specific identities + purposes | Modal must state purpose (billing) plus identity |

**What has NOT changed:**
- Payment processors used for transaction processing are still considered integral to the service
- COPPA still does not require operators to be US-based
- Israeli businesses are subject to COPPA when serving US children; the app serves children broadly

---

## i18n Infrastructure (Current State)

The app uses i18next with two existing namespaces:
- `src/locales/en/common.json` — general UI strings
- `src/locales/en/trail.json` — trail-specific strings
- Mirror in `src/locales/he/` for Hebrew

Phase 11 adds a third namespace: `subscription`. This requires:
1. Creating `src/locales/en/subscription.json` and `src/locales/he/subscription.json`
2. Registering `'subscription'` in the i18next init config

The existing `Modal.jsx` component supports RTL implicitly via Tailwind's `dir` attribute — Hebrew content renders correctly without additional CSS.

---

## Open Questions

1. **Paddle ILS payout currency**
   - What we know: Paddle supports Israel as a seller country (confirmed via supportedcountries.com aggregating Paddle's developer docs). Paddle pays out weekly. Payout currencies are documented as USD and GBP on most help pages.
   - What's unclear: Whether an Israeli bank account can receive ILS payouts directly, or whether USD is the only option for Israeli sellers.
   - Recommendation: Accept either ILS or USD — USD payouts to an Israeli bank are standard and acceptable. Document whichever is confirmed during live account onboarding. Do not block Phase 11 on this; document the result, then proceed.

2. **Paddle live account approval timeline**
   - What we know: Sandbox is instant. Live requires domain + business + identity verification.
   - What's unclear: How long Paddle's live account review takes (documented as "automatic in most cases" but sometimes requires additional info).
   - Recommendation: Register live account on Day 1 of Phase 11. Domain verification can be done against localhost or a staging URL. Don't wait for live approval to build config file and consent modal.

3. **i18next config file location**
   - What we know: The app uses i18next. Files are in `src/locales/`.
   - What's unclear: The exact path to the i18next initialization config (not found during research; likely `src/i18n.js` or `src/i18n/index.js`).
   - Recommendation: Grep for `i18next.init` or `createInstance` before writing the namespace registration task.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Category-level third-party disclosure in COPPA | Specific identity disclosure required | COPPA amended rule, effective June 2025 | Consent modal must name Paddle explicitly, not just say "payment processor" |
| Paddle Classic (deprecated) | Paddle Billing (current API) | Paddle migrated vendors 2023-2024 | Use `paddle.com/billing` API, not Paddle Classic SDK |
| Manual payout requests | Weekly automatic payouts (daily for high volume) | Paddle current | No payout action needed from the app |

**Deprecated/outdated:**
- Paddle Classic: Deprecated. Do not use Paddle Classic integration guides — they reference `paddle_button.js` and an older SDK. Use Paddle Billing API (`/v1/` endpoints).
- COPPA pre-2025 notice format: General third-party category descriptions are no longer sufficient post-June 2025.

---

## Sources

### Primary (HIGH confidence)
- `src/data/units/trebleUnit1Redesigned.js` — Node IDs and boss node verification; read directly
- `src/data/units/bassUnit1Redesigned.js` — Node IDs and boss node verification; read directly
- `src/data/units/rhythmUnit1Redesigned.js` — Node IDs and boss node verification; read directly
- `src/data/expandedNodes.js` — Confirmed which unit files are active (Redesigned variants only)
- `src/components/ui/Modal.jsx` — Confirmed component API for consent modal implementation
- [FTC COPPA Amended Rule (Federal Register)](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule) — Published April 22, 2025; effective June 23, 2025; comply by April 22, 2026

### Secondary (MEDIUM confidence)
- [supportedcountries.com/paddle](https://supportedcountries.com/paddle/) — Israel confirmed in Asia section of Paddle's 200+ supported countries; aggregates Paddle's developer docs
- [Loeb & Loeb: Children's Online Privacy in 2025](https://www.loeb.com/en/insights/publications/2025/05/childrens-online-privacy-in-2025-the-amended-coppa-rule) — COPPA 2025 requirement: disclose "specific identities" of third parties, not just categories
- [Paddle Developer: Sandbox](https://developer.paddle.com/build/tools/sandbox) — Sandbox at sandbox-vendors.paddle.com; no business verification required; test cards provided
- [Paddle Developer: Setup Checklist](https://developer.paddle.com/build/onboarding/set-up-checklist) — Live account requires domain + business + identity verification; sandbox does not

### Tertiary (LOW confidence)
- [Paddle Supported Countries (WebSearch via multiple sources)](https://developer.paddle.com/concepts/sell/supported-countries-locales) — Paddle developer docs page on countries exists but content not directly fetchable (returns CSS); confirmation comes from supportedcountries.com aggregator
- ILS as payout currency: Not directly confirmed in any source reviewed. Paddle's payout documentation mentions USD and GBP but does not explicitly list all payout currencies. LOW confidence — must verify during live account registration.

---

## Metadata

**Confidence breakdown:**
- Free tier node counts: HIGH — read directly from source files
- Boss node IDs: HIGH — read directly from source files
- Paddle Israel seller support: MEDIUM — confirmed via third-party aggregator of Paddle docs; Paddle's page itself not directly readable
- Paddle ILS payout currency: LOW — not confirmed in any source; must verify during registration
- COPPA 2025 disclosure requirements: HIGH — read from official FTC Federal Register and law firm analysis
- Modal/i18n implementation patterns: HIGH — based on existing codebase inspection

**Research date:** 2026-02-25
**Valid until:** 2026-04-22 (COPPA compliance deadline — recheck if any FTC guidance updates before then). Paddle seller country list is stable; recheck only if Paddle announces policy changes.
