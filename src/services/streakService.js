import supabase from "./supabase";

const FETCH_COOLDOWN_MS = 60 * 1000; // 1 minute backoff after network failure
let lastPracticeFetchInFlight = null;
let lastPracticeFetchFailed = false;
let lastPracticeFailureTS = 0;

const STREAK_FETCH_COOLDOWN_MS = 60 * 1000;
let streakFetchInFlight = null;
let streakFetchFailed = false;
let streakFailureTS = 0;

export const streakService = {
  // Get current streak from Supabase
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

  // Get last practice date
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

  // Update streak when user practices
  async updateStreak() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return 0;

    const today = new Date();
    const lastPractice = await this.getLastPracticeDate();
    let currentStreak = await this.getStreak();

    if (lastPracticeFetchFailed) {
      console.warn(
        "Skipping streak update because last_practiced_date lookup is failing"
      );
      return currentStreak;
    }

    if (streakFetchFailed) {
      console.warn("Skipping streak update because streak lookup is failing");
      return currentStreak;
    }

    // Helper function to get calendar date string in local timezone
    const getCalendarDate = (date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const todayDate = getCalendarDate(today);

    if (!lastPractice) {
      // First time practicing
      currentStreak = 1;
    } else {
      const lastPracticeDate = getCalendarDate(lastPractice);

      if (lastPracticeDate === todayDate) {
        // Already practiced today (same calendar day), don't update streak
        return currentStreak;
      }

      // Calculate calendar day difference using midnight boundaries
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const lastPracticeMidnight = new Date(
        lastPractice.getFullYear(),
        lastPractice.getMonth(),
        lastPractice.getDate()
      );
      const diffDays = Math.floor((todayMidnight - lastPracticeMidnight) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive calendar day, increase streak
        currentStreak += 1;
      } else if (diffDays > 1) {
        // Streak broken (missed a day)
        currentStreak = 1;
      }
      // If diffDays === 0, already handled above (same day)
    }

    // Update streak count in database
    const { error: streakError } = await supabase.from("current_streak").upsert(
      {
        student_id: session.user.id,
        streak_count: currentStreak,
        updated_at: today.toISOString(),
      },
      { onConflict: "student_id" }
    );

    if (streakError) {
      console.error("Error updating streak:", streakError);
      return currentStreak;
    }

    // Update last practice date
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

    // Update highest streak if needed
    const { data: highestStreak } = await supabase
      .from("highest_streak")
      .select("streak_count")
      .eq("student_id", session.user.id)
      .single();

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

    return currentStreak;
  },

  // Reset streak
  async resetStreak() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const today = new Date();

    // Reset current streak
    await supabase.from("current_streak").upsert(
      {
        student_id: session.user.id,
        streak_count: 0,
        updated_at: today.toISOString(),
      },
      { onConflict: "student_id" }
    );

    // Reset last practice date
    await supabase.from("last_practiced_date").upsert(
      {
        student_id: session.user.id,
        practiced_at: null,
      },
      { onConflict: "student_id" }
    );
  },
};
