import supabase from "./supabase";

/**
 * Get user preferences from database
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User preferences or null if not found
 */
export async function getUserPreferences(userId) {
  try {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    throw error;
  }
}

/**
 * Update user preferences in database
 * Creates new record if it doesn't exist, updates if it does
 * @param {string} userId - User ID
 * @param {Object} preferences - Preferences object
 * @returns {Promise<Object>} Updated preferences
 */
export async function updateUserPreferences(userId, preferences) {
  try {
    // First check if preferences exist
    const existing = await getUserPreferences(userId);

    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from("user_preferences")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from("user_preferences")
        .insert({
          user_id: userId,
          ...preferences,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
}

/**
 * Update user profile information
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateProfile(userId, profileData) {
  try {
    const { data, error } = await supabase
      .from("students")
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

/**
 * Check if username is available
 * @param {string} username - Username to check
 * @param {string} currentUserId - Current user ID (to exclude from check)
 * @returns {Promise<boolean>} True if available, false if taken
 */
export async function checkUsernameAvailability(username, currentUserId) {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("id")
      .eq("username", username)
      .neq("id", currentUserId);

    if (error) throw error;

    // Username is available if no records found
    return !data || data.length === 0;
  } catch (error) {
    console.error("Error checking username availability:", error);
    throw error;
  }
}

/**
 * Get current user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User profile or null if not found
 */
export async function getCurrentProfile(userId) {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching current profile:", error);
    throw error;
  }
}
