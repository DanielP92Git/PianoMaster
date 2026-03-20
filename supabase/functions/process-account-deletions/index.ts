// process-account-deletions Edge Function
// Invoked daily at 03:00 UTC by pg_cron.
//
// Responsibilities:
//   1. Authenticate incoming request via x-cron-secret header (401 on mismatch)
//   2. Query students with account_status = 'suspended_deletion' AND deletion_scheduled_at < NOW()
//   3. Support dry-run mode via ?dry_run=true query parameter
//   4. For each eligible account:
//      a. Capture parent_email and first_name BEFORE any deletion
//      b. Cancel active Lemon Squeezy subscription (if status is active/on_trial/paused)
//      c. DELETE FROM students (CASCADE removes all child table rows)
//      d. Delete auth.users entry via admin API
//      e. Send confirmation email to parent via Brevo
//      f. Write audit record to account_deletion_log
//   5. Return summary: { deleted, failed, skipped, dryRun, total }
//
// Security:
//   - verify_jwt = false in config.toml (pg_cron sends no Supabase JWT)
//   - x-cron-secret header verified against CRON_SECRET environment variable
//   - Service role key used for all DB access (bypasses RLS intentionally)
//   - No PII logged — student IDs only, no names or email addresses
//
// Environment variables required:
//   CRON_SECRET                 -- shared secret between Vault and this function
//   BREVO_API_KEY               -- Brevo transactional email API key
//   SENDER_EMAIL                -- verified sender email (default: noreply@pianomaster.app)
//   SENDER_NAME                 -- sender display name (default: PianoMaster)
//   LS_API_KEY                  -- Lemon Squeezy API key for subscription cancellation
//   AUDIT_HMAC_SECRET           -- secret for hashing student IDs in audit log
//   SUPABASE_URL                -- auto-injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY   -- auto-injected by Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================
// Data categories removed during account deletion.
// These are all tables with student data (CASCADE + explicit scope).
// Also used in the email body for transparency.
// ============================================================
const DATA_CATEGORIES_REMOVED = [
  'students',
  'students_score',
  'student_skill_progress',
  'student_daily_goals',
  'practice_sessions',
  'student_achievements',
  'assignment_submissions',
  'parental_consent_log',
  'parental_consent_tokens',
  'student_point_transactions',
  'user_accessories',
  'parent_subscriptions',
  'push_subscriptions',
  'student_daily_challenges',
];

// Human-readable descriptions of data categories for the parent email
const DATA_CATEGORY_LABELS: Record<string, string> = {
  students: 'Account and profile information',
  students_score: 'Game scores and performance history',
  student_skill_progress: 'Skill progress and achievements',
  student_daily_goals: 'Daily goals and challenge records',
  practice_sessions: 'Practice session recordings',
  student_achievements: 'Earned badges and achievements',
  assignment_submissions: 'Teacher assignment submissions',
  parental_consent_log: 'Parental consent records',
  parental_consent_tokens: 'Consent verification tokens',
  student_point_transactions: 'Point transaction history',
  user_accessories: 'Avatar and accessory selections',
  parent_subscriptions: 'Subscription and payment records',
  push_subscriptions: 'Push notification preferences',
  student_daily_challenges: 'Daily challenge history',
};

// ============================================================
// HMAC helper: hash student ID for audit log privacy
// Uses Web Crypto API (available in Deno)
// Pattern reused from send-weekly-report/index.ts
// ============================================================
async function hashStudentId(studentId: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(studentId));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// Email HTML generator
// Matches consent/weekly-report branding: purple gradient header, table-based layout
// ============================================================
interface DeletionConfirmationParams {
  childName?: string;
  deletionDate: string;
  dataCategories: string[];
}

function generateDeletionConfirmationHTML(params: DeletionConfirmationParams): string {
  const { childName, deletionDate, dataCategories } = params;

  const childRef = childName ? `<strong>${childName}</strong>` : 'your child';
  const childPossessive = childName ? `<strong>${childName}'s</strong>` : "your child's";

  // Build bullet list of human-readable data category labels
  const categoryItems = dataCategories
    .map(cat => {
      const label = DATA_CATEGORY_LABELS[cat] ?? cat;
      return `<li style="margin-bottom: 8px;">${label}</li>`;
    })
    .join('\n                ');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deletion Confirmation - PianoMaster</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

  <!-- Wrapper table -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f4f8; padding: 40px 0;">
    <tr>
      <td align="center">

        <!-- Main container table -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">

          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 48px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                &#127929; PianoMaster
              </h1>
              <p style="margin: 12px 0 0; font-size: 16px; color: rgba(255, 255, 255, 0.95); font-weight: 500;">
                Account Deletion Confirmation
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 40px 24px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 26px; color: #1e293b;">
                Dear Parent/Guardian,
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 26px; color: #1e293b;">
                Thank you for being part of PianoMaster. ${childPossessive} musical journey with us has been wonderful, and we're sorry to see them go.
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 26px; color: #1e293b;">
                As requested, we have permanently deleted ${childRef}'s account and all associated data from our systems. This action is complete and cannot be undone.
              </p>
            </td>
          </tr>

          <!-- Data categories removed -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; padding: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #475569;">
                      The following data has been permanently removed:
                    </p>
                    <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; line-height: 22px; color: #64748b;">
                ${categoryItems}
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Deletion date -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; font-size: 16px; line-height: 26px; color: #1e293b;">
                This data was permanently removed on <strong>${deletionDate}</strong>.
              </p>
            </td>
          </tr>

          <!-- Re-registration invitation -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0; font-size: 16px; line-height: 26px; color: #1e293b;">
                If ${childRef} ever wants to start a new musical adventure, you're always welcome to create a new account at any time. We'd love to have them back.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #94a3b8;">
                This is a one-time transactional email confirming your account deletion request. No further emails will be sent to this address.
              </p>
            </td>
          </tr>

        </table>

        <!-- Copyright footer outside main container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 24px;">
          <tr>
            <td style="text-align: center; padding: 0 20px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 18px;">
                &copy; 2026 PianoMaster. A safe learning environment for young musicians.
              </p>
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

// ============================================================
// Main handler
// ============================================================
Deno.serve(async (req: Request) => {
  // CORS preflight (not needed for cron but harmless)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-cron-secret',
      },
    });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // -- Security: verify cron secret --
  const cronSecret = Deno.env.get('CRON_SECRET');
  const incomingSecret = req.headers.get('x-cron-secret');

  if (!cronSecret || incomingSecret !== cronSecret) {
    console.error('process-account-deletions: unauthorized -- cron secret mismatch');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // -- Get and validate required environment variables --
  const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
  if (!BREVO_API_KEY) {
    console.error('process-account-deletions: missing BREVO_API_KEY environment variable');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const LS_API_KEY = Deno.env.get('LS_API_KEY');
  if (!LS_API_KEY) {
    console.error('process-account-deletions: missing LS_API_KEY environment variable');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const AUDIT_HMAC_SECRET = Deno.env.get('AUDIT_HMAC_SECRET');
  if (!AUDIT_HMAC_SECRET) {
    console.error('process-account-deletions: missing AUDIT_HMAC_SECRET environment variable');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'noreply@pianomaster.app';
  const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'PianoMaster';

  // -- Dry-run detection --
  const url = new URL(req.url);
  const isDryRun = url.searchParams.get('dry_run') === 'true';

  if (isDryRun) {
    console.log('process-account-deletions: dry-run mode active -- no data will be modified');
  }

  // -- Initialize Supabase service role client --
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // -- Query eligible accounts --
  // CRITICAL: parent_email and first_name are read here, BEFORE any deletion begins
  const { data: eligibleAccounts, error: queryError } = await supabase
    .from('students')
    .select('id, parent_email, first_name, deletion_scheduled_at')
    .eq('account_status', 'suspended_deletion')
    .lt('deletion_scheduled_at', new Date().toISOString());

  if (queryError) {
    console.error('process-account-deletions: failed to query eligible accounts:', queryError);
    return new Response(JSON.stringify({ error: 'Database query failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const total = eligibleAccounts?.length ?? 0;
  let deleted = 0;
  let failed = 0;
  let skipped = 0;

  console.log(`process-account-deletions: found ${total} eligible accounts for deletion`);

  // -- Per-account processing loop --
  for (const account of eligibleAccounts ?? []) {
    try {
      const studentId: string = account.id;
      // CRITICAL: parent_email and first_name captured BEFORE any deletion begins
      const parentEmail: string | null = account.parent_email ?? null;
      const childName: string | null = account.first_name ?? null;
      const deletionDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      let lsCancelled = false;

      // --- DRY RUN CHECK ---
      if (isDryRun) {
        console.log(`process-account-deletions: [dry-run] would delete student ${studentId}`);
        // Write dry-run audit record to show what would happen
        const studentIdHash = await hashStudentId(studentId, AUDIT_HMAC_SECRET);
        await supabase.from('account_deletion_log').insert({
          student_id_hash: studentIdHash,
          data_categories_removed: DATA_CATEGORIES_REMOVED,
          ls_subscription_cancelled: false,
          email_status: 'skipped',
          dry_run: true,
        });
        skipped++;
        continue;
      }

      // --- STEP 1: Check and cancel LS subscription (if active) ---
      const { data: subscription } = await supabase
        .from('parent_subscriptions')
        .select('ls_subscription_id, status')
        .eq('student_id', studentId)
        .maybeSingle();

      if (subscription && ['active', 'on_trial', 'paused'].includes(subscription.status)) {
        // Active subscription — must cancel before deletion to prevent orphan billing
        const lsResponse = await fetch(
          `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.ls_subscription_id}`,
          {
            method: 'DELETE',
            headers: {
              'Accept': 'application/vnd.api+json',
              'Content-Type': 'application/vnd.api+json',
              'Authorization': `Bearer ${LS_API_KEY}`,
            },
          }
        );

        if (!lsResponse.ok) {
          // LS failure BLOCKS this account's deletion — retry on next cron run
          console.error(
            `process-account-deletions: LS cancel failed for ${studentId}, status=${lsResponse.status} -- skipping, will retry next run`
          );
          failed++;
          continue;
        }

        lsCancelled = true;
        console.log(`process-account-deletions: cancelled LS subscription for ${studentId}`);
      }
      // If no subscription row, or status is cancelled/expired: proceed silently (free-tier or already cancelled)

      // --- STEP 2: DELETE FROM students (CASCADE removes all child rows) ---
      // CASCADE deletes: students_score, student_skill_progress, student_daily_goals,
      // practice_sessions, student_achievements, assignment_submissions, parental_consent_log,
      // parental_consent_tokens, student_point_transactions, user_accessories,
      // parent_subscriptions, push_subscriptions, student_daily_challenges
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (deleteError) {
        console.error(
          `process-account-deletions: failed to delete student ${studentId}:`,
          deleteError
        );
        failed++;
        continue;
      }

      // --- STEP 3: Delete auth.users entry ---
      const { error: authError } = await supabase.auth.admin.deleteUser(studentId);
      if (authError) {
        if (authError.message?.includes('User not found')) {
          // Idempotent — already deleted on a previous run; not an error
          console.log(
            `process-account-deletions: auth user already gone for ${studentId} -- treating as success`
          );
        } else {
          // Real auth failure — public data is already deleted; log but do not block
          console.error(
            `process-account-deletions: auth.deleteUser failed for ${studentId}:`,
            authError
          );
        }
      }

      // --- STEP 4: Send confirmation email to parent ---
      let emailStatus: 'sent' | 'failed' | 'skipped' = 'skipped';

      if (parentEmail) {
        try {
          const htmlContent = generateDeletionConfirmationHTML({
            childName: childName ?? undefined,
            deletionDate,
            dataCategories: DATA_CATEGORIES_REMOVED,
          });

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

          const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': BREVO_API_KEY,
            },
            body: JSON.stringify({
              sender: { name: SENDER_NAME, email: SENDER_EMAIL },
              to: [{ email: parentEmail }],
              subject: 'Account Deletion Confirmation - PianoMaster',
              htmlContent,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (brevoResponse.ok) {
            emailStatus = 'sent';
            console.log(
              `process-account-deletions: confirmation email sent for ${studentId}`
            );
          } else {
            emailStatus = 'failed';
            const errData = await brevoResponse.json().catch(() => ({}));
            console.error(
              `process-account-deletions: Brevo error for ${studentId}:`,
              brevoResponse.status,
              JSON.stringify(errData)
            );
          }
        } catch (emailErr: unknown) {
          emailStatus = 'failed';
          console.error(
            `process-account-deletions: email send error for ${studentId}:`,
            emailErr
          );
        }
        // Email failure does NOT block deletion — it is a courtesy notification
      } else {
        console.log(
          `process-account-deletions: no parent email for ${studentId} -- skipping confirmation`
        );
      }

      // --- STEP 5: Write audit record ---
      const studentIdHash = await hashStudentId(studentId, AUDIT_HMAC_SECRET);
      const { error: auditError } = await supabase.from('account_deletion_log').insert({
        student_id_hash: studentIdHash,
        data_categories_removed: DATA_CATEGORIES_REMOVED,
        ls_subscription_cancelled: lsCancelled,
        email_status: emailStatus,
        dry_run: false,
      });

      if (auditError) {
        // Audit failure does not block — deletion already succeeded
        console.error(
          `process-account-deletions: audit log insert failed for ${studentId}:`,
          auditError
        );
      }

      console.log(`process-account-deletions: permanently deleted student ${studentId}`);
      deleted++;
    } catch (err: unknown) {
      console.error(
        `process-account-deletions: unexpected error for student ${account.id}:`,
        err
      );
      failed++;
    }
  }

  const summary = {
    deleted,
    failed,
    skipped,
    dryRun: isDryRun,
    total: eligibleAccounts?.length ?? 0,
  };

  console.log('process-account-deletions: complete --', JSON.stringify(summary));

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
