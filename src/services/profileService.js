import {
  updateProfile as apiUpdateProfile,
  checkUsernameAvailability as apiCheckUsername,
  getCurrentProfile as apiGetProfile,
} from "./apiSettings";

/**
 * Profile service for managing user profile operations
 */

/**
 * Update user profile with validation
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data (first_name, last_name, username)
 * @returns {Promise<Object>} Updated profile
 */
export async function updateProfile(userId, profileData) {
  // Validate required fields
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Validate username format if provided
  if (profileData.username) {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(profileData.username)) {
      throw new Error(
        "Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores"
      );
    }

    // Check if username is available
    const isAvailable = await apiCheckUsername(profileData.username, userId);
    if (!isAvailable) {
      throw new Error("Username is already taken");
    }
  }

  // Validate name fields if provided
  if (profileData.first_name && profileData.first_name.trim().length === 0) {
    throw new Error("First name cannot be empty");
  }

  if (profileData.last_name && profileData.last_name.trim().length === 0) {
    throw new Error("Last name cannot be empty");
  }

  // Update profile
  return await apiUpdateProfile(userId, profileData);
}

/**
 * Check if username is available
 * @param {string} username - Username to check
 * @param {string} currentUserId - Current user ID
 * @returns {Promise<boolean>} True if available
 */
export async function validateUsername(username, currentUserId) {
  if (!username) {
    throw new Error("Username is required");
  }

  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  if (!usernameRegex.test(username)) {
    throw new Error(
      "Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores"
    );
  }

  return await apiCheckUsername(username, currentUserId);
}

/**
 * Get current user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile
 */
export async function getCurrentProfile(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return await apiGetProfile(userId);
}
