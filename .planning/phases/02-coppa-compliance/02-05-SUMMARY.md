---
phase: 02-coppa-compliance
plan: 05
subsystem: authentication
tags: [coppa, signup, age-gate, parental-consent, ui]
dependencies:
  requires: ["02-01", "02-02", "02-04"]
  provides: ["coppa-signup-flow", "parent-email-collection"]
  affects: ["02-06"]
tech-stack:
  added: []
  patterns: ["multi-step-form", "conditional-rendering", "defense-in-depth"]
key-files:
  created:
    - src/components/auth/ParentEmailStep.jsx
  modified:
    - src/components/auth/SignupForm.jsx
    - src/features/authentication/useSignup.js
decisions:
  - id: two-stage-signup
    choice: "Age gate first, then parent email (if under-13), then account details"
    reason: "COPPA requires knowing age BEFORE collecting personal information"
  - id: client-side-age-calc
    choice: "Calculate isUnder13 on client and server"
    reason: "Defense in depth - client provides UX, server enforces"
  - id: suspended-consent-status
    choice: "Under-13 accounts created as suspended_consent"
    reason: "Accounts exist but cannot be used until parent approves"
metrics:
  duration: "5 minutes"
  completed: "2026-01-31"
---

# Phase 2 Plan 5: Signup Flow Modification Summary

**One-liner:** Two-stage COPPA-compliant signup: DOB collection via AgeGate, parent email for under-13 users, suspended accounts pending consent.

## What Was Built

### 1. ParentEmailStep Component (`src/components/auth/ParentEmailStep.jsx`)

Collects parent/guardian email when user is under 13:

| Feature | Description |
|---------|-------------|
| Email inputs | Parent email + confirmation field |
| Validation | Match check, format validation |
| Info banner | Explains why parent email is needed |
| Navigation | Back button to age gate, Continue to details |

**Styling:**
- Matches existing auth form styling
- Info banner with indigo accent
- Mail icons in input fields
- Responsive layout

### 2. SignupForm Two-Stage Flow (`src/components/auth/SignupForm.jsx`)

Modified to implement age-first signup:

| Step | Condition | Component |
|------|-----------|-----------|
| `age` | Always first | AgeGate |
| `parent-email` | If under 13 | ParentEmailStep |
| `details` | After age/parent email | Existing form |

**Flow logic:**
```
Start
  ↓
AgeGate (collect DOB)
  ↓
isUnder13?
  ├─ YES → ParentEmailStep → Account Details
  └─ NO → Account Details
```

**Title changes by step:**
- `age`: "Let's Get Started"
- `parent-email`: "Almost There!"
- `details`: "Create Account"

### 3. useSignup Hook COPPA Support (`src/features/authentication/useSignup.js`)

Enhanced to handle COPPA-required fields:

| Parameter | Purpose |
|-----------|---------|
| `dateOfBirth` | Stored as `date_of_birth` in DB |
| `parentEmail` | Stored as `parent_email` in DB |

**Under-13 account creation:**
```javascript
account_status: isUnder13 ? 'suspended_consent' : 'active'
```

**Consent email triggered:**
- After student record created
- Only for under-13 with parent email
- Uses `sendParentalConsentEmail` from consentService

**Success message:**
- Under-13: "Account created! We've sent an email to jo***@example.com for approval."
- Adults: Standard confirmation message

## Integration Points

### With 02-02 (AgeGate)

```
SignupForm.jsx ─────> AgeGate.jsx
                       ↓
                returns { dob: Date, isUnder13: boolean }
```

### With 02-04 (ConsentService)

```
useSignup.js ─────> sendParentalConsentEmail(userId, parentEmail)
                     ↓
               creates token, stores hash, logs request
```

### With 02-01 (Database Schema)

```
useSignup.js ─────> students table
                     │
                     ├─ date_of_birth (DATE)
                     ├─ parent_email (TEXT)
                     └─ account_status ('suspended_consent' | 'active')
```

## User Flow

```
1. User clicks "Create Account"
2. AgeGate appears: "When is your birthday?"
3. User selects month/day/year, clicks Continue
4. If under 13:
   a. ParentEmailStep appears
   b. User enters parent email (twice)
   c. Clicks Continue
5. Account details form appears
6. User fills in name, email, password
7. Clicks Create Account
8. If under 13:
   - Account created with status 'suspended_consent'
   - Consent email sent to parent
   - Success message shows masked parent email
9. If 13+:
   - Account created with status 'active'
   - Standard confirmation email sent
```

## Commits

| Hash | Message | Files |
|------|---------|-------|
| `749a646` | feat(02-05): create ParentEmailStep component for under-13 users | ParentEmailStep.jsx |
| `458777d` | feat(02-05): implement two-stage signup flow with age gate | SignupForm.jsx |
| `01d7c7c` | feat(02-05): update useSignup hook for COPPA compliance | useSignup.js |
| `466c766` | style(02-05): fix lint issues in signup components | ParentEmailStep.jsx, SignupForm.jsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unescaped apostrophes in ParentEmailStep**
- **Found during:** Verification (lint check)
- **Issue:** React/JSX lint error for apostrophes in text
- **Fix:** Changed "you're" to "you are", "guardian's" to "guardian", "They'll" to "They will"
- **Files:** ParentEmailStep.jsx
- **Commit:** 466c766

**2. [Rule 2 - Missing Critical] Removed unused imports in SignupForm**
- **Found during:** Verification (lint check)
- **Issue:** Unused imports from lucide-react after modification
- **Fix:** Removed Music, Piano, Sparkles imports
- **Files:** SignupForm.jsx
- **Commit:** 466c766

## Next Phase Readiness

**Ready for 02-06 (Privacy Dashboard):**
- Signup flow now creates proper COPPA-compliant accounts
- Under-13 accounts are suspended until consent verified
- Parent email stored for future communication

**Integration notes:**
- Privacy dashboard can use `getConsentStatus` to show consent state
- Suspended accounts will see consent-pending UI (needs 02-06 implementation)
- Teachers remain unaffected by age gate (assumed adults)

## Technical Notes

### Defense in Depth

Age calculation happens in two places:

1. **Client-side (UX):** Decides which steps to show
```javascript
function calculateIsUnder13(dateOfBirth) {
  const thirteenYearsAgo = new Date(
    today.getFullYear() - 13,
    today.getMonth(),
    today.getDate()
  );
  return dateOfBirth > thirteenYearsAgo;
}
```

2. **Server-side (enforcement):** Database trigger updates `is_under_13` column

### Email Masking

Parent email is masked in success message for privacy:
```javascript
const maskedEmail = parentEmail.replace(/(.{2}).*@/, '$1***@');
// "john.doe@example.com" → "jo***@example.com"
```

### Consent Email Error Handling

Consent email failures are logged but don't block signup:
```javascript
if (isUnder13 && parentEmail) {
  try {
    await sendParentalConsentEmail(userId, parentEmail);
  } catch (consentError) {
    console.warn("Failed to send consent email:", consentError);
    // Account created, email can be resent from privacy dashboard
  }
}
```
