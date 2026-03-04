import supabase from "./supabase";

// ============================================================
// Cooldown / dedup state — prevent hammering the DB on network errors
// ============================================================

const FETCH_COOLDOWN_MS = 60 * 1000; // 1-minute backoff after network failure

let lastPracticeFetchInFlight = null;
let lastPracticeFetchFailed = false;
let lastPracticeFailureTS = 0;

const STREAK_FETCH_COOLDOWN_MS = 60 * 1000;
let streakFetchInFlight = null;
let streakFetchFailed = false;
let streakFailureTS = 0;

let streakStateFetchInFlight = null;
let streakStateFetchFailed = false;
let streakStateFailureTS = 0;

// ============================================================
// Constants
// ============================================================

/** Hours from last practice timestamp before the grace window expires */
const GRACE_WINDOW_HOURS = 36;

/** Maximum streak freeze inventory */
const MAX_FREEZE_COUNT = 3;

/** Streak milestone interval that earns a freeze */
const FREEZE_EARN_INTERVAL = 7;

/** Comeback bonus duration in days */
const COMEBACK_BONUS_DAYS = 3;

// ============================================================
// Helpers
// ============================================================

/**
 * Returns "YYYY-MM-DD" in local timezone for a given Date object.
 * Matches existing pattern — client-side calendar day comparison.
 */
function getCalendarDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Returns hours elapsed since a given timestamp.
 * @param {Date} sinceDate
 * @returns {number}
 */
function hoursSince(sinceDate) {
  return (Date.now() - sinceDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Checks whether all calendar days strictly between lastPractice and today
 * are exclusively Friday (5) or Saturday (6) in local time.
 *
 * If the set of intermediate days is empty (consecutive days or same day),
 * returns false — the caller handles those cases separately.
 *
 * @param {Date} lastPractice
 * @param {Date} today
 * @returns {boolean} true if ALL intermediate days are Fri/Sat
 */
function allIntermediateDaysAreWeekend(lastPractice, today) {
  const lastMidnight = new Date(
    lastPractice.getFullYear(),
    lastPractice.getMonth(),
    lastPractice.getDate()
  );
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((todayMidnight - lastMidnight) / MS_PER_DAY);

  if (diffDays <= 1) {
    // No intermediate days — weekend pass doesn't affect this case
    return false;
  }

  // Enumerate intermediate days (day AFTER lastPractice through day BEFORE today)
  for (let d = 1; d < diffDays; d++) {
    const intermediateDate = new Date(lastMidnight.getTime() + d * MS_PER_DAY);
    const dayOfWeek = intermediateDate.getDay(); // 0=Sun, 5=Fri, 6=Sat
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      return false; // A non-weekend intermediate day exists
    }
  }

  return true; // All intermediate days were Fri or Sat
}

/**
 * Determines how many calendar days elapsed between lastPractice and today,
 * optionally skipping Friday and Saturday from the count when weekendPass is enabled.
 *
 * Returns:
 *   0 — same calendar day (already handled by caller)
 *   1 — consecutive (or weekend-pass-adjusted consecutive)
 *  >1 — streak should break
 *
 * @param {Date} lastPractice
 * @param {Date} today
 * @param {boolean} weekendPassEnabled
 * @returns {number}
 */
function effectiveDayGap(lastPractice, today, weekendPassEnabled) {
  const lastMidnight = new Date(
    lastPractice.getFullYear(),
    lastPractice.getMonth(),
    lastPractice.getDate()
  );
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const rawDiff = Math.round((todayMidnight - lastMidnight) / MS_PER_DAY);

  if (!weekendPassEnabled || rawDiff <= 1) {
    return rawDiff;
  }

  // Weekend pass: enumerate each day between lastPractice and today,
  // count only non-weekend days as "required" days
  let requiredDays = 0;
  for (let d = 1; d <= rawDiff; d++) {
    const checkDate = new Date(lastMidnight.getTime() + d * MS_PER_DAY);
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      requiredDays += 1;
    }
  }

  // If all intermediate days + today are weekend days, treat as consecutive
  // The student practiced on a non-weekend day (lastPractice) and today is
  // the next non-weekend day — that's consecutive under weekend pass rules.
  if (requiredDays <= 1) {
    return 1; // Consecutive under weekend pass
  }

  return rawDiff; // Use raw diff for grace window comparison
}

// ============================================================
// streakService
// ============================================================

export const streakService = {
  /**
   * Returns just the streak count number.
   * Backward-compatible — callers that only need the number continue to work.
   * @returns {Promise<number>}
   */
  async getStreak() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return 0;

    const now = Date.now();
    if (streakFetchFailed && now - streakFailureTS < STREAK_FETCH_COOLDOWN_MS) {
      return 0;
    }

    if (streakFetchInFlight) {
      return streakFetchInFlight;
    }

    streakFetchInFlight = (async () => {
      try {
        const { data, error } = await supabase
          .from("current_streak")
          .select("streak_count")
          .eq("student_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching streak:", error);
          streakFetchFailed = true;
          streakFailureTS = Date.now();
          return 0;
        }

        streakFetchFailed = false;
        streakFailureTS = 0;
        return data?.streak_count || 0;
      } catch (err) {
        console.error("Error fetching streak:", err);
        streakFetchFailed = true;
        streakFailureTS = Date.now();
        return 0;
      } finally {
        streakFetchInFlight = null;
      }
    })();

    return streakFetchInFlight;
  },

  /**
   * Returns the full streak state object for UI consumption.
   * React Query key: ["streak-state", userId]
   *
   * @returns {Promise<{
   *   streakCount: number,
   *   freezeCount: number,
   *   weekendPassEnabled: boolean,
   *   inGraceWindow: boolean,
   *   lastFreezeConsumedAt: string|null,
   *   comebackBonus: { active: boolean, expiresAt: string|null, daysLeft: number }
   * }>}
   */
  async getStreakState() {
    const DEFAULT_STATE = {
      streakCount: 0,
      freezeCount: 0,
      weekendPassEnabled: false,
      inGraceWindow: false,
      lastFreezeConsumedAt: null,
      comebackBonus: { active: false, expiresAt: null, daysLeft: 0 },
    };

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return DEFAULT_STATE;

    const now = Date.now();
    if (
      streakStateFetchFailed &&
      now - streakStateFailureTS < STREAK_FETCH_COOLDOWN_MS
    ) {
      return DEFAULT_STATE;
    }

    if (streakStateFetchInFlight) {
      return streakStateFetchInFlight;
    }

    streakStateFetchInFlight = (async () => {
      try {
        // Fetch streak state and last practice in parallel
        const [streakResult, practiceResult] = await Promise.all([
          supabase
            .from("current_streak")
            .select(
              "streak_count, streak_freezes, weekend_pass_enabled, last_freeze_consumed_at, comeback_bonus_start, comeback_bonus_expires"
            )
            .eq("student_id", session.user.id)
            .maybeSingle(),
          supabase
            .from("last_practiced_date")
            .select("practiced_at")
            .eq("student_id", session.user.id)
            .maybeSingle(),
        ]);

        if (streakResult.error) {
          console.error("Error fetching streak state:", streakResult.error);
          streakStateFetchFailed = true;
          streakStateFailureTS = Date.now();
          return DEFAULT_STATE;
        }

        streakStateFetchFailed = false;
        streakStateFailureTS = 0;

        const row = streakResult.data;
        if (!row) return DEFAULT_STATE;

        const lastPractice = practiceResult.data?.practiced_at
          ? new Date(practiceResult.data.practiced_at)
          : null;

        // Grace window: last practice was >24h but <36h ago (different calendar day)
        let inGraceWindow = false;
        if (lastPractice) {
          const hours = hoursSince(lastPractice);
          const today = new Date();
          const todayStr = getCalendarDate(today);
          const lastStr = getCalendarDate(lastPractice);
          // Grace applies when: different day AND within 36-hour window
          inGraceWindow = lastStr !== todayStr && hours <= GRACE_WINDOW_HOURS;
        }

        // Comeback bonus state
        const comebackBonusExpires = row.comeback_bonus_expires
          ? new Date(row.comeback_bonus_expires)
          : null;
        const comebackActive =
          comebackBonusExpires !== null &&
          comebackBonusExpires.getTime() > Date.now();
        const daysLeft = comebackActive
          ? Math.max(
              0,
              Math.ceil(
                (comebackBonusExpires.getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 0;

        return {
          streakCount: row.streak_count || 0,
          freezeCount: row.streak_freezes || 0,
          weekendPassEnabled: row.weekend_pass_enabled || false,
          inGraceWindow,
          lastFreezeConsumedAt: row.last_freeze_consumed_at || null,
          comebackBonus: {
            active: comebackActive,
            expiresAt: row.comeback_bonus_expires || null,
            daysLeft,
          },
        };
      } catch (err) {
        console.error("Error fetching streak state:", err);
        streakStateFetchFailed = true;
        streakStateFailureTS = Date.now();
        return DEFAULT_STATE;
      } finally {
        streakStateFetchInFlight = null;
      }
    })();

    return streakStateFetchInFlight;
  },

  /**
   * Returns the last practice date as a Date object, or null if never practiced.
   * @returns {Promise<Date|null>}
   */
  async getLastPracticeDate() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const now = Date.now();
    if (
      lastPracticeFetchFailed &&
      now - lastPracticeFailureTS < FETCH_COOLDOWN_MS
    ) {
      return null;
    }

    if (lastPracticeFetchInFlight) {
      return lastPracticeFetchInFlight;
    }

    lastPracticeFetchInFlight = (async () => {
      try {
        const { data, error } = await supabase
          .from("last_practiced_date")
          .select("practiced_at")
          .eq("student_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.warn(
            "last_practiced_date table query failed:",
            error.message
          );
          lastPracticeFetchFailed = true;
          lastPracticeFailureTS = Date.now();
          return null;
        }

        lastPracticeFetchFailed = false;
        lastPracticeFailureTS = 0;
        if (!data?.practiced_at) return null;
        return new Date(data.practiced_at);
      } catch (err) {
        console.warn(
          "last_practiced_date table query failed:",
          err?.message || err
        );
        lastPracticeFetchFailed = true;
        lastPracticeFailureTS = Date.now();
        return null;
      } finally {
        lastPracticeFetchInFlight = null;
      }
    })();

    return lastPracticeFetchInFlight;
  },

  /**
   * Updates the streak when a student practices.
   *
   * Business logic (in priority order):
   *   1. Same calendar day → return early, no change
   *   2. First time practicing → streak = 1
   *   3. Weekend pass + all intermediate days are Fri/Sat → treat as consecutive
   *   4. Within 36-hour grace window → treat as consecutive, increment
   *   5. Past grace + freeze available → consume freeze, preserve streak
   *   6. Past grace + no freeze → streak breaks, activate comeback bonus
   *
   * After determining new streak:
   *   - Earn freeze if streak is a multiple of 7 and inventory < 3
   *   - Clear expired comeback bonus
   *
   * @returns {Promise<{
   *   newStreak: number,
   *   freezeEarned: boolean,
   *   freezeConsumed: boolean,
   *   streakBroken: boolean,
   *   comebackBonusActivated: boolean
   * }>}
   */
  async updateStreak() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return { newStreak: 0, freezeEarned: false, freezeConsumed: false, streakBroken: false, comebackBonusActivated: false };

    const today = new Date();

    // Fetch last practice date and current streak row in parallel
    const [lastPractice, streakRowResult] = await Promise.all([
      this.getLastPracticeDate(),
      supabase
        .from("current_streak")
        .select(
          "streak_count, streak_freezes, weekend_pass_enabled, last_freeze_earned_at, comeback_bonus_start, comeback_bonus_expires"
        )
        .eq("student_id", session.user.id)
        .maybeSingle(),
    ]);

    if (lastPracticeFetchFailed) {
      console.warn(
        "Skipping streak update because last_practiced_date lookup is failing"
      );
      const currentStreak = streakRowResult.data?.streak_count || 0;
      return { newStreak: currentStreak, freezeEarned: false, freezeConsumed: false, streakBroken: false, comebackBonusActivated: false };
    }

    if (streakRowResult.error) {
      console.error("Error fetching streak row:", streakRowResult.error);
      return { newStreak: 0, freezeEarned: false, freezeConsumed: false, streakBroken: false, comebackBonusActivated: false };
    }

    const streakRow = streakRowResult.data;
    let currentStreak = streakRow?.streak_count || 0;
    let freezeCount = streakRow?.streak_freezes || 0;
    const weekendPassEnabled = streakRow?.weekend_pass_enabled || false;
    const lastFreezeEarnedAt = streakRow?.last_freeze_earned_at
      ? new Date(streakRow.last_freeze_earned_at)
      : null;
    const existingComebackStart = streakRow?.comeback_bonus_start || null;
    const existingComebackExpires = streakRow?.comeback_bonus_expires || null;

    // Result flags
    let freezeEarned = false;
    let freezeConsumed = false;
    let streakBroken = false;
    let comebackBonusActivated = false;

    // Upsert payload — we build this incrementally
    const updatePayload = {
      student_id: session.user.id,
      updated_at: today.toISOString(),
    };

    // ── Step 1: Determine new streak count ────────────────────────

    if (!lastPractice) {
      // First time practicing
      currentStreak = 1;
      updatePayload.streak_count = 1;
    } else {
      const todayDate = getCalendarDate(today);
      const lastPracticeDate = getCalendarDate(lastPractice);

      if (lastPracticeDate === todayDate) {
        // Same calendar day — no streak change, return early
        return { newStreak: currentStreak, freezeEarned: false, freezeConsumed: false, streakBroken: false, comebackBonusActivated: false };
      }

      const hours = hoursSince(lastPractice);

      // Weekend pass: check if all intermediate days are Fri/Sat
      let isWeekendPassConsecutive = false;
      if (weekendPassEnabled) {
        isWeekendPassConsecutive = allIntermediateDaysAreWeekend(lastPractice, today);
      }

      if (isWeekendPassConsecutive || hours <= GRACE_WINDOW_HOURS) {
        // Consecutive: grace window OR weekend pass bridges the gap
        currentStreak += 1;
        updatePayload.streak_count = currentStreak;
      } else {
        // Past grace window — check for freeze
        if (freezeCount > 0) {
          // Consume one freeze — streak is preserved
          freezeCount -= 1;
          freezeConsumed = true;
          updatePayload.streak_count = currentStreak; // unchanged
          updatePayload.streak_freezes = freezeCount;
          updatePayload.last_freeze_consumed_at = today.toISOString();
        } else {
          // Streak breaks
          streakBroken = true;
          currentStreak = 1;
          updatePayload.streak_count = 1;

          // Activate comeback bonus (2x XP for 3 days)
          const comebackExpires = new Date(
            today.getTime() + COMEBACK_BONUS_DAYS * 24 * 60 * 60 * 1000
          );
          updatePayload.comeback_bonus_start = today.toISOString();
          updatePayload.comeback_bonus_expires = comebackExpires.toISOString();
          comebackBonusActivated = true;
        }
      }
    }

    // ── Step 2: Clear expired comeback bonus ──────────────────────

    if (
      existingComebackExpires &&
      new Date(existingComebackExpires).getTime() < Date.now() &&
      !comebackBonusActivated
    ) {
      updatePayload.comeback_bonus_start = null;
      updatePayload.comeback_bonus_expires = null;
    }

    // ── Step 3: Check freeze earning ──────────────────────────────
    // Earn a freeze at every 7-day milestone, capped at MAX_FREEZE_COUNT.
    // Guard against double-earn: if we already earned a freeze at this exact
    // milestone streak level within the last 7 days, skip.

    const newStreakForEarn = updatePayload.streak_count ?? currentStreak;

    if (
      newStreakForEarn > 0 &&
      newStreakForEarn % FREEZE_EARN_INTERVAL === 0 &&
      freezeCount < MAX_FREEZE_COUNT
    ) {
      // Double-earn guard: check that last_freeze_earned_at is not from the same
      // streak milestone window (within the last FREEZE_EARN_INTERVAL days)
      let alreadyEarnedThisMilestone = false;
      if (lastFreezeEarnedAt) {
        const daysSinceLastEarn =
          (today.getTime() - lastFreezeEarnedAt.getTime()) /
          (1000 * 60 * 60 * 24);
        alreadyEarnedThisMilestone = daysSinceLastEarn < FREEZE_EARN_INTERVAL;
      }

      if (!alreadyEarnedThisMilestone) {
        freezeCount += 1;
        freezeEarned = true;
        updatePayload.streak_freezes = freezeCount;
        updatePayload.last_freeze_earned_at = today.toISOString();
      }
    }

    // ── Step 4: Write streak to database ─────────────────────────

    const { error: streakError } = await supabase
      .from("current_streak")
      .upsert(updatePayload, { onConflict: "student_id" });

    if (streakError) {
      console.error("Error updating streak:", streakError);
      return { newStreak: currentStreak, freezeEarned: false, freezeConsumed: false, streakBroken: false, comebackBonusActivated: false };
    }

    // ── Step 5: Update last practice date ────────────────────────

    const { error: practiceError } = await supabase
      .from("last_practiced_date")
      .upsert(
        {
          student_id: session.user.id,
          practiced_at: today.toISOString(),
        },
        { onConflict: "student_id" }
      );

    if (practiceError) {
      console.error("Error updating practice date:", practiceError);
    }

    // ── Step 6: Update highest streak ────────────────────────────

    const { data: highestStreak } = await supabase
      .from("highest_streak")
      .select("streak_count")
      .eq("student_id", session.user.id)
      .maybeSingle();

    if (!highestStreak || currentStreak > highestStreak.streak_count) {
      await supabase.from("highest_streak").upsert(
        {
          student_id: session.user.id,
          streak_count: currentStreak,
          achieved_at: today.toISOString(),
        },
        { onConflict: "student_id" }
      );
    }

    return {
      newStreak: currentStreak,
      freezeEarned,
      freezeConsumed,
      streakBroken,
      comebackBonusActivated,
    };
  },

  /**
   * Resets the streak to 0 and clears all protection state.
   * Also clears freeze inventory and comeback bonus columns.
   */
  async resetStreak() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const today = new Date();

    await supabase.from("current_streak").upsert(
      {
        student_id: session.user.id,
        streak_count: 0,
        streak_freezes: 0,
        weekend_pass_enabled: false,
        last_freeze_earned_at: null,
        comeback_bonus_start: null,
        comeback_bonus_expires: null,
        last_freeze_consumed_at: null,
        updated_at: today.toISOString(),
      },
      { onConflict: "student_id" }
    );

    await supabase.from("last_practiced_date").upsert(
      {
        student_id: session.user.id,
        practiced_at: null,
      },
      { onConflict: "student_id" }
    );
  },
};
