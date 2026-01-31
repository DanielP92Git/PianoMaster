---
phase: 02-coppa-compliance
plan: 04
subsystem: services
tags: [coppa, consent, export, deletion, security]
dependencies:
  requires: ["02-01"]
  provides: ["parental-consent-service", "data-export-service", "account-deletion-service"]
  affects: ["02-05", "02-06"]
tech-stack:
  added: []
  patterns: ["Web Crypto API", "soft-delete", "parallel-queries"]
key-files:
  created:
    - src/services/consentService.js
    - src/services/dataExportService.js
    - src/services/accountDeletionService.js
  modified: []
decisions:
  - id: consent-token-hash
    choice: "SHA-256 via Web Crypto API"
    reason: "Browser-native, secure, no dependencies"
  - id: export-parallel
    choice: "Query all tables in parallel"
    reason: "Performance optimization for 10+ tables"
  - id: deletion-confirmation
    choice: "Require name confirmation"
    reason: "Prevent accidental deletion, especially important for child accounts"
metrics:
  duration: "3 minutes"
  completed: "2026-01-31"
---

# Phase 2 Plan 4: COPPA Compliance Services Summary

**One-liner:** Three client-side services for parental consent verification, COPPA data export, and soft-delete account deletion with 30-day recovery.

## What Was Built

### 1. Consent Service (`src/services/consentService.js`)

Token-based parental consent verification system:

| Function | Purpose |
|----------|---------|
| `sendParentalConsentEmail` | Generate token, store hash, return verification URL |
| `verifyParentalConsent` | Validate token, activate account |
| `resendConsentEmail` | Invalidate old tokens, send new |
| `revokeConsent` | Suspend account, schedule deletion |
| `getConsentStatus` | Check consent state for UI |
| `getPendingConsentRequest` | Check for active consent requests |

**Security features:**
- SHA-256 token hashing via Web Crypto API
- 7-day token expiry
- Authorization checks on all functions
- Audit logging to `parental_consent_log`

### 2. Data Export Service (`src/services/dataExportService.js`)

COPPA right-to-access implementation:

| Function | Purpose |
|----------|---------|
| `exportStudentData` | Query all 10 student data tables in parallel |
| `downloadStudentDataJSON` | Create blob URL for browser download |
| `getExportedDataTypes` | List data types for privacy dashboard |
| `getDataSummary` | Record counts without full data |

**Tables exported:**
- `students` - Profile information
- `students_score` - Game scores
- `student_skill_progress` - Trail progress
- `student_daily_goals` - Daily goals
- `practice_sessions` - Practice recordings
- `student_achievements` - Achievements
- `assignment_submissions` - Teacher assignments
- `parental_consent_log` - Consent history
- `student_point_transactions` - Point history
- `user_accessories` - Avatar accessories

### 3. Account Deletion Service (`src/services/accountDeletionService.js`)

COPPA right-to-deletion with soft-delete pattern:

| Function | Purpose |
|----------|---------|
| `requestAccountDeletion` | Start 30-day soft delete, requires name confirmation |
| `cancelDeletionRequest` | Restore account during grace period |
| `getAccountDeletionStatus` | Show deletion status and days remaining |
| `checkAccountRecoverable` | Login flow recovery check |

**Safety features:**
- Name confirmation prevents accidental deletion
- 30-day grace period for recovery
- Auto sign-out after deletion request
- Clear status for UI display

## Integration Points

### With 02-01 (COPPA Schema)

Services connect to tables created in 02-01:

```
consentService.js ─────> parental_consent_tokens (token_hash lookup)
                  ─────> parental_consent_log (audit logging)
                  ─────> students (account_status, consent_verified_at)

dataExportService.js ──> All 10 student data tables (parallel queries)

accountDeletionService.js ──> students (deletion_* fields)
```

### With Future UI Components (02-05, 02-06)

These services will be consumed by:
- Privacy Dashboard UI (export, deletion status)
- Consent Verification Page (token validation)
- Age Gate flow (consent requirement check)
- Account Settings (deletion request)

## Commits

| Hash | Message | Files |
|------|---------|-------|
| `5b730ed` | feat(02-04): add parental consent service | consentService.js |
| `dbb01f0` | feat(02-04): add COPPA data export service | dataExportService.js |
| `e453db0` | feat(02-04): add account deletion service | accountDeletionService.js |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed import path for verifyStudentDataAccess**
- **Found during:** Task 2
- **Issue:** Plan referenced `authService.js` but function is in `authorizationUtils.js`
- **Fix:** Import from correct location
- **Files:** dataExportService.js, accountDeletionService.js

**2. [Rule 2 - Missing Critical] Added getPendingConsentRequest function**
- **Found during:** Task 1
- **Issue:** UI needs to know if consent request is pending to show "resend" vs "send"
- **Fix:** Added function to check for unexpired pending tokens
- **Files:** consentService.js

**3. [Rule 2 - Missing Critical] Added getDataSummary function**
- **Found during:** Task 2
- **Issue:** Privacy dashboard needs record counts without full data download
- **Fix:** Added count-only query function
- **Files:** dataExportService.js

**4. [Rule 2 - Missing Critical] Added checkAccountRecoverable function**
- **Found during:** Task 3
- **Issue:** Login flow needs quick check if deleted account can be recovered
- **Fix:** Added helper function for login redirect logic
- **Files:** accountDeletionService.js

## Next Phase Readiness

**Ready for 02-05 (Privacy Dashboard UI):**
- All service functions exported and documented
- Error messages are user-friendly for UI display
- Status functions provide all data needed for UI state

**Edge Function requirement documented:**
- Hard delete after grace period requires server-side Edge Function
- Function specification included in accountDeletionService.js comments
- Should be added to Phase 3 or documented as operational task

## Technical Notes

### Token Hashing

```javascript
async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

Uses browser-native Web Crypto API - no external dependencies, consistent hashing across client and server.

### Parallel Export Pattern

```javascript
const queries = STUDENT_DATA_TABLES.map(async ({ table, idColumn }) => {
  // ... query each table
});
const results = await Promise.all(queries);
```

Queries all tables simultaneously for faster export.

### Deletion Safety

1. Name confirmation required
2. 30-day grace period
3. Auto sign-out
4. Can cancel anytime during grace period
5. Hard delete only via server-side scheduled job
