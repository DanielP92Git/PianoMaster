// send-weekly-report Edge Function
// Invoked weekly (Monday 08:00 UTC) by pg_cron.
//
// Responsibilities:
//   1. Authenticate incoming request via x-cron-secret header (401 on mismatch)
//   2. Query push_subscriptions for parents with consent who haven't opted out
//   3. Skip students who were already emailed in the last 6 days (dedup guard)
//   4. Skip students with null/invalid parent_email
//   5. Gather per-student 7-day stats: days practiced, streak, nodes completed, level
//   6. Generate branded HTML email matching consent email template
//   7. Send via Brevo transactional email API
//   8. Include HMAC-signed unsubscribe link in each email
//   9. Update last_weekly_report_at on success
//  10. Return summary: { sent, failed, skipped, total }
//
// Security:
//   - verify_jwt = false in config.toml (pg_cron sends no Supabase JWT)
//   - x-cron-secret header verified against CRON_SECRET environment variable
//   - Service role key used for all DB access (bypasses RLS intentionally)
//   - Unsubscribe links use HMAC-SHA256 tokens for tamper-proof verification
//   - No PII logged -- student IDs only, no names or email addresses
//
// Environment variables required:
//   CRON_SECRET                 -- shared secret between Vault and this function
//   BREVO_API_KEY               -- Brevo transactional email API key
//   SENDER_EMAIL                -- verified sender email (default: noreply@pianomaster.app)
//   SENDER_NAME                 -- sender display name (default: PianoMaster)
//   WEEKLY_REPORT_HMAC_SECRET   -- secret for signing unsubscribe tokens
//   SUPABASE_URL                -- auto-injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY   -- auto-injected by Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================
// HMAC helper: generate unsubscribe token for a student ID
// Uses Web Crypto API (available in Deno)
// ============================================================
async function generateUnsubscribeToken(studentId: string, secret: string): Promise<string> {
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
// Matches consent email branding: purple gradient header, table-based layout
// ============================================================
interface WeeklyReportParams {
  childName?: string;
  daysPracticed: number;
  streakCount: number;
  nodesCompleted: number;
  currentLevel: number;
  unsubscribeUrl: string;
}

function generateWeeklyReportHTML(params: WeeklyReportParams): string {
  const { childName, daysPracticed, streakCount, nodesCompleted, currentLevel, unsubscribeUrl } = params;

  const greeting = childName
    ? `Great news about <strong>${childName}'s</strong> piano journey this week!`
    : `Great news about your child's piano journey this week!`;

  const streakEmoji = streakCount > 0 ? ' &#128293;' : '';
  const daysNote = daysPracticed >= 7
    ? '<span style="color: #22c55e; font-weight: 600;">Perfect week!</span>'
    : daysPracticed >= 5
      ? '<span style="color: #22c55e;">Great consistency!</span>'
      : daysPracticed >= 3
        ? '<span style="color: #6366f1;">Good effort!</span>'
        : '<span style="color: #6366f1;">Every session counts!</span>';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Progress Report - PianoMaster</title>
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
                Weekly Progress Report
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 40px 24px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 26px; color: #1e293b;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 26px; color: #1e293b;">
                Here's a summary of what was accomplished in the past week:
              </p>
            </td>
          </tr>

          <!-- Stats card -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; overflow: hidden;">

                <!-- Days Practiced -->
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 14px; color: #64748b; font-weight: 500;">
                          &#128197; Days Practiced
                        </td>
                        <td style="text-align: right; font-size: 16px; font-weight: 700; color: #1e293b;">
                          ${daysPracticed}/7 days
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 4px; font-size: 13px;">
                          ${daysNote}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Current Streak -->
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 14px; color: #64748b; font-weight: 500;">
                          ${streakEmoji || '&#9889;'} Current Streak
                        </td>
                        <td style="text-align: right; font-size: 16px; font-weight: 700; color: #1e293b;">
                          ${streakCount} day${streakCount !== 1 ? 's' : ''}${streakEmoji}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Nodes Completed -->
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 14px; color: #64748b; font-weight: 500;">
                          &#127925; Lessons Completed
                        </td>
                        <td style="text-align: right; font-size: 16px; font-weight: 700; color: #1e293b;">
                          ${nodesCompleted} new lesson${nodesCompleted !== 1 ? 's' : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Current Level -->
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 14px; color: #64748b; font-weight: 500;">
                          &#11088; Current Level
                        </td>
                        <td style="text-align: right; font-size: 16px; font-weight: 700; color: #6366f1;">
                          Level ${currentLevel}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Encouraging closing -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0; font-size: 16px; line-height: 26px; color: #1e293b;">
                Keep encouraging your child to practice! Every session builds confidence and skill. &#127926;
              </p>
            </td>
          </tr>

          <!-- Footer with unsubscribe -->
          <tr>
            <td style="padding: 32px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 12px; font-size: 13px; line-height: 20px; color: #94a3b8;">
                To stop receiving these weekly updates, <a href="${unsubscribeUrl}" style="color: #6366f1; text-decoration: underline;">click here</a>.
              </p>
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #94a3b8;">
                You can re-enable weekly reports from the PianoMaster app's Settings page at any time.
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
// Email validation regex (same as consent email)
// ============================================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    console.error('send-weekly-report: unauthorized -- cron secret mismatch');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // -- Get environment variables --
  const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
  if (!BREVO_API_KEY) {
    console.error('send-weekly-report: missing BREVO_API_KEY environment variable');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'noreply@pianomaster.app';
  const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'PianoMaster';
  const hmacSecret = Deno.env.get('WEEKLY_REPORT_HMAC_SECRET');

  if (!hmacSecret) {
    console.error('send-weekly-report: missing WEEKLY_REPORT_HMAC_SECRET environment variable');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // -- Initialize Supabase service role client --
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Calculate 7-day window
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  // Dedup guard: skip if already sent within the last 6 days
  const sixDaysAgo = new Date(now);
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  const sixDaysAgoISO = sixDaysAgo.toISOString();

  // -- Query eligible parents --
  const { data: eligibleStudents, error: queryError } = await supabase
    .from('push_subscriptions')
    .select(`
      student_id,
      last_weekly_report_at,
      students!inner (
        parent_email,
        total_xp,
        current_level
      )
    `)
    .eq('parent_consent_granted', true)
    .eq('weekly_report_opted_out', false);

  if (queryError) {
    console.error('send-weekly-report: failed to query push_subscriptions:', queryError);
    return new Response(JSON.stringify({ error: 'Database query failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const total = eligibleStudents?.length ?? 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  console.log(`send-weekly-report: processing ${total} eligible students`);

  // -- Per-student processing loop --
  for (const row of eligibleStudents ?? []) {
    const studentId: string = row.student_id;

    try {
      // -- Dedup: skip if already sent within the last 6 days --
      if (row.last_weekly_report_at) {
        const lastSentDate = new Date(row.last_weekly_report_at);
        if (lastSentDate > new Date(sixDaysAgoISO)) {
          console.log(`send-weekly-report: skipping student ${studentId} -- already sent within 6 days`);
          skipped++;
          continue;
        }
      }

      // -- Normalize student data from join --
      const student = Array.isArray(row.students) ? row.students[0] : row.students;
      const parentEmail: string | null = student?.parent_email ?? null;

      // -- Skip if no valid parent email --
      if (!parentEmail || !EMAIL_REGEX.test(parentEmail)) {
        console.log(`send-weekly-report: skipping student ${studentId} -- no valid parent email`);
        skipped++;
        continue;
      }

      // -- Gather 7-day stats --

      // Days practiced: count distinct dates with scores in the last 7 days
      const { data: scores } = await supabase
        .from('students_score')
        .select('created_at')
        .eq('student_id', studentId)
        .gte('created_at', sevenDaysAgoISO);

      const uniqueDays = new Set(
        (scores || []).map((s: { created_at: string }) => s.created_at.split('T')[0])
      );
      const daysPracticed = uniqueDays.size;

      // Nodes completed this week (with at least 1 star, practiced in last 7 days)
      const { data: nodeProgress } = await supabase
        .from('student_skill_progress')
        .select('node_id')
        .eq('student_id', studentId)
        .gte('last_practiced', sevenDaysAgoISO)
        .gt('stars', 0);

      const nodesCompleted = new Set(
        (nodeProgress || []).map((p: { node_id: string }) => p.node_id)
      ).size;

      // Current streak
      const { data: streakData } = await supabase
        .from('current_streak')
        .select('streak_count')
        .eq('student_id', studentId)
        .maybeSingle();

      const streakCount: number = streakData?.streak_count ?? 0;

      // Current level from the student join data
      const currentLevel: number = student?.current_level ?? 1;

      // -- Generate unsubscribe token and URL --
      const token = await generateUnsubscribeToken(studentId, hmacSecret);
      const unsubscribeUrl = `${supabaseUrl}/functions/v1/unsubscribe-weekly-report?sid=${studentId}&token=${token}`;

      // -- Generate email HTML --
      const htmlContent = generateWeeklyReportHTML({
        daysPracticed,
        streakCount,
        nodesCompleted,
        currentLevel,
        unsubscribeUrl,
      });

      // -- Send via Brevo --
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

      try {
        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: SENDER_NAME, email: SENDER_EMAIL },
            to: [{ email: parentEmail }],
            subject: 'Weekly Progress Report - PianoMaster',
            htmlContent,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!brevoResponse.ok) {
          const errorData = await brevoResponse.json().catch(() => ({}));
          console.error(`send-weekly-report: Brevo API error for student ${studentId}:`, brevoResponse.status, JSON.stringify(errorData));
          failed++;
          continue;
        }

        // -- Update last_weekly_report_at on success --
        const { error: updateError } = await supabase
          .from('push_subscriptions')
          .update({ last_weekly_report_at: now.toISOString() })
          .eq('student_id', studentId);

        if (updateError) {
          console.error(`send-weekly-report: failed to update last_weekly_report_at for ${studentId}:`, updateError);
          // Don't count as failed -- email was sent successfully
        }

        console.log(`send-weekly-report: sent to student ${studentId} (days=${daysPracticed}, streak=${streakCount}, nodes=${nodesCompleted}, level=${currentLevel})`);
        sent++;
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error(`send-weekly-report: Brevo API timeout for student ${studentId}`);
        } else {
          console.error(`send-weekly-report: fetch error for student ${studentId}:`, fetchError);
        }
        failed++;
      }
    } catch (err: unknown) {
      console.error(`send-weekly-report: unexpected error for student ${studentId}:`, err);
      failed++;
    }
  }

  const summary = { sent, failed, skipped, total };
  console.log('send-weekly-report: complete --', JSON.stringify(summary));

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
