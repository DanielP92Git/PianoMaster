# Phase 5: Parental Consent Email - Research

**Researched:** 2026-02-02
**Domain:** Transactional Email via Supabase Edge Functions + Resend API
**Confidence:** HIGH

## Summary

This phase implements working parental consent emails for COPPA compliance using Supabase Edge Functions and the Resend API. The research confirms that Supabase officially recommends Resend as the preferred email service for Edge Functions, with excellent documentation and first-party integration support.

The standard approach is to create a Deno-based Edge Function that uses fetch() to call Resend's REST API. Email templates should use inline CSS and table-based layouts for maximum email client compatibility. The existing codebase already has complete database schema (parental_consent_tokens, parental_consent_log) and client-side services (consentService.js) in place - only the Edge Function and email template need to be implemented.

The 406 error fix in apiAuth.js requires changing `.single()` to `.maybeSingle()` for queries that may return zero results, preventing console errors during role detection.

**Primary recommendation:** Use Supabase Edge Functions with Resend API via fetch(), create HTML email template with inline CSS, store RESEND_API_KEY in Supabase secrets, invoke from React client using supabase.functions.invoke().

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Edge Functions | Latest | Serverless function runtime for sending emails | Official Supabase solution, globally distributed, Deno-based |
| Resend API | REST v1 | Transactional email delivery service | Officially recommended by Supabase, developer-friendly API, excellent deliverability |
| Deno.serve() | Built-in | Edge Function entry point | Required for all Edge Functions as of 2026 (replaces deprecated serve import) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Email | 5.x (optional) | Component-based email templates | For complex templates; can be skipped for simple HTML strings |
| @react-email/components | Latest | Pre-built email components | If using React Email library |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | SendGrid | SendGrid requires more configuration, Resend has better DX and Supabase integration |
| Resend | Nodemailer + SMTP | SMTP is lower-level, requires more error handling, slower than API approach |
| Edge Functions | Direct client-side API call | Would expose API keys to client, security risk |

**Installation:**
```bash
# No npm packages needed - Edge Functions use Deno
# Resend API called via fetch()

# Optional: For building complex email templates locally
npm install react-email @react-email/components -D
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/
├── functions/
│   └── send-consent-email/
│       ├── index.ts              # Edge Function handler
│       └── email-template.ts     # HTML email template (or inline string)
```

### Pattern 1: Edge Function with Resend API
**What:** Serverless function that receives email parameters and calls Resend API
**When to use:** All transactional email needs (consent, notifications, etc.)
**Example:**
```typescript
// Source: https://resend.com/docs/send-with-supabase-edge-functions
// Source: https://supabase.com/docs/guides/functions/examples/send-emails

Deno.serve(async (req) => {
  const { parentEmail, consentUrl, childName } = await req.json();

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'PianoMaster <noreply@yourdomain.com>',
      to: [parentEmail],
      subject: 'Parental Consent Required for Your Child',
      html: generateEmailHTML(consentUrl, childName),
    }),
  });

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Pattern 2: Invoking Edge Function from React Client
**What:** Use Supabase client library to call Edge Function with automatic auth
**When to use:** When sending emails triggered by user actions
**Example:**
```javascript
// Source: https://supabase.com/docs/reference/javascript/functions-invoke

import { supabase } from './supabase';

export async function sendParentalConsentEmail(studentId, parentEmail) {
  // Generate token and consent URL (existing logic)
  const token = crypto.randomUUID();
  const consentUrl = `${window.location.origin}/consent/verify?token=${token}&student=${studentId}`;

  // Call Edge Function
  const { data, error } = await supabase.functions.invoke('send-consent-email', {
    body: {
      parentEmail,
      consentUrl,
      childName: 'Piano Student', // or fetch from profile
    },
  });

  if (error) throw error;
  return data;
}
```

### Pattern 3: HTML Email Template with Inline CSS
**What:** Table-based layout with inline styles for email client compatibility
**When to use:** All HTML emails (Gmail, Outlook, Apple Mail have inconsistent CSS support)
**Example:**
```typescript
// Source: https://mailtrap.io/blog/building-html-email-template/
// Source: https://mailtrap.io/blog/responsive-email-design/

function generateConsentEmailHTML(consentUrl: string, childName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parental Consent Required</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">Parental Consent Required</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 20px 40px; font-size: 16px; line-height: 24px; color: #555555;">
              <p style="margin: 0 0 16px;">Hi there,</p>
              <p style="margin: 0 0 16px;">Your child has created an account on <strong>PianoMaster</strong>, a music learning app for kids. Because your child is under 13, we need your permission before they can start learning.</p>
              <p style="margin: 0 0 24px;">Click the button below to give consent:</p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <a href="${consentUrl}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Verify Consent</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; font-size: 14px; line-height: 20px; color: #888888; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 8px;">This link expires in 7 days.</p>
              <p style="margin: 0;">If you didn't expect this email, you can safely ignore it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
```

### Pattern 4: Secrets Management
**What:** Store API keys in Supabase secrets, access via Deno.env.get()
**When to use:** All sensitive credentials (API keys, tokens)
**Example:**
```bash
# Source: https://supabase.com/docs/guides/functions/secrets

# Local development (.env file)
RESEND_API_KEY=re_abc123xyz

# Set production secret via CLI
supabase secrets set RESEND_API_KEY=re_abc123xyz

# Or set multiple secrets from file
supabase secrets set --env-file ./supabase/.env.production

# Access in Edge Function code
const apiKey = Deno.env.get('RESEND_API_KEY');
```

### Anti-Patterns to Avoid
- **Don't use .single() for queries that may return 0 rows:** Use .maybeSingle() instead to avoid 406 errors
- **Don't use external CSS in emails:** Most email clients strip <style> tags; use inline styles only
- **Don't expose API keys in client-side code:** Always call email APIs from server-side (Edge Functions)
- **Don't use ES6 imports in Deno:** Use Deno.serve() directly, not deprecated serve import
- **Don't hardcode email sender domain:** Must verify domain with Resend first

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email delivery infrastructure | Custom SMTP server or direct email sending | Resend API | Deliverability is complex: SPF, DKIM, DMARC, IP reputation, bounce handling |
| Email template rendering | String concatenation or template literals | React Email or table-based HTML | Email client CSS support is inconsistent; tested templates save hours of debugging |
| Token generation and hashing | Custom crypto implementation | crypto.randomUUID() + Web Crypto API SHA-256 | Browser crypto is audited and secure; custom implementations have vulnerabilities |
| JWT verification in Edge Functions | Manual parsing and validation | jose library with JWKS endpoint | JWT signature verification requires cryptographic libraries; manual implementation is error-prone |
| Rate limiting for email sends | Custom throttling logic | Supabase rate limiting table or Upstash | Distributed rate limiting requires coordination; existing solutions handle edge cases |

**Key insight:** Email deliverability and security are specialized domains with non-obvious edge cases. Using battle-tested services (Resend) and libraries (jose, Web Crypto API) prevents common pitfalls like emails going to spam, token replay attacks, or race conditions.

## Common Pitfalls

### Pitfall 1: Using .single() for Queries That May Return Zero Results
**What goes wrong:** 406 Not Acceptable errors appear in console when querying tables that might have no matching rows
**Why it happens:** .single() expects exactly 1 row and throws an error if 0 or >1 rows are returned
**How to avoid:** Use .maybeSingle() for optional records (returns { data: null, error: null } when no rows found)
**Warning signs:** Console shows "406 Not Acceptable" errors during role detection or consent token lookups

**Fix location:** src/services/apiAuth.js lines 101-106 and 113-118 (teacher/student role detection)
**Code example:**
```javascript
// BAD: Throws 406 if user is not a teacher
const { data: teacherData, error: teacherError } = await supabase
  .from("teachers")
  .select("*")
  .eq("id", user.id)
  .single();

// GOOD: Returns null if user is not a teacher
const { data: teacherData, error: teacherError } = await supabase
  .from("teachers")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();
```

### Pitfall 2: Email Sender Domain Not Verified
**What goes wrong:** Resend API returns 403 Forbidden error when trying to send from unverified domain
**Why it happens:** Email providers require domain verification (SPF/DKIM) to prevent spam
**How to avoid:** Verify your domain in Resend Dashboard before deploying Edge Function
**Warning signs:** Edge Function logs show "Domain not verified" or 403 errors from Resend API

### Pitfall 3: Forgot to Set RESEND_API_KEY Secret
**What goes wrong:** Edge Function fails with "undefined" when trying to access Deno.env.get('RESEND_API_KEY')
**Why it happens:** Secrets must be explicitly set in Supabase Dashboard or via CLI
**How to avoid:** Run `supabase secrets set RESEND_API_KEY=<key>` before deploying, test locally with .env file
**Warning signs:** Edge Function logs show "undefined" or "Missing API key" errors

### Pitfall 4: HTML Email Displays Broken in Outlook
**What goes wrong:** Email looks perfect in Gmail but has broken layout in Outlook
**Why it happens:** Outlook uses Microsoft Word rendering engine with very limited CSS support
**How to avoid:** Use table-based layouts, inline CSS only, avoid flexbox/grid, test with Email on Acid or Litmus
**Warning signs:** Recipient reports email looks "weird" or "broken" in Outlook

### Pitfall 5: Token Expires Before Parent Sees Email
**What goes wrong:** Parent clicks link but gets "expired token" error
**Why it happens:** Email delivery can be delayed, or parent doesn't check email for several days
**How to avoid:** Use 7-day expiration (168 hours) instead of 24 hours, allow resending with same token if not used
**Warning signs:** High rate of "expired token" errors in consent_log table

### Pitfall 6: Edge Function Has No Timeout
**What goes wrong:** Function hangs indefinitely if Resend API is slow or unresponsive
**Why it happens:** fetch() doesn't have a default timeout in Deno
**How to avoid:** Implement AbortController with 30-second timeout for fetch requests
**Warning signs:** Edge Function logs show long execution times or timeouts

### Pitfall 7: Consent URL Not URL-Encoded
**What goes wrong:** Token with special characters breaks the URL in email
**Why it happens:** crypto.randomUUID() generates URL-safe strings, but future token implementations might not
**How to avoid:** Use encodeURIComponent() when building consent URL query parameters
**Warning signs:** Verification page shows "missing params" error

## Code Examples

Verified patterns from official sources:

### Edge Function Entry Point
```typescript
// Source: https://supabase.com/docs/guides/functions
// Modern Deno.serve() pattern (required as of 2026)

Deno.serve(async (req) => {
  // CORS headers for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Your function logic
    const result = await handleRequest(req);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

### Calling Resend API with Fetch
```typescript
// Source: https://resend.com/docs/send-with-supabase-edge-functions

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${RESEND_API_KEY}`,
  },
  body: JSON.stringify({
    from: 'PianoMaster <noreply@yourdomain.com>',
    to: [parentEmail],
    subject: 'Parental Consent Required',
    html: emailHTML,
  }),
});

if (!res.ok) {
  const error = await res.text();
  throw new Error(`Resend API error: ${error}`);
}

const data = await res.json();
return data; // Returns { id: 'email_id' }
```

### Error Handling for FunctionsHttpError
```javascript
// Source: https://supabase.com/docs/reference/javascript/functions-invoke

import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

try {
  const { data, error } = await supabase.functions.invoke('send-consent-email', {
    body: { parentEmail, consentUrl, childName },
  });

  if (error) throw error;
  return data;
} catch (error) {
  if (error instanceof FunctionsHttpError) {
    // Edge Function returned an error (4xx/5xx)
    console.error('Function error:', error.message, error.context);
  } else if (error instanceof FunctionsRelayError) {
    // Supabase infrastructure error
    console.error('Relay error:', error.message);
  } else if (error instanceof FunctionsFetchError) {
    // Network error (timeout, connection failed)
    console.error('Fetch error:', error.message);
  }
  throw error;
}
```

### Fixing 406 Errors with .maybeSingle()
```javascript
// Source: https://github.com/orgs/supabase/discussions/2284
// Source: https://www.hemantasundaray.com/blog/supabase-single-maybesingle

// BAD: Throws 406 if no teacher record exists
const { data: teacherData, error: teacherError } = await supabase
  .from("teachers")
  .select("*")
  .eq("id", user.id)
  .single();

// GOOD: Returns { data: null, error: null } if no teacher record
const { data: teacherData, error: teacherError } = await supabase
  .from("teachers")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

// Check data instead of error
if (teacherData && !teacherError) {
  userRole = 'teacher';
  profile = teacherData;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| import { serve } from 'deno.land/std' | Deno.serve() built-in | 2025-2026 | Deprecated import path removed; all new functions must use Deno.serve() |
| SendGrid as primary email service | Resend as recommended service | 2024-2025 | Resend has simpler API, better DX, official Supabase integration |
| Manual JWT verification | jose library with JWKS | 2025-2026 | Asymmetric JWT signing keys require cryptographic libraries; manual verification deprecated |
| .single() for all queries | .maybeSingle() for optional records | Ongoing | .single() throws 406 errors in browser console; .maybeSingle() handles gracefully |
| React Email 3.x | React Email 5.x | 2025 | Added Tailwind 4 support, 117% increase in npm downloads |

**Deprecated/outdated:**
- **serve from deno.land/std**: Replaced by built-in Deno.serve() (migration required for existing functions)
- **Hardcoded JWT secrets**: Replaced by JWKS endpoint verification (more secure, supports key rotation)
- **SUPABASE_SERVICE_ROLE_KEY in user_metadata**: Never store in user_metadata (client-accessible); use server-side only

## Open Questions

Things that couldn't be fully resolved:

1. **Resend Free Tier Limits**
   - What we know: Resend has a free tier with monthly email limits
   - What's unclear: Exact current limits and pricing as of Feb 2026
   - Recommendation: Check https://resend.com/pricing before implementation, consider upgrading if app has many under-13 users

2. **Email Testing Strategy**
   - What we know: Email client rendering varies significantly (Gmail vs Outlook vs Apple Mail)
   - What's unclear: Whether project has access to email testing tools (Litmus, Email on Acid)
   - Recommendation: Use free tools like mail-tester.com, send test emails to Gmail/Outlook/Apple Mail accounts

3. **Rate Limiting for Resend Requests**
   - What we know: Resend API has rate limits per API key
   - What's unclear: Specific rate limits for free vs paid tiers
   - Recommendation: Implement client-side cooldown (e.g., "Resend email" button disabled for 60 seconds) to prevent abuse

4. **Domain Verification Process Duration**
   - What we know: Must verify domain in Resend Dashboard before sending emails
   - What's unclear: How long DNS propagation takes, whether sandbox mode is available
   - Recommendation: Verify domain early in phase, use Resend sandbox email addresses for development testing

5. **COPPA Email Content Requirements**
   - What we know: Email must inform parents about data collection and usage (implemented in ConsentVerifyPage.jsx)
   - What's unclear: Whether email body itself needs full COPPA disclosure or if landing page is sufficient
   - Recommendation: Include brief summary in email, link to full disclosure on verification page (current approach is likely compliant)

## Sources

### Primary (HIGH confidence)
- Supabase Edge Functions Documentation - https://supabase.com/docs/guides/functions
- Supabase Send Email Guide - https://supabase.com/docs/guides/functions/examples/send-emails
- Resend with Supabase Edge Functions - https://resend.com/docs/send-with-supabase-edge-functions
- Supabase Functions.invoke() Reference - https://supabase.com/docs/reference/javascript/functions-invoke
- Supabase Secrets Management - https://supabase.com/docs/guides/functions/secrets
- Supabase Edge Functions Auth - https://supabase.com/docs/guides/functions/auth

### Secondary (MEDIUM confidence)
- GitHub Discussion: .single() 406 errors - https://github.com/orgs/supabase/discussions/2284
- Blog: Supabase single() vs maybeSingle() - https://www.hemantasundaray.com/blog/supabase-single-maybesingle
- Mailtrap: Building HTML Email Templates - https://mailtrap.io/blog/building-html-email-template/
- Mailtrap: Responsive Email Design - https://mailtrap.io/blog/responsive-email-design/
- React Email Documentation - https://react.email/docs/integrations/resend
- React Email 5.0 Release - https://resend.com/blog/react-email-5
- SuperTokens: Email Verification Flow - https://supertokens.com/blog/implementing-the-right-email-verification-flow
- FTC COPPA FAQ - https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions

### Tertiary (LOW confidence)
- Medium: Send emails via Supabase Edge Function - https://medium.com/@harish.siri/send-emails-via-supabase-edge-function-95daf2b4a14c
- DEV Community: Implementing Email Verification - https://dev.to/supertokens/implementing-the-right-email-verification-flow-2hcj

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Supabase and Resend have official documentation and first-party integration examples
- Architecture: HIGH - Multiple verified code examples from official sources (Supabase docs, Resend docs)
- Pitfalls: HIGH - 406 error issue documented in GitHub discussions with resolution, email rendering issues well-known

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - stable ecosystem, monthly check recommended for API changes)
