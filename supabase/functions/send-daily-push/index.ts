// send-daily-push Edge Function
// Invoked daily by pg_cron at 14:00 UTC (~4-5pm Israel time).
//
// Responsibilities:
//   1. Authenticate incoming request via x-cron-secret header (401 on mismatch)
//   2. Query push_subscriptions for enabled students with non-null subscription JSON
//   3. Skip students already notified today (last_notified_at = today UTC)
//   3a. If student has NOT logged instrument practice today → send practice check-in notification
//       and continue (skip app-usage reminder — never both in one day). (PUSH-01, PUSH-02)
//   3b. If student HAS logged instrument practice today → fall through to app-usage reminder logic
//   4. Skip students who already practiced today (students_score entry for today UTC)
//   5. Gather per-student context: streak, XP level proximity, daily goals progress
//   6. Select context-aware notification message by priority: streak > XP > goals > generic
//   7. Send Web Push via @negrel/webpush using VAPID keys from environment
//   8. Update last_notified_at on success; disable expired (410 Gone) subscriptions
//   9. Return summary: { sent, failed, skipped, total }
//
// Security:
//   - verify_jwt = false in config.toml (pg_cron sends no Supabase JWT)
//   - x-cron-secret header verified against CRON_SECRET environment variable
//   - Service role key used for all DB access (bypasses RLS intentionally)
//   - No PII logged — student IDs only, no names or email addresses
//
// Environment variables required:
//   CRON_SECRET        — shared secret between Vault and this function
//   VAPID_KEYS_JSON    — JSON string of exported VAPID keys (JWK format from @negrel/webpush)
//   VAPID_SUBJECT      — VAPID subject, e.g. "mailto:admin@pianomaster.app"
//   SUPABASE_URL       — auto-injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  ApplicationServer,
  importVapidKeys,
} from 'jsr:@negrel/webpush';

// ============================================================
// XP Level thresholds (mirrors src/utils/xpSystem.js exactly)
// ============================================================
const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7500, 9000];

function getXpToNextLevel(totalXp: number): number | null {
  for (let i = 0; i < XP_THRESHOLDS.length - 1; i++) {
    if (totalXp < XP_THRESHOLDS[i + 1]) {
      return XP_THRESHOLDS[i + 1] - totalXp;
    }
  }
  return null; // Max level reached
}

// ============================================================
// Sanitize JWK: strip whitespace from base64url coordinates
// (Supabase secret storage can introduce spaces)
// ============================================================
function sanitizeJwk(jwk: Record<string, unknown>): Record<string, unknown> {
  const cleaned = { ...jwk };
  for (const field of ['x', 'y', 'd']) {
    if (typeof cleaned[field] === 'string') {
      cleaned[field] = (cleaned[field] as string).replace(/\s/g, '');
    }
  }
  return cleaned;
}

// ============================================================
// Notification message selection (pure function)
// Priority: streak at risk > XP near level-up > daily goals > generic
// ============================================================
interface Notification {
  title: string;
  body: string;
}

interface StudentContext {
  streakCount: number;
  xpToNextLevel: number | null;
  hasIncompleteGoals: boolean;
}

function selectNotification(ctx: StudentContext): Notification {
  const { streakCount, xpToNextLevel, hasIncompleteGoals } = ctx;

  // Priority 1: Streak at risk (student has a streak — encourage them not to break it)
  if (streakCount > 0) {
    const variants: Notification[] = [
      {
        title: `🔥 ${streakCount}-day streak alert!`,
        body: "Your piano streak is waiting for you today. Don't let it disappear! 🎹",
      },
      {
        title: `🎵 Keep your ${streakCount}-day streak alive!`,
        body: "One quick practice session and your streak stays safe. You've got this! ⭐",
      },
      {
        title: `⚡ Streak in danger!`,
        body: `${streakCount} days strong — don't stop now! Your piano is calling 🎶`,
      },
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  // Priority 2: XP near level-up (within 50 XP of next level)
  if (xpToNextLevel !== null && xpToNextLevel <= 50) {
    const variants: Notification[] = [
      {
        title: '⭐ Almost at the next level!',
        body: `Only ${xpToNextLevel} XP to go! Play today and level up! 🚀`,
      },
      {
        title: '🏆 Level-up is so close!',
        body: `Just ${xpToNextLevel} more XP and you unlock the next level. Play now! 🎹`,
      },
      {
        title: `🎶 ${xpToNextLevel} XP away from leveling up!`,
        body: "A short practice session is all you need. Let's go! ⭐",
      },
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  // Priority 3: Daily goals waiting (student has incomplete goals for today)
  if (hasIncompleteGoals) {
    const variants: Notification[] = [
      {
        title: '🎯 Your daily goals are waiting!',
        body: "You have music goals to complete today. Come finish them! 🎵",
      },
      {
        title: '🌟 Daily challenge time!',
        body: "Your daily piano goals are ready. Can you complete them all today? 🎹",
      },
      {
        title: '✨ Goals left to crush today!',
        body: "Don't forget your daily practice goals — you can do it! 🎶",
      },
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  // Priority 4: Generic encouragement (fallback)
  const variants: Notification[] = [
    {
      title: '🎹 Time to practice piano!',
      body: "A few minutes of music makes the day better. Come play! 🎵",
    },
    {
      title: '🎶 Your piano misses you!',
      body: "Pop in for a quick session today — even 5 minutes counts! ⭐",
    },
    {
      title: '🌟 Ready for your music adventure?',
      body: "Tap to continue your piano journey on the trail! 🎹",
    },
  ];
  return variants[Math.floor(Math.random() * variants.length)];
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

  // ── Security: verify cron secret ──────────────────────────
  const cronSecret = Deno.env.get('CRON_SECRET');
  const incomingSecret = req.headers.get('x-cron-secret');

  if (!cronSecret || incomingSecret !== cronSecret) {
    console.error('send-daily-push: unauthorized — cron secret mismatch');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Initialize Web Push ───────────────────────────────────
  const vapidKeysJson = Deno.env.get('VAPID_KEYS_JSON');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@pianomaster.app';

  if (!vapidKeysJson) {
    console.error('send-daily-push: missing VAPID_KEYS_JSON environment variable');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let appServer: ApplicationServer;
  try {
    const exportedKeys = JSON.parse(vapidKeysJson);
    // Sanitize JWK coordinates (strip any whitespace introduced by secret storage)
    const sanitized = {
      publicKey: sanitizeJwk(exportedKeys.publicKey),
      privateKey: sanitizeJwk(exportedKeys.privateKey),
    };
    const vapidKeys = await importVapidKeys(sanitized);
    appServer = await ApplicationServer.new({
      contactInformation: vapidSubject,
      vapidKeys,
    });
  } catch (err) {
    console.error('send-daily-push: failed to initialize VAPID application server:', err);
    return new Response(JSON.stringify({ error: 'VAPID initialization failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Initialize Supabase service role client ───────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Today's date in UTC (YYYY-MM-DD) used for rate limiting and practiced-today checks
  const now = new Date();
  const todayUtc = now.toISOString().split('T')[0]; // e.g., "2026-03-04"
  const todayUtcMidnight = `${todayUtc}T00:00:00.000Z`;

  // ── Query enabled push subscriptions ─────────────────────
  const { data: enabledSubscriptions, error: queryError } = await supabase
    .from('push_subscriptions')
    .select(`
      student_id,
      subscription,
      last_notified_at,
      students!inner (
        total_xp,
        current_level
      )
    `)
    .eq('is_enabled', true)
    .not('subscription', 'is', null);

  if (queryError) {
    console.error('send-daily-push: failed to query push_subscriptions:', queryError);
    return new Response(JSON.stringify({ error: 'Database query failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const total = enabledSubscriptions?.length ?? 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  console.log(`send-daily-push: processing ${total} enabled subscriptions for ${todayUtc}`);

  // ── Per-student processing loop ───────────────────────────
  for (const row of enabledSubscriptions ?? []) {
    const studentId: string = row.student_id;

    try {
      // ── Rate limit: skip if already notified today ────────
      if (row.last_notified_at) {
        const lastNotifiedDate = row.last_notified_at.split('T')[0];
        if (lastNotifiedDate === todayUtc) {
          console.log(`send-daily-push: skipping student ${studentId} — already notified today`);
          skipped++;
          continue;
        }
      }

      // ── Check if student logged instrument practice today (PUSH-02, D-04) ──
      const { count: instrumentPracticeCount, error: instrumentPracticeError } = await supabase
        .from('instrument_practice_logs')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('practiced_on', todayUtc);

      if (instrumentPracticeError) {
        console.error(`send-daily-push: error checking instrument practice for ${studentId}:`, instrumentPracticeError);
        failed++;
        continue;
      }

      if (!instrumentPracticeCount || instrumentPracticeCount === 0) {
        // BRANCH A: Practice check-in notification (PUSH-01, D-02 priority)
        const checkinVariants = [
          { title: 'Time to practice! \u{1F3B9}', body: 'Did you practice your instrument today?' },
          { title: 'Piano check-in \u{1F3B5}', body: "How was today's practice?" },
          { title: 'Daily practice \u{1F3BC}', body: 'Have you played your instrument today?' },
        ];
        const checkin = checkinVariants[Math.floor(Math.random() * checkinVariants.length)];

        const subscriber = appServer.subscribe(row.subscription);
        await subscriber.pushTextMessage(
          JSON.stringify({
            title: checkin.title,
            body: checkin.body,
            tag: 'practice-checkin',
            data: { url: '/dashboard?practice_checkin=1', type: 'practice-checkin' },
          }),
          {},
        );

        // Update last_notified_at (D-05: 1 notification cycle per day)
        const { error: updateError } = await supabase
          .from('push_subscriptions')
          .update({ last_notified_at: now.toISOString() })
          .eq('student_id', studentId);

        if (updateError) {
          console.error(`send-daily-push: failed to update last_notified_at for ${studentId}:`, updateError);
        }

        console.log(`send-daily-push: sent practice check-in to student ${studentId}`);
        sent++;
        continue; // D-02: never both practice check-in AND app-usage reminder
      }

      // BRANCH B: Student HAS logged instrument practice — fall through to app-usage reminder

      // ── Skip if student already practiced today ───────────
      const { count: practiceCount, error: practiceError } = await supabase
        .from('students_score')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .gte('created_at', todayUtcMidnight);

      if (practiceError) {
        console.error(`send-daily-push: error checking practice for ${studentId}:`, practiceError);
        failed++;
        continue;
      }

      if (practiceCount && practiceCount > 0) {
        console.log(`send-daily-push: skipping student ${studentId} — already practiced today (${practiceCount} scores)`);
        skipped++;
        continue;
      }

      // ── Gather context: streak ────────────────────────────
      const { data: streakData } = await supabase
        .from('current_streak')
        .select('streak_count')
        .eq('student_id', studentId)
        .maybeSingle();

      const streakCount: number = streakData?.streak_count ?? 0;

      // ── Gather context: XP proximity to next level ────────
      // Supabase join returns students as an object (or array) — normalize
      const studentData = Array.isArray(row.students) ? row.students[0] : row.students;
      const totalXp: number = studentData?.total_xp ?? 0;
      const xpToNextLevel = getXpToNextLevel(totalXp);

      // ── Gather context: daily goals completion ────────────
      const { data: goalsData } = await supabase
        .from('student_daily_goals')
        .select('goals, completed_goals')
        .eq('student_id', studentId)
        .eq('goal_date', todayUtc)
        .maybeSingle();

      const hasIncompleteGoals = goalsData
        ? (goalsData.goals?.length ?? 0) > (goalsData.completed_goals?.length ?? 0)
        : false;

      // ── Select notification message ───────────────────────
      const notification = selectNotification({ streakCount, xpToNextLevel, hasIncompleteGoals });

      // ── Send Web Push notification ────────────────────────
      const subscriber = appServer.subscribe(row.subscription);
      await subscriber.pushTextMessage(
        JSON.stringify({
          title: notification.title,
          body: notification.body,
          tag: 'daily-practice',
          data: { url: '/trail', type: 'daily-practice' },
        }),
        {},
      );

      // ── Update last_notified_at on success ────────────────
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({ last_notified_at: now.toISOString() })
        .eq('student_id', studentId);

      if (updateError) {
        console.error(`send-daily-push: failed to update last_notified_at for ${studentId}:`, updateError);
        // Don't count as failed — notification was sent successfully
      }

      console.log(`send-daily-push: sent notification to student ${studentId} (streak=${streakCount}, xpToNext=${xpToNextLevel}, goals=${hasIncompleteGoals})`);
      sent++;
    } catch (err: unknown) {
      // ── Handle expired subscription (410 Gone) ────────────
      const isExpired =
        err instanceof Error &&
        (err.message?.includes('410') || err.message?.toLowerCase().includes('gone'));

      if (isExpired) {
        console.log(`send-daily-push: subscription expired for student ${studentId} — disabling`);
        await supabase
          .from('push_subscriptions')
          .update({ is_enabled: false, subscription: null })
          .eq('student_id', studentId);
        failed++;
      } else {
        console.error(`send-daily-push: unexpected error for student ${studentId}:`, err);
        failed++;
      }
    }
  }

  const summary = { sent, failed, skipped, total };
  console.log('send-daily-push: complete —', JSON.stringify(summary));

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
