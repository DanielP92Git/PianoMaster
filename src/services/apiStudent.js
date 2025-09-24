import supabase from "./supabase";

// Get student's assignments
export const getStudentAssignments = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: assignments, error } = await supabase
      .from("assignment_submissions")
      .select(
        `
        *,
        assignments!inner(
          *,
          classes(*)
        )
      `
      )
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform assignments to include assignment details
    const transformedAssignments = assignments.map((submission) => ({
      ...submission,
      assignment: submission.assignments,
      status: submission.submitted_at ? "completed" : "pending",
      daysRemaining: submission.assignments.due_date
        ? Math.ceil(
            (new Date(submission.assignments.due_date) - new Date()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
    }));

    return transformedAssignments;
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    return [];
  }
};

// Submit assignment
export const submitAssignment = async (submissionId, submissionData) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: submission, error } = await supabase
      .from("assignment_submissions")
      .update({
        submitted_at: new Date().toISOString(),
        submission_content: submissionData.content,
        submission_audio_url: submissionData.audioUrl || null,
        submission_notes: submissionData.notes || null,
        points_earned: submissionData.pointsEarned || null,
      })
      .eq("id", submissionId)
      .eq("student_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return submission;
  } catch (error) {
    console.error("Error submitting assignment:", error);
    throw error;
  }
};
