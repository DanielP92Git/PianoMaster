/**
 * Consent Service
 *
 * Handles parental consent management for COPPA compliance.
 * Features:
 * - Token-based consent verification with 7-day expiry
 * - Secure token hashing using Web Crypto API
 * - Audit logging of all consent events
 * - Consent revocation with account suspension
 */

import supabase from './supabase';

/**
 * Hash a token using Web Crypto API (SHA-256)
 * @param {string} token - Raw token string
 * @returns {Promise<string>} Hex-encoded hash
 */
async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a consent token and send email to parent
 * Creates a secure token, stores the hash, and logs the request.
 *
 * @param {string} studentId - Student UUID
 * @param {string} parentEmail - Parent's email address
 * @returns {Promise<{consentUrl: string, expiresAt: Date}>}
 * @throws {Error} If not authenticated or database operation fails
 */
export async function sendParentalConsentEmail(studentId, parentEmail) {
  // Verify caller is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Authorization: users can only request consent for themselves
  if (user.id !== studentId) {
    throw new Error('Unauthorized: Cannot request consent for another user');
  }

  // Generate secure token
  const token = crypto.randomUUID();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Use the database service function to store token and log request
  const { data, error } = await supabase.rpc('request_parental_consent', {
    p_student_id: studentId,
    p_parent_email: parentEmail,
    p_token_hash: tokenHash,
    p_expires_hours: 168 // 7 days in hours
  });

  if (error) throw error;

  // Build consent URL
  const consentUrl = `${window.location.origin}/consent/verify?token=${token}&student=${studentId}`;

  // TODO: Send actual email via Supabase Edge Function or email service
  // For development, log the URL
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV] Consent verification URL:', consentUrl);
  }

  return { consentUrl, expiresAt };
}

/**
 * Verify parental consent token and activate account
 * Validates the token against stored hash and updates account status.
 *
 * Note: This function does NOT require authentication because parents
 * verify consent via email link without logging in. The token itself
 * serves as proof of authorization.
 *
 * @param {string} studentId - Student UUID
 * @param {string} token - Consent token from email link
 * @returns {Promise<{success: boolean}>}
 * @throws {Error} If token is invalid or expired
 */
export async function verifyParentalConsent(studentId, token) {
  const tokenHash = await hashToken(token);

  // Use the database service function to verify and update
  // Note: verify_parental_consent requires service role, so we call directly
  // For client-side, we need to query and update manually

  // Find valid token
  const { data: consentToken, error: findError } = await supabase
    .from('parental_consent_tokens')
    .select('id, student_id, expires_at')
    .eq('student_id', studentId)
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (findError || !consentToken) {
    throw new Error('Invalid or expired consent token');
  }

  // Mark token as used
  const { error: updateTokenError } = await supabase
    .from('parental_consent_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', consentToken.id);

  if (updateTokenError) throw updateTokenError;

  // Get parent email for logging
  const { data: student } = await supabase
    .from('students')
    .select('parent_email')
    .eq('id', studentId)
    .single();

  // Activate account
  const { error: activateError } = await supabase
    .from('students')
    .update({
      account_status: 'active',
      consent_verified_at: new Date().toISOString(),
      consent_revoked_at: null
    })
    .eq('id', studentId);

  if (activateError) throw activateError;

  // Log verification
  const { error: logError } = await supabase
    .from('parental_consent_log')
    .insert({
      student_id: studentId,
      parent_email: student?.parent_email || 'unknown',
      action: 'verified'
    });

  // Don't throw on log error - verification succeeded
  if (logError) {
    console.warn('Failed to log consent verification:', logError);
  }

  return { success: true };
}

/**
 * Resend consent email (invalidates previous tokens)
 * Marks all existing tokens as used before creating a new one.
 *
 * @param {string} studentId - Student UUID
 * @returns {Promise<{consentUrl: string, expiresAt: Date}>}
 * @throws {Error} If student not found or no parent email
 */
export async function resendConsentEmail(studentId) {
  // Verify caller is authenticated and authorized
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (user.id !== studentId) {
    throw new Error('Unauthorized: Cannot resend consent for another user');
  }

  // Get student's parent email
  const { data: student, error } = await supabase
    .from('students')
    .select('parent_email')
    .eq('id', studentId)
    .single();

  if (error || !student?.parent_email) {
    throw new Error('Student not found or no parent email on file');
  }

  // Mark all existing tokens as expired (used_at = now)
  await supabase
    .from('parental_consent_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('student_id', studentId)
    .is('used_at', null);

  // Send new consent email
  return sendParentalConsentEmail(studentId, student.parent_email);
}

/**
 * Revoke parental consent (triggers account suspension and deletion scheduling)
 * This is typically called when a parent wishes to revoke consent.
 *
 * @param {string} studentId - Student UUID
 * @returns {Promise<{success: boolean}>}
 * @throws {Error} If not authenticated
 */
export async function revokeConsent(studentId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get student info for logging
  const { data: student } = await supabase
    .from('students')
    .select('parent_email')
    .eq('id', studentId)
    .single();

  // Calculate 30-day deletion schedule
  const deletionScheduled = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Update account status to suspended_deletion
  const { error } = await supabase
    .from('students')
    .update({
      consent_revoked_at: new Date().toISOString(),
      account_status: 'suspended_deletion',
      deletion_requested_at: new Date().toISOString(),
      deletion_scheduled_at: deletionScheduled.toISOString()
    })
    .eq('id', studentId);

  if (error) throw error;

  // Log revocation
  const { error: logError } = await supabase
    .from('parental_consent_log')
    .insert({
      student_id: studentId,
      parent_email: student?.parent_email || 'unknown',
      action: 'revoked'
    });

  if (logError) {
    console.warn('Failed to log consent revocation:', logError);
  }

  return { success: true };
}

/**
 * Get consent status for a student
 * Returns current consent state and requirements.
 *
 * @param {string} studentId - Student UUID
 * @returns {Promise<{isUnder13: boolean, needsConsent: boolean, consentVerified: boolean, parentEmail: string|null, accountStatus: string}>}
 * @throws {Error} If student not found
 */
export async function getConsentStatus(studentId) {
  const { data, error } = await supabase
    .from('students')
    .select('account_status, consent_verified_at, parent_email, is_under_13')
    .eq('id', studentId)
    .single();

  if (error) throw error;

  return {
    isUnder13: data.is_under_13 || false,
    needsConsent: data.is_under_13 && !data.consent_verified_at,
    consentVerified: !!data.consent_verified_at,
    parentEmail: data.parent_email,
    accountStatus: data.account_status || 'active'
  };
}

/**
 * Check if a pending consent request exists and is not expired
 * Useful for showing "resend" vs "send new" in UI.
 *
 * @param {string} studentId - Student UUID
 * @returns {Promise<{hasPending: boolean, expiresAt: string|null}>}
 */
export async function getPendingConsentRequest(studentId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (user.id !== studentId) {
    throw new Error('Unauthorized: Cannot check consent for another user');
  }

  const { data, error } = await supabase
    .from('parental_consent_tokens')
    .select('expires_at')
    .eq('student_id', studentId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return {
    hasPending: !!data,
    expiresAt: data?.expires_at || null
  };
}
