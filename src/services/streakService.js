import supabase from "./supabase";

export const streakService = {
  // Get current streak from Supabase
  async getStreak() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return 0;

    const { data, error } = await supabase
      .from("current_streak")
      .select("streak_count")
      .eq("student_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching streak:", error);
      return 0;
    }

    return data?.streak_count || 0;
  },

  // Get last practice date
  async getLastPracticeDate() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from("last_practiced_date")
      .select("practiced_at")
      .eq("student_id", session.user.id)
      .single();

    if (error || !data?.practiced_at) return null;
    return new Date(data.practiced_at);
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

    if (!lastPractice) {
      // First time practicing
      currentStreak = 1;
    } else {
      const diffTime = today.getTime() - lastPractice.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already practiced today, don't update streak
        return currentStreak;
      } else if (diffDays === 1) {
        // Consecutive day, increase streak
        currentStreak += 1;
      } else {
        // Streak broken
        currentStreak = 1;
      }
    }

    // Update streak count
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
