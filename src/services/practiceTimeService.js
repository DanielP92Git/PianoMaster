import supabase from "./supabase";

export const practiceTimeService = {
  // Get practice time data aggregated by day for the last 30 days
  async getDailyPracticeTime(studentId, days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("practice_sessions")
      .select("duration, created_at")
      .eq("student_id", studentId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Group by day and sum duration
    const dailyData = {};

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      dailyData[dateKey] = 0;
    }

    // Aggregate actual data
    data.forEach((session) => {
      const dateKey = session.created_at.split("T")[0];
      dailyData[dateKey] = (dailyData[dateKey] || 0) + (session.duration || 0);
    });

    // Convert to array format for charts
    return Object.entries(dailyData)
      .map(([date, duration]) => ({
        date,
        duration,
        formattedDate: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  // Get practice time data aggregated by week for the last 12 weeks
  async getWeeklyPracticeTime(studentId, weeks = 12) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const { data, error } = await supabase
      .from("practice_sessions")
      .select("duration, created_at")
      .eq("student_id", studentId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Group by week
    const weeklyData = {};

    data.forEach((session) => {
      const sessionDate = new Date(session.created_at);
      // Get start of week (Sunday)
      const startOfWeek = new Date(sessionDate);
      startOfWeek.setDate(sessionDate.getDate() - sessionDate.getDay());
      const weekKey = startOfWeek.toISOString().split("T")[0];

      weeklyData[weekKey] =
        (weeklyData[weekKey] || 0) + (session.duration || 0);
    });

    // Fill in missing weeks with 0
    const result = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      result.push({
        date: weekKey,
        duration: weeklyData[weekKey] || 0,
        formattedDate: `${weekStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${weekEnd.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`,
      });
    }

    return result;
  },

  // Get practice time data aggregated by month for the last 12 months
  async getMonthlyPracticeTime(studentId, months = 12) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabase
      .from("practice_sessions")
      .select("duration, created_at")
      .eq("student_id", studentId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Group by month
    const monthlyData = {};

    data.forEach((session) => {
      const sessionDate = new Date(session.created_at);
      const monthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, "0")}`;

      monthlyData[monthKey] =
        (monthlyData[monthKey] || 0) + (session.duration || 0);
    });

    // Fill in missing months with 0
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

      result.push({
        date: monthKey,
        duration: monthlyData[monthKey] || 0,
        formattedDate: monthDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      });
    }

    return result;
  },

  // Get summary statistics
  async getPracticeTimeSummary(studentId) {
    const { data, error } = await supabase
      .from("practice_sessions")
      .select("duration, created_at")
      .eq("student_id", studentId);

    if (error) throw error;

    const totalTime = data.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );
    const totalSessions = data.length;
    const averageSessionTime =
      totalSessions > 0 ? totalTime / totalSessions : 0;

    // Calculate this week's practice time
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekTime = data
      .filter((session) => new Date(session.created_at) >= weekStart)
      .reduce((sum, session) => sum + (session.duration || 0), 0);

    // Calculate this month's practice time
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const thisMonthTime = data
      .filter((session) => new Date(session.created_at) >= monthStart)
      .reduce((sum, session) => sum + (session.duration || 0), 0);

    // Calculate average daily practice time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30DaysTime = data
      .filter((session) => new Date(session.created_at) >= thirtyDaysAgo)
      .reduce((sum, session) => sum + (session.duration || 0), 0);

    const averageDailyTime = last30DaysTime / 30;

    return {
      totalTime,
      totalSessions,
      averageSessionTime,
      thisWeekTime,
      thisMonthTime,
      averageDailyTime,
    };
  },

  // Format duration in minutes to human readable format
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  },
};
