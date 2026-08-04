import supabase from "./supabase";

/**
 * apiChildProfiles — CRUD for the `child_profiles` table.
 *
 * Ownership model: `child_profiles.parent_id = auth.uid()`. RLS policy
 * `child_profiles_all_parent_owner` (applied in Phase 2) enforces this
 * server-side via USING + WITH CHECK, so mutations here do NOT run an
 * extra ownership SELECT before writing — the DB is the authority
 * (mirrors src/services/apiTeacher.js's addStudentToTeacher /
 * removeStudentFromTeacher owner-scoped mutation pattern).
 */

/**
 * Creates a new child_profiles row owned by the current authenticated parent.
 * @param {{ nickname: string, avatarId: string }} params
 * @returns {Promise<object>} the created row
 * @throws {Error} "Not authenticated" if no session; Supabase error otherwise
 */
export async function createChildProfile({ nickname, avatarId }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("child_profiles")
    .insert([
      {
        parent_id: user.id,
        nickname,
        avatar_id: avatarId,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Renames an owned child profile.
 * @param {string} childId
 * @param {string} nickname
 * @throws {Error} "Not authenticated" if no session; Supabase error otherwise
 */
export async function renameChildProfile(childId, nickname) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("child_profiles")
    .update({ nickname })
    .eq("id", childId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Updates an owned child profile's avatar.
 * @param {string} childId
 * @param {string} avatarId
 * @throws {Error} "Not authenticated" if no session; Supabase error otherwise
 */
export async function updateChildAvatar(childId, avatarId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("child_profiles")
    .update({ avatar_id: avatarId })
    .eq("id", childId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Activates/deactivates ("pause") an owned child profile (D-10).
 * @param {string} childId
 * @param {boolean} isActive
 * @throws {Error} "Not authenticated" if no session; Supabase error otherwise
 */
export async function setChildActive(childId, isActive) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("child_profiles")
    .update({ is_active: isActive })
    .eq("id", childId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reads all child_profiles rows owned by the given parent.
 * @param {string} parentId
 * @returns {Promise<object[]>}
 */
export async function getChildProfiles(parentId) {
  const { data, error } = await supabase
    .from("child_profiles")
    .select("*")
    .eq("parent_id", parentId);

  if (error) throw error;
  return data;
}
