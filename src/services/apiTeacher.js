import supabase from "./supabase";

// ============================================
// Security Helper Functions
// ============================================

/**
 * Verifies that a teacher has an accepted connection to a specific student.
 * This MUST be called before any operation that modifies student data.
 * @param {string} teacherId - The teacher's user ID
 * @param {string} studentId - The student's user ID
 * @throws {Error} If no valid connection exists
 * @returns {Promise<boolean>} True if connection exists
 */
async function verifyTeacherStudentConnection(teacherId, studentId) {
  const { data, error } = await supabase
    .from("teacher_student_connections")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("student_id", studentId)
    .eq("status", "accepted")
    .single();

  if (error || !data) {
    throw new Error("Unauthorized: No connection to this student");
  }
  return true;
}

/**
 * Verifies that a teacher owns a specific assignment.
 * @param {string} teacherId - The teacher's user ID
 * @param {string} assignmentId - The assignment ID
 * @throws {Error} If the teacher does not own the assignment
 * @returns {Promise<Object>} The assignment data if owned
 */
async function verifyTeacherOwnsAssignment(teacherId, assignmentId) {
  const { data, error } = await supabase
    .from("assignments")
    .select("id, teacher_id")
    .eq("id", assignmentId)
    .eq("teacher_id", teacherId)
    .single();

  if (error || !data) {
    throw new Error("Unauthorized: You do not own this assignment");
  }
  return data;
}

// Get teacher's students (simplified approach - direct teacher-student connections)
export const getTeacherStudents = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // First, ensure teacher profile exists
    let { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("*")
      .eq("id", user.id)
      .single();

    if (teacherError && teacherError.code === "PGRST116") {
      // Teacher doesn't exist, create one
      const { data: newTeacher, error: createError } = await supabase
        .from("teachers")
        .insert([
          {
            id: user.id,
            first_name:
              user.user_metadata?.full_name?.split(" ")[0] ||
              user.email?.split("@")[0] ||
              "Teacher",
            last_name:
              user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
              "",
            email: user.email,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      teacher = newTeacher;
    } else if (teacherError) {
      throw teacherError;
    }

    // Get students connected to this teacher
    const { data: connections, error: connectionsError } = await supabase
      .from("teacher_student_connections")
      .select("student_id, status, connected_at")
      .eq("teacher_id", user.id)
      .eq("status", "accepted");

    if (connectionsError) throw connectionsError;

    // Get student details from available tables
    const studentIds = connections?.map((conn) => conn.student_id) || [];

    // No connected students; nothing else to aggregate.
    if (studentIds.length === 0) {
      return [];
    }

    let students = [];
    if (studentIds.length > 0) {
      // Try to get student data from students table
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(
          "id, first_name, last_name, email, username, level, studying_year, created_at"
        )
        .in("id", studentIds);

      if (studentsError) {
        console.warn("Could not fetch from students table:", studentsError);
      }

      // Create student records from available data
      students = studentIds.map((studentId) => {
        const studentData = studentsData?.find((s) => s.id === studentId) || {};

        return {
          id: studentId,
          first_name: studentData.first_name || "Unknown",
          last_name: studentData.last_name || "Student",
          email:
            studentData.email || `student-${studentId.slice(0, 8)}@example.com`,
          username: studentData.username || `student_${studentId.slice(0, 8)}`,
          level: studentData.level || "Beginner",
          studying_year: studentData.studying_year || "N/A",
          created_at: studentData.created_at || new Date().toISOString(),
        };
      });
    }

    // Create a map of student ID to connected_at date
    const connectionDates = {};
    connections?.forEach((conn) => {
      connectionDates[conn.student_id] = conn.connected_at;
    });

    // Get all practice sessions
    const { data: allPracticeSessions, error: practiceError } = await supabase
      .from("practice_sessions")
      .select(
        "id, student_id, duration, analysis_score, submitted_at, has_recording, recording_url"
      )
      .in("student_id", studentIds);

    if (practiceError) throw practiceError;

    // Get student points (preferred): RPC returns per-student totals for this teacher.
    // This is robust against future RLS consolidations that might hide direct table reads.
    let pointsRows = null;
    const { data: rpcPoints, error: rpcPointsError } = await supabase.rpc(
      "teacher_get_student_points"
    );
    if (rpcPointsError) {
      console.warn(
        "Teacher points RPC unavailable; falling back to direct table reads. Consider applying migration 20251215000001_restore_teacher_points_access.sql.",
        rpcPointsError
      );
    } else {
      pointsRows = rpcPoints || [];
    }

    // Fallback path: compute totals from students_score + student_achievements if RPC is missing.
    // Note: This requires RLS policies to allow teachers to SELECT connected students' rows.
    let gameScores = [];
    let achievements = [];
    if (!pointsRows) {
      const { data: gameScoresData, error: gameScoresError } = await supabase
        .from("students_score")
        .select("student_id, score")
        .in("student_id", studentIds);
      if (gameScoresError) throw gameScoresError;
      gameScores = gameScoresData || [];

      const { data: achievementsData, error: achievementsError } =
        await supabase
          .from("student_achievements")
          .select("student_id, points")
          .in("student_id", studentIds);
      if (achievementsError) throw achievementsError;
      achievements = achievementsData || [];
    }

    // Get current streaks
    const { data: streaks, error: streaksError } = await supabase
      .from("current_streak")
      .select("student_id, streak_count")
      .in("student_id", studentIds);

    if (streaksError) throw streaksError;

    // Create lookup maps for performance
    const practicesByStudent = {};
    const scoresByStudent = {}; // student_id -> total points (game + achievements)
    const streaksByStudent = {};

    allPracticeSessions?.forEach((session) => {
      if (!practicesByStudent[session.student_id]) {
        practicesByStudent[session.student_id] = [];
      }
      practicesByStudent[session.student_id].push(session);
    });

    if (pointsRows) {
      // RPC already returns totals; use those.
      pointsRows.forEach((row) => {
        if (!row?.student_id) return;
        scoresByStudent[row.student_id] = Number(row.total_points || 0);
      });
      if (studentIds.length > 0 && pointsRows.length === 0) {
        console.warn(
          "Teacher points RPC returned 0 rows despite having connected students. Check teacher_student_connections.status and RLS/auth context.",
          { teacherId: user.id, connectedStudentCount: studentIds.length }
        );
      }
    } else {
      // Compute totals dynamically (game scores + achievement points)
      gameScores?.forEach((score) => {
        scoresByStudent[score.student_id] =
          (scoresByStudent[score.student_id] || 0) + (score.score || 0);
      });

      achievements?.forEach((achievement) => {
        scoresByStudent[achievement.student_id] =
          (scoresByStudent[achievement.student_id] || 0) +
          (achievement.points || 0);
      });

      if (
        studentIds.length > 0 &&
        gameScores.length === 0 &&
        achievements.length === 0
      ) {
        console.warn(
          "Teacher score/achievement queries returned no rows. This commonly indicates RLS blocking teacher reads. Apply migration 20251215000001_restore_teacher_points_access.sql or rely on teacher_get_student_points RPC.",
          { teacherId: user.id, connectedStudentCount: studentIds.length }
        );
      }
    }

    streaks?.forEach((streak) => {
      streaksByStudent[streak.student_id] = streak.streak_count;
    });

    // Transform students with metrics (show all connected students, not just those with practice data)
    const studentsWithMetrics = (students || []).map((student) => {
      const practices = practicesByStudent[student.id] || [];
      const recordings = practices.filter((session) => {
        const hasRecordingFlag =
          session.has_recording === null || session.has_recording === true;
        const hasRecordingUrl =
          typeof session.recording_url === "string" &&
          session.recording_url.trim().length > 0;
        return hasRecordingFlag && hasRecordingUrl;
      });

      // Calculate metrics
      const totalPracticeMinutes = practices.reduce(
        (sum, session) => sum + (session.duration || 0),
        0
      );
      const averageAccuracy =
        practices.length > 0
          ? practices.reduce(
              (sum, session) => sum + (session.analysis_score || 0),
              0
            ) / practices.length
          : 0;
      const lastPracticeDate =
        practices.length > 0
          ? new Date(
              Math.max(...practices.map((p) => new Date(p.submitted_at)))
            )
          : null;

      const transformedStudent = {
        student_id: student.id,
        student_name:
          `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
          student.username ||
          "Unknown Student",
        email: student.email,
        level: student.level || "Beginner",
        studying_year: student.studying_year || "N/A",
        total_points: scoresByStudent[student.id] || 0,
        current_streak: streaksByStudent[student.id] || 0,
        total_practice_minutes: totalPracticeMinutes,
        average_accuracy: Math.round(averageAccuracy),
        total_achievements: 0, // Not available in current schema
        last_practice_date: lastPracticeDate,
        member_since: connectionDates[student.id]
          ? new Date(connectionDates[student.id]).toLocaleDateString("en-GB")
          : new Date(student.created_at).toLocaleDateString("en-GB"),
        recent_practices: practices
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
          .slice(0, 5), // Last 5 sessions
        // For the teacher detail modal: sessions that actually have an audio recording attached.
        // UI intentionally shows only date + duration (no audio playback here).
        recent_recordings: recordings
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
          .slice(0, 5),
      };

      return transformedStudent;
    });

    return studentsWithMetrics;
  } catch (error) {
    console.error("Error fetching teacher students:", error);
    throw error;
  }
};

// Add student to teacher by creating a new student record
export const addStudentToTeacher = async (studentData) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const normalizedEmail = studentData.email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error("Student email is required to add a connection");
    }

    const payload = {
      p_student_email: normalizedEmail,
      p_first_name: studentData.firstName?.trim() || null,
      p_last_name: studentData.lastName?.trim() || null,
      p_level: studentData.level || null,
      p_studying_year: studentData.studyingYear || null,
      p_start_date: studentData.startDate
        ? new Date(studentData.startDate).toISOString()
        : null,
    };

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "teacher_link_student",
      payload
    );

    if (rpcError) {
      throw rpcError;
    }

    if (!rpcResult) {
      throw new Error("Failed to link student. No data was returned.");
    }

    const result = {
      student_id: rpcResult.student_id,
      student_name:
        rpcResult.student_name ||
        rpcResult.email?.split("@")[0] ||
        "Unknown Student",
      student_email: rpcResult.email,
      connection_status: rpcResult.connection_status || "accepted",
      connection_id: rpcResult.connection_id,
      needs_signup: rpcResult.needs_signup,
      was_existing_student: rpcResult.was_existing_student,
    };

    return result;
  } catch (error) {
    console.error("Error adding student to teacher:", error);
    throw error;
  }
};

// Get student detailed progress
export const getStudentProgress = async (studentId) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // SECURITY: Verify teacher has connection to this student
    await verifyTeacherStudentConnection(user.id, studentId);

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        username,
        level,
        studying_year,
        created_at
      `
      )
      .eq("id", studentId)
      .single();

    if (studentError) throw studentError;

    // Get student's practice sessions
    const { data: practices, error: practicesError } = await supabase
      .from("practice_sessions")
      .select(
        "id, duration, analysis_score, submitted_at, recording_url, notes_played"
      )
      .eq("student_id", studentId)
      .order("submitted_at", { ascending: false });

    if (practicesError) throw practicesError;

    // Process and structure the data
    const practiceSessions = practices || [];

    // Calculate detailed metrics
    const totalPracticeMinutes = practiceSessions.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );
    const averageAccuracy =
      practiceSessions.length > 0
        ? practiceSessions.reduce(
            (sum, session) => sum + (session.analysis_score || 0),
            0
          ) / practiceSessions.length
        : 0;

    // Group practices by date for chart data
    const practicesByDate = practiceSessions.reduce((acc, session) => {
      const date = new Date(session.submitted_at).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + session.duration;
      return acc;
    }, {});

    // Get last 30 days of practice
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    const practiceChart = last30Days.map((date) => ({
      date,
      minutes: practicesByDate[date] || 0,
    }));

    return {
      student: {
        id: student.id,
        name:
          `${student.first_name} ${student.last_name || ""}`.trim() ||
          student.username ||
          "Unknown",
        email: student.email,
        level: student.level || "Beginner",
        studying_year: student.studying_year || "N/A",
        total_points: 0, // Not available in current schema
        current_streak: 0, // Not available in current schema
        longest_streak: 0, // Not available in current schema
        member_since: new Date(student.created_at).toLocaleDateString(),
      },
      metrics: {
        total_practice_minutes: totalPracticeMinutes,
        average_accuracy: Math.round(averageAccuracy),
        total_sessions: practiceSessions.length,
        total_achievements: 0, // Not available in current schema
      },
      recent_practices: practiceSessions.slice(0, 10), // Already sorted by submitted_at desc
      recent_achievements: [], // Not available in current schema
      practice_chart: practiceChart,
    };
  } catch (error) {
    console.error("Error fetching student progress:", error);
    throw error;
  }
};

// Send message to student
export const sendStudentMessage = async (studentId, messageText) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // SECURITY: Verify teacher has connection to this student
    await verifyTeacherStudentConnection(user.id, studentId);

    // Create a notification for the student as a message
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert([
        {
          recipient_id: studentId,
          sender_id: user.id,
          type: "message",
          title: "Message from Teacher",
          message: messageText,
          data: {
            teacher_id: user.id,
            teacher_email: user.email,
            sent_at: new Date().toISOString(),
          },
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return notification;
  } catch (error) {
    console.error("Error sending message to student:", error);
    throw error;
  }
};

// Teacher Profile Management (keeping for completeness)
export const getTeacherProfile = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: teacher, error } = await supabase
      .from("teachers")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code === "PGRST116") {
      // Teacher doesn't exist, return null to trigger creation
      return null;
    }

    if (error) throw error;
    return teacher;
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    throw error;
  }
};

export const updateTeacherProfile = async (updates) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: teacher, error } = await supabase
      .from("teachers")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    return teacher;
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    throw error;
  }
};

// Delete a single student connection
export const removeStudentFromTeacher = async (studentId) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Remove the connection between teacher and student
    const { error: connectionError } = await supabase
      .from("teacher_student_connections")
      .delete()
      .eq("teacher_id", user.id)
      .eq("student_id", studentId);

    if (connectionError) throw connectionError;

    return { success: true, message: "Student removed successfully" };
  } catch (error) {
    console.error("Error removing student from teacher:", error);
    throw error;
  }
};

// Delete multiple student connections
export const removeMultipleStudentsFromTeacher = async (studentIds) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Remove connections for multiple students
    const { error: connectionError } = await supabase
      .from("teacher_student_connections")
      .delete()
      .eq("teacher_id", user.id)
      .in("student_id", studentIds);

    if (connectionError) throw connectionError;

    return {
      success: true,
      message: `${studentIds.length} student${studentIds.length > 1 ? "s" : ""} removed successfully`,
    };
  } catch (error) {
    console.error("Error removing multiple students from teacher:", error);
    throw error;
  }
};

// Update student details
export const updateStudentDetails = async (studentId, updates) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Verify that this teacher has a connection to the student
    const { data: connection, error: connectionError } = await supabase
      .from("teacher_student_connections")
      .select("id")
      .eq("teacher_id", user.id)
      .eq("student_id", studentId)
      .eq("status", "accepted")
      .single();

    if (connectionError)
      throw new Error("You don't have permission to edit this student");

    // Update the student details
    const { data: updatedStudent, error: updateError } = await supabase
      .from("students")
      .update({
        first_name: updates.firstName,
        last_name: updates.lastName,
        email: updates.email.toLowerCase(),
        level: updates.level,
        studying_year: updates.studyingYear,
        updated_at: new Date().toISOString(),
      })
      .eq("id", studentId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update the connection start date if provided
    if (updates.startDate) {
      const { error: connectionUpdateError } = await supabase
        .from("teacher_student_connections")
        .update({
          connected_at: new Date(updates.startDate).toISOString(),
        })
        .eq("teacher_id", user.id)
        .eq("student_id", studentId);

      if (connectionUpdateError) {
        console.warn(
          "Failed to update connection start date:",
          connectionUpdateError
        );
        // Don't fail the whole operation, just log the error
      }
    }

    return {
      success: true,
      message: "Student details updated successfully",
      student: updatedStudent,
    };
  } catch (error) {
    console.error("Error updating student details:", error);
    throw error;
  }
};

// Get all recordings from teacher's students for review
export const getTeacherRecordings = async (filters = {}) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Check if user has teacher role
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    if (userRole !== "teacher") {
      console.warn("⚠️ User is not a teacher, role:", userRole);
    }

    // First get all student IDs connected to this teacher
    const { data: connections, error: connectionsError } = await supabase
      .from("teacher_student_connections")
      .select("student_id, status, created_at")
      .eq("teacher_id", user.id)
      .eq("status", "accepted"); // Only get accepted connections

    if (connectionsError) {
      throw connectionsError;
    }

    if (!connections || connections.length === 0) {
      return [];
    }

    const studentIds = connections.map((conn) => conn.student_id);

    // Build query for practice sessions (without join to avoid schema cache issues)
    let query = supabase
      .from("practice_sessions")
      .select(
        `
        id,
        student_id,
        has_recording,
        recording_url,
        submitted_at,
        duration,
        analysis_score,
        teacher_feedback,
        status,
        notes_played,
        recording_description,
        reviewed_at
      `
      )
      .in("student_id", studentIds)
      .not("recording_url", "is", null)
      .neq("recording_url", "")
      .order("submitted_at", { ascending: false });

    // Apply filters
    if (filters.studentId) {
      query = query.eq("student_id", filters.studentId);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.startDate) {
      query = query.gte("submitted_at", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("submitted_at", filters.endDate);
    }

    // Limit results (default to 50 most recent)
    const limit = filters.limit || 50;
    query = query.limit(limit);

    const { data: recordings, error: recordingsError } = await query;

    if (recordingsError) {
      throw recordingsError;
    }

    if (!recordings || recordings.length === 0) {
      return [];
    }

    // Only keep sessions that we know have an audio recording.
    const audioRecordings = recordings.filter((recording) => {
      const hasRecordingFlag =
        recording.has_recording === null || recording.has_recording === true;
      const hasRecordingUrl =
        typeof recording.recording_url === "string" &&
        recording.recording_url.trim().length > 0;

      return hasRecordingFlag && hasRecordingUrl;
    });

    if (audioRecordings.length === 0) {
      return [];
    }

    // Get student data separately to avoid join issues
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("id, first_name, last_name, username, email")
      .in("id", studentIds);

    if (studentsError) {
      throw studentsError;
    }

    // Create a map of student data for quick lookup
    const studentsMap = (studentsData || []).reduce((map, student) => {
      map[student.id] = student;
      return map;
    }, {});

    // Format the data
    const formattedRecordings = audioRecordings.map((recording) => {
      const student = studentsMap[recording.student_id];
      return {
        ...recording,
        student_name: student
          ? `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
            student.username ||
            "Unknown Student"
          : "Unknown Student",
        student_email: student?.email || "N/A",
        formatted_date: new Date(recording.submitted_at).toLocaleDateString(
          "en-GB",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        duration_formatted: recording.duration
          ? `${Math.floor(recording.duration / 60)}:${(recording.duration % 60)
              .toString()
              .padStart(2, "0")}`
          : "Unknown",
      };
    });

    return formattedRecordings;
  } catch (error) {
    console.error("Error fetching teacher recordings:", error);
    throw error;
  }
};

// Update practice session feedback and status
export const updatePracticeSessionReview = async (sessionId, updates) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const reviewData = {
      ...updates,
      reviewed_at: new Date().toISOString(),
    };

    const { data: session, error } = await supabase
      .from("practice_sessions")
      .update(reviewData)
      .eq("id", sessionId)
      .select("*")
      .single();

    if (error) throw error;

    // Get student data separately to avoid join issues
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, first_name, last_name, username, email")
      .eq("id", session.student_id)
      .single();

    if (studentError) {
      console.warn("Could not fetch student data:", studentError);
    }

    return {
      ...session,
      student_name: student
        ? `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
          student.username ||
          "Unknown Student"
        : "Unknown Student",
      student_email: student?.email || "N/A",
    };
  } catch (error) {
    console.error("Error updating practice session review:", error);
    throw error;
  }
};

// Delete multiple practice session recordings
export const deletePracticeSessions = async (sessionIds) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Verify user is a teacher
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    if (userRole !== "teacher") {
      throw new Error("Only teachers can delete recordings");
    }

    // SECURITY: First, fetch the sessions to verify teacher has connection to each student
    const { data: sessions, error: fetchError } = await supabase
      .from("practice_sessions")
      .select("id, student_id")
      .in("id", sessionIds);

    if (fetchError) throw fetchError;

    if (!sessions || sessions.length === 0) {
      throw new Error("No practice sessions found with the provided IDs");
    }

    // Get unique student IDs from the sessions
    const uniqueStudentIds = [...new Set(sessions.map((s) => s.student_id))];

    // Verify teacher has connection to ALL students whose sessions are being deleted
    for (const studentId of uniqueStudentIds) {
      await verifyTeacherStudentConnection(user.id, studentId);
    }

    // Delete the practice sessions (now that authorization is verified)
    const { error } = await supabase
      .from("practice_sessions")
      .delete()
      .in("id", sessionIds);

    if (error) throw error;

    return {
      success: true,
      message: `Successfully deleted ${sessionIds.length} recording${sessionIds.length > 1 ? "s" : ""}`,
    };
  } catch (error) {
    console.error("Error deleting practice sessions:", error);
    throw error;
  }
};

// Assignment Management Functions

// Get teacher's assignments
export const getTeacherAssignments = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: assignments, error } = await supabase
      .from("assignments")
      .select(
        `
        *,
        assignment_submissions!left(
          id,
          student_id,
          status,
          completion_percentage,
          practice_sessions,
          total_practice_time,
          score,
          submitted_at
        )
      `
      )
      .eq("teacher_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform assignments to include submission count
    const transformedAssignments = assignments.map((assignment) => ({
      ...assignment,
      submission_count: assignment.assignment_submissions?.length || 0,
    }));

    return transformedAssignments;
  } catch (error) {
    console.error("Error fetching teacher assignments:", error);
    throw error;
  }
};

// Create new assignment
export const createAssignment = async (assignmentData) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: assignment, error } = await supabase
      .from("assignments")
      .insert([
        {
          teacher_id: user.id,
          title: assignmentData.title,
          description: assignmentData.description,
          instructions: assignmentData.instructions,
          assignment_type: assignmentData.assignmentType,
          due_date: assignmentData.dueDate || null,
          points_possible: assignmentData.pointsPossible,
          requirements: assignmentData.requirements,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Get all connected students for this teacher
    const { data: connections, error: connectionsError } = await supabase
      .from("teacher_student_connections")
      .select("student_id")
      .eq("teacher_id", user.id)
      .eq("status", "accepted");

    if (connectionsError) throw connectionsError;

    // Create assignment submissions for all connected students
    if (connections && connections.length > 0) {
      const submissions = connections.map((conn) => ({
        assignment_id: assignment.id,
        student_id: conn.student_id,
        status: "assigned",
        completion_percentage: 0,
        practice_sessions: 0,
        total_practice_time: 0,
      }));

      const { error: submissionsError } = await supabase
        .from("assignment_submissions")
        .insert(submissions);

      if (submissionsError) {
        console.warn(
          "Error creating assignment submissions:",
          submissionsError
        );
      }

      // Create notifications for all students
      const notifications = connections.map((conn) => ({
        recipient_id: conn.student_id,
        sender_id: user.id,
        type: "assignment",
        title: `New Assignment: ${assignment.title}`,
        message: `You have a new assignment: ${assignment.description}`,
        priority: "normal",
        data: {
          assignment_id: assignment.id,
          due_date: assignment.due_date,
          points_possible: assignment.points_possible,
        },
      }));

      const { error: notificationsError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationsError) {
        console.warn(
          "Error creating assignment notifications:",
          notificationsError
        );
      }
    }

    return assignment;
  } catch (error) {
    console.error("Error creating assignment:", error);
    throw error;
  }
};

// Update assignment
export const updateAssignment = async (assignmentId, updates) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: assignment, error } = await supabase
      .from("assignments")
      .update(updates)
      .eq("id", assignmentId)
      .eq("teacher_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return assignment;
  } catch (error) {
    console.error("Error updating assignment:", error);
    throw error;
  }
};

// Delete assignment
export const deleteAssignment = async (assignmentId) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from("assignments")
      .update({ is_active: false })
      .eq("id", assignmentId)
      .eq("teacher_id", user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error deleting assignment:", error);
    throw error;
  }
};

// Get assignment submissions
export const getAssignmentSubmissions = async (assignmentId) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: submissions, error } = await supabase
      .from("assignment_submissions")
      .select(
        `
        *,
        students!inner(
          id,
          first_name,
          last_name,
          email,
          username
        )
      `
      )
      .eq("assignment_id", assignmentId);

    if (error) throw error;

    // Transform submissions to include student info
    const transformedSubmissions = submissions.map((submission) => ({
      ...submission,
      student_name:
        `${submission.students.first_name || ""} ${submission.students.last_name || ""}`.trim() ||
        submission.students.username ||
        "Unknown Student",
      student_email: submission.students.email,
    }));

    return transformedSubmissions;
  } catch (error) {
    console.error("Error fetching assignment submissions:", error);
    throw error;
  }
};

// Update submission grade
export const updateSubmissionGrade = async (submissionId, score, feedback) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // SECURITY: First, fetch the submission to get the assignment_id
    const { data: existingSubmission, error: fetchError } = await supabase
      .from("assignment_submissions")
      .select("id, assignment_id")
      .eq("id", submissionId)
      .single();

    if (fetchError || !existingSubmission) {
      throw new Error("Submission not found");
    }

    // Verify the teacher owns the assignment this submission belongs to
    await verifyTeacherOwnsAssignment(user.id, existingSubmission.assignment_id);

    // Now proceed with the update (authorization verified)
    const { data: submission, error } = await supabase
      .from("assignment_submissions")
      .update({
        score: score,
        feedback: feedback,
        status: "graded",
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) throw error;

    return submission;
  } catch (error) {
    console.error("Error updating submission grade:", error);
    throw error;
  }
};

// Notification Management Functions

// Get teacher notifications
export const getTeacherNotifications = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform notifications to include student info (simplified without join)
    const transformedNotifications = notifications.map((notification) => ({
      ...notification,
      student_name: null, // Will be populated when we need sender info
    }));

    return transformedNotifications;
  } catch (error) {
    console.error("Error fetching teacher notifications:", error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("recipient_id", user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("recipient_id", user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

// Archive notification
export const archiveNotification = async (notificationId) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("notifications")
      .update({ is_archived: true })
      .eq("id", notificationId)
      .eq("recipient_id", user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error archiving notification:", error);
    throw error;
  }
};

// Send notification to student
export const sendNotificationToStudent = async (notificationData) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // SECURITY: Verify teacher has connection to the recipient student
    await verifyTeacherStudentConnection(user.id, notificationData.recipientId);

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert([
        {
          recipient_id: notificationData.recipientId,
          sender_id: user.id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          priority: notificationData.priority,
          is_read: false,
          is_archived: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};
