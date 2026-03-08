# Phase 2: COPPA Compliance Implementation - Research

**Researched:** 2026-02-01
**Domain:** COPPA compliance, parental consent flows, data privacy, user management
**Confidence:** MEDIUM (regulatory requirements from official FTC sources verified; implementation patterns from established practices)

## Summary

This research investigated the technical requirements for implementing COPPA compliance in a React/Supabase educational application targeting children under 13. The April 2026 FTC COPPA rule updates require significant changes including age gates, verifiable parental consent, data retention limits, and third-party SDK auditing.

The existing codebase has a solid foundation with authorization utilities (`verifyStudentDataAccess`), teacher-student connection patterns, and RLS policies. However, it lacks age verification, parental consent tracking, data export capabilities, and account deletion flows required for COPPA compliance.

The implementation approach uses: (1) Supabase Auth hooks for age gate integration, (2) database tables for consent and suspension state, (3) Supabase email/magic link for parental verification, (4) custom JSON export functions, and (5) soft delete with scheduled hard deletion.

**Primary recommendation:** Implement a two-stage signup flow where DOB collection precedes account creation, with under-13 accounts suspended until parent email verification completes via Supabase magic link.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Auth | ^2.48.1 | Authentication with hooks | Already in codebase; "Before User Created" hook enables age gate |
| @supabase/supabase-js | ^2.48.1 | Database operations | Already in codebase; needed for consent tables and deletion |
| Native HTML `<select>` | N/A | DOB dropdown picker | Decision: dropdowns over date pickers for child-friendly UX |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase Edge Functions | N/A | Scheduled deletion jobs | For 30-day soft delete cleanup |
| Supabase Magic Link | Built-in | Parental consent verification | Email verification flow for parents |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native select dropdowns | react-dropdown-date | Extra dependency for minimal benefit; native works well |
| Supabase scheduled functions | External cron (Vercel) | Supabase preferred for data locality |
| Email verification | SMS verification | Email simpler, no additional cost, FTC-approved |

**Installation:**
```bash
# No new dependencies needed - use existing Supabase stack
```

## Architecture Patterns

### Recommended Database Schema Additions
```sql
-- Add to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS
  date_of_birth DATE,
  is_under_13 BOOLEAN GENERATED ALWAYS AS (
    date_of_birth > CURRENT_DATE - INTERVAL '13 years'
  ) STORED,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended_consent', 'suspended_deletion', 'deleted')),
  parent_email TEXT,
  consent_verified_at TIMESTAMP WITH TIME ZONE,
  consent_revoked_at TIMESTAMP WITH TIME ZONE,
  deletion_requested_at TIMESTAMP WITH TIME ZONE,
  deletion_scheduled_at TIMESTAMP WITH TIME ZONE,
  musical_nickname TEXT;

-- Consent audit log (required for COPPA compliance)
CREATE TABLE IF NOT EXISTS parental_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('requested', 'verified', 'revoked', 'expired')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consent tokens for email verification
CREATE TABLE IF NOT EXISTS parental_consent_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Recommended Project Structure
```
src/
├── components/
│   └── auth/
│       ├── AgeGate.jsx           # DOB collection with dropdowns
│       ├── ParentalConsentPending.jsx  # Suspended account UI
│       └── SignupForm.jsx        # Modified to include age gate
├── services/
│   ├── consentService.js         # Parental consent operations
│   ├── dataExportService.js      # COPPA data export (JSON)
│   └── accountDeletionService.js # Soft/hard delete operations
├── pages/
│   ├── ParentConsentConfirm.jsx  # Parent clicks email link
│   └── PrivacyDashboard.jsx      # "Your Data" settings page
└── hooks/
    └── useAccountStatus.js       # Check suspension state
```

### Pattern 1: Two-Stage Signup Flow
**What:** Collect DOB before creating auth account, suspend under-13 accounts immediately
**When to use:** All student self-registrations
**Example:**
```javascript
// SignupForm.jsx - Stage 1: Age check before auth
const handleDOBSubmit = async (dob) => {
  const birthDate = new Date(dob.year, dob.month - 1, dob.day);
  const age = calculateAge(birthDate);

  if (age < 13) {
    // Store DOB temporarily, require parent email
    setShowParentEmailStep(true);
    setDobData({ dob: birthDate, isUnder13: true });
  } else {
    // Proceed to normal signup
    setShowSignupStep(true);
    setDobData({ dob: birthDate, isUnder13: false });
  }
};

// After signup, if under 13, set suspended state
const handleSignupComplete = async (userId) => {
  if (dobData.isUnder13) {
    await supabase.from('students').update({
      date_of_birth: dobData.dob,
      account_status: 'suspended_consent',
      parent_email: parentEmail
    }).eq('id', userId);

    await sendParentalConsentEmail(userId, parentEmail);
  }
};
```

### Pattern 2: Parental Consent Email Flow
**What:** Send verification email to parent, verify via magic link or token
**When to use:** All under-13 student registrations
**Example:**
```javascript
// consentService.js
export async function sendParentalConsentEmail(studentId, parentEmail) {
  // Generate consent token
  const token = crypto.randomUUID();
  const tokenHash = await hashToken(token);

  // Store token with 7-day expiry
  await supabase.from('parental_consent_tokens').insert({
    student_id: studentId,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  // Log consent request
  await supabase.from('parental_consent_log').insert({
    student_id: studentId,
    parent_email: parentEmail,
    action: 'requested'
  });

  // Send email using Supabase edge function or email service
  const consentUrl = `${window.location.origin}/consent/verify?token=${token}&student=${studentId}`;
  // Email sent via Supabase email templates or external service
}

export async function verifyParentalConsent(studentId, token) {
  const tokenHash = await hashToken(token);

  // Check token validity
  const { data: consentToken } = await supabase
    .from('parental_consent_tokens')
    .select('*')
    .eq('student_id', studentId)
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!consentToken) {
    throw new Error('Invalid or expired consent token');
  }

  // Mark token used and activate account
  await supabase.from('parental_consent_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', consentToken.id);

  await supabase.from('students').update({
    account_status: 'active',
    consent_verified_at: new Date().toISOString()
  }).eq('id', studentId);

  // Log verification
  await supabase.from('parental_consent_log').insert({
    student_id: studentId,
    parent_email: consentToken.parent_email,
    action: 'verified'
  });
}
```

### Pattern 3: Data Export (COPPA Right to Access)
**What:** Export all student data as downloadable JSON
**When to use:** Teacher/parent requests data export
**Example:**
```javascript
// dataExportService.js
export async function exportStudentData(studentId) {
  // Verify access (teacher connection or parent)
  await verifyStudentDataAccess(studentId);

  // Gather all data tables for this student
  const [
    profile,
    scores,
    skillProgress,
    dailyGoals,
    practiceSessions,
    achievements,
    assignments
  ] = await Promise.all([
    supabase.from('students').select('*').eq('id', studentId).single(),
    supabase.from('students_score').select('*').eq('student_id', studentId),
    supabase.from('student_skill_progress').select('*').eq('student_id', studentId),
    supabase.from('student_daily_goals').select('*').eq('student_id', studentId),
    supabase.from('practice_sessions').select('*').eq('student_id', studentId),
    supabase.from('student_achievements').select('*').eq('student_id', studentId),
    supabase.from('assignment_submissions').select('*, assignments(*)').eq('student_id', studentId)
  ]);

  const exportData = {
    exportDate: new Date().toISOString(),
    studentId: studentId,
    profile: profile.data,
    scores: scores.data,
    skillProgress: skillProgress.data,
    dailyGoals: dailyGoals.data,
    practiceSessions: practiceSessions.data,
    achievements: achievements.data,
    assignments: assignments.data
  };

  // Return as downloadable JSON
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  return URL.createObjectURL(blob);
}
```

### Pattern 4: Soft Delete with Grace Period
**What:** 30-day soft delete before permanent removal
**When to use:** Account deletion requests
**Example:**
```javascript
// accountDeletionService.js
export async function requestAccountDeletion(studentId, confirmationName) {
  await verifyStudentDataAccess(studentId);

  // Verify name confirmation
  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name, username')
    .eq('id', studentId)
    .single();

  const expectedName = `${student.first_name} ${student.last_name}`.trim() || student.username;
  if (confirmationName.toLowerCase() !== expectedName.toLowerCase()) {
    throw new Error('Account name does not match');
  }

  const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Soft delete - suspend account and schedule deletion
  await supabase.from('students').update({
    account_status: 'suspended_deletion',
    deletion_requested_at: new Date().toISOString(),
    deletion_scheduled_at: deletionDate.toISOString()
  }).eq('id', studentId);

  // Sign out user
  await supabase.auth.signOut();

  return { scheduledDeletion: deletionDate };
}

// Scheduled function (Edge Function with cron)
export async function processScheduledDeletions() {
  // Find accounts past deletion date
  const { data: toDelete } = await supabase
    .from('students')
    .select('id')
    .eq('account_status', 'suspended_deletion')
    .lt('deletion_scheduled_at', new Date().toISOString());

  for (const student of toDelete || []) {
    // Hard delete - CASCADE will handle related tables
    await supabase.from('students').delete().eq('id', student.id);
    // Also delete from auth.users
    await supabase.auth.admin.deleteUser(student.id);
  }
}
```

### Anti-Patterns to Avoid
- **Collecting DOB after account creation:** COPPA requires knowing age BEFORE collecting personal information
- **Allowing app use during consent pending:** Child must not use app until parent verifies
- **Hard delete without grace period:** 30-day recovery window decided by user
- **Trusting age checkbox instead of DOB:** "Are you 13?" is not a valid age gate per FTC

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email verification | Custom token system | Supabase Magic Link / OTP | Built-in, secure, handles expiry |
| Password hashing for tokens | Manual crypto | crypto.subtle.digest | Browser native, secure |
| Scheduled deletions | setInterval in app | Supabase Edge Functions with cron | Reliable, serverless, database-local |
| Date calculations | Manual date math | Date-fns or native Date | Timezone handling, leap years |
| DOB validation | Custom validators | Native Date parsing | Edge case handling built-in |

**Key insight:** COPPA compliance requires audit trails and provable consent. Using established patterns reduces risk of missing edge cases that could constitute violations.

## Common Pitfalls

### Pitfall 1: Age Gate Bypass via Direct API
**What goes wrong:** User bypasses frontend age gate by calling Supabase Auth directly
**Why it happens:** Frontend-only age validation
**How to avoid:** Use Supabase "Before User Created" auth hook to validate DOB server-side
**Warning signs:** Accounts created without DOB field populated

### Pitfall 2: Consent Token Reuse
**What goes wrong:** Same consent token used multiple times
**Why it happens:** Not marking tokens as used after verification
**How to avoid:** Set `used_at` timestamp on verification, check in validation
**Warning signs:** Multiple consent log entries from same token

### Pitfall 3: Data Export Missing Tables
**What goes wrong:** Export omits some user data tables
**Why it happens:** New tables added without updating export function
**How to avoid:** Maintain list of all student-related tables in one place, review on schema changes
**Warning signs:** User complains their exported data is incomplete

### Pitfall 4: Soft Delete Without RLS Updates
**What goes wrong:** Deleted users still visible in queries
**Why it happens:** RLS policies don't filter by `account_status`
**How to avoid:** Update RLS policies to exclude deleted/suspended accounts for most operations
**Warning signs:** "Ghost" users appearing in leaderboards or teacher dashboards

### Pitfall 5: Mixed Audience Site Definition
**What goes wrong:** Treating entire app as child-directed when only some features are
**Why it happens:** Misunderstanding of "mixed audience" COPPA rules
**How to avoid:** Per 2026 rules, implement age-appropriate experiences; teachers are not child users
**Warning signs:** Overly restrictive data collection for adult (teacher) users

### Pitfall 6: Third-Party SDK Data Collection
**What goes wrong:** Dependencies phone home with user data without consent
**Why it happens:** Not auditing npm dependencies
**How to avoid:** Run `npm audit` and manually review analytics/crash reporting packages
**Warning signs:** Network requests to unknown domains in browser devtools

## Code Examples

Verified patterns from official sources:

### DOB Dropdown Component
```jsx
// components/auth/AgeGate.jsx
import { useState } from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function AgeGate({ onSubmit, onBack }) {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!month || !day || !year) return;

    onSubmit({
      month: parseInt(month),
      day: parseInt(day),
      year: parseInt(year)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-white/80">
        When is your birthday?
      </p>

      <div className="grid grid-cols-3 gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border-2 border-white/20 bg-white/15 text-white p-2"
          required
        >
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>

        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="rounded-lg border-2 border-white/20 bg-white/15 text-white p-2"
          required
        >
          <option value="">Day</option>
          {days.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-lg border-2 border-white/20 bg-white/15 text-white p-2"
          required
        >
          <option value="">Year</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-indigo-600 text-white rounded-lg"
      >
        Continue
      </button>
    </form>
  );
}
```

### Account Status Check Hook
```javascript
// hooks/useAccountStatus.js
import { useEffect, useState } from 'react';
import supabase from '../services/supabase';

export function useAccountStatus(userId) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function checkStatus() {
      const { data } = await supabase
        .from('students')
        .select('account_status, parent_email')
        .eq('id', userId)
        .single();

      setStatus(data?.account_status || 'active');
      setLoading(false);
    }

    checkStatus();
  }, [userId]);

  return { status, loading, isSuspended: status?.startsWith('suspended') };
}
```

### Suspended Account UI
```jsx
// components/auth/ParentalConsentPending.jsx
export function ParentalConsentPending({ parentEmail, onResendEmail }) {
  return (
    <div className="text-center p-8 bg-indigo-900/50 rounded-2xl">
      <div className="text-6xl mb-4">
        {/* Child-friendly illustration */}
        <span role="img" aria-label="mailbox">📬</span>
      </div>

      <h2 className="text-xl font-bold text-white mb-2">
        Almost there!
      </h2>

      <p className="text-white/80 mb-4">
        Ask your parent to check their email so you can start playing!
      </p>

      <p className="text-sm text-white/60 mb-4">
        We sent an email to: {parentEmail?.replace(/(.{2}).*@/, '$1***@')}
      </p>

      <button
        onClick={onResendEmail}
        className="text-indigo-300 underline text-sm"
      >
        Resend email to parent
      </button>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| "Are you 13?" checkbox | Neutral DOB entry | 2026 COPPA update | Checkbox no longer compliant |
| Indefinite data retention | Define retention periods | April 2026 | Must specify when data deleted |
| Single consent for all uses | Separate consent for ads/3rd parties | April 2026 | Advertising needs separate opt-in |
| Delete on request (immediate) | Soft delete grace period | Best practice | User can recover during grace period |

**Deprecated/outdated:**
- Age checkboxes: FTC specifically calls out "neutral" age gates required
- Single consent covering everything: 2026 rules require separate consent for third-party sharing
- Permanent cookies before consent: Only session data allowed pre-consent

## Open Questions

Things that couldn't be fully resolved:

1. **Supabase COPPA-specific DPA**
   - What we know: Supabase has a standard DPA available at supabase.com/legal/dpa
   - What's unclear: Whether Supabase has specific COPPA Safe Harbor certification or child data provisions
   - Recommendation: Review DPA for COPPA language; may need custom DPA for child data. Contact Supabase support for confirmation.

2. **Edge Function Cron for Scheduled Deletions**
   - What we know: Supabase Edge Functions support cron triggers
   - What's unclear: Exact configuration for scheduled function execution on Free tier
   - Recommendation: Use Supabase Edge Functions with pg_cron, or fallback to Vercel cron if needed

3. **Recovery Flow During Soft Delete**
   - What we know: 30-day grace period decided by user
   - What's unclear: UX for recovery (new signup? special login flow?)
   - Recommendation: Allow login during grace period with prominent "cancel deletion" option

4. **Teacher-Added Under-13 Students**
   - What we know: Teachers must provide parent email for under-13 students
   - What's unclear: Should consent flow differ from self-registration?
   - Recommendation: Same consent flow, but teacher can resend consent email; teacher sees "pending" status

## Sources

### Primary (HIGH confidence)
- FTC COPPA FAQ: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions - Official COPPA requirements
- Supabase Auth Hooks: https://supabase.com/docs/guides/auth/auth-hooks - Before User Created hook for age gate
- Supabase User Management: https://supabase.com/docs/guides/auth/managing-user-data - Deletion and export patterns

### Secondary (MEDIUM confidence)
- Wipfli 2026 COPPA Changes: https://www.wipfli.com/insights/articles/is-your-institution-ready-for-coppas-2026-changes-to-better-protect-childrens-online-privacy - April 2026 deadline confirmed
- Promise Legal COPPA Guide: https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/ - EdTech-specific VPC guidance
- Evil Martians Soft Delete: https://evilmartians.com/chronicles/soft-deletion-with-postgresql-but-with-logic-on-the-database - PostgreSQL soft delete patterns

### Tertiary (LOW confidence)
- FPF Parental Consent Whitepaper: https://fpf.org/wp-content/uploads/2021/11/FPF-The-State-of-Play-Verifiable-Parental-Consent-and-COPPA.pdf - 2021, may be outdated
- NPM Security Audit Guide: https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/ - Standard npm audit documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing Supabase infrastructure, no new dependencies required
- Architecture: MEDIUM - Patterns derived from established practices, but not from identical COPPA implementations
- Pitfalls: MEDIUM - Derived from COPPA requirements and general security knowledge
- Regulatory: MEDIUM - FTC sources verified but 2026 rules are new, interpretation evolving

**Research date:** 2026-02-01
**Valid until:** 2026-04-22 (COPPA compliance deadline - rules finalized)
