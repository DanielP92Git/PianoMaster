/**
 * Authorization Utilities
 *
 * Shared authorization verification functions for defense-in-depth security.
 * These checks supplement RLS policies to provide better error messages
 * and prevent unauthorized access even if RLS is misconfigured.
 */

import supabase from "./supabase";

/**
 * Verify the current user has access to the specified student's data.
 * - Students can only access their own data
 * - Parents can access data of a child they own (child_profiles.parent_id)
 * - Teachers can access data of connected students
 * @param {string} studentId - The student ID to verify access for
 * @throws {Error} If not authenticated or unauthorized
 * @returns {Promise<{userId: string, isOwner: boolean, isTeacher: boolean, isParent?: boolean}>}
 */
export async function verifyStudentDataAccess(studentId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Students can access their own data
  if (user.id === studentId) {
    return { userId: user.id, isOwner: true, isTeacher: false };
  }

  // Parents can access data of a child they own.
  // RLS policy `child_profiles_all_parent_owner` also scopes this server-side —
  // the explicit .eq('parent_id', user.id) is defense-in-depth, not the sole guard.
  const { data: owned } = await supabase
    .from("child_profiles")
    .select("id")
    .eq("id", studentId)
    .eq("parent_id", user.id)
    .maybeSingle();

  if (owned) {
    return { userId: user.id, isOwner: true, isTeacher: false, isParent: true };
  }

  // Check if user is a teacher connected to this student
  const { data: connection, error } = await supabase
    .from("teacher_student_connections")
    .select("id")
    .eq("teacher_id", user.id)
    .eq("student_id", studentId)
    .eq("status", "accepted")
    .maybeSingle();

  if (error || !connection) {
    throw new Error("Unauthorized: No access to this student's data");
  }

  return { userId: user.id, isOwner: false, isTeacher: true };
}

/**
 * Get the current authenticated user ID.
 * @throws {Error} If not authenticated
 * @returns {Promise<string>} The user ID
 */
export async function getCurrentUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user.id;
}
