/**
 * Account Deletion Service
 *
 * COPPA compliance: Right to deletion with 30-day grace period.
 * Implements soft delete pattern to allow recovery during grace period.
 *
 * Flow:
 * 1. User requests deletion (requires name confirmation)
 * 2. Account status changes to 'suspended_deletion'
 * 3. 30-day grace period begins
 * 4. User can cancel during grace period
 * 5. After grace period, scheduled job performs hard delete
 *
 * NOTE: Hard deletion is handled by a scheduled Supabase Edge Function
 * that runs daily and deletes accounts where:
 * - account_status = 'suspended_deletion'
 * - deletion_scheduled_at < NOW()
 *
 * The Edge Function performs:
 * 1. Delete from students table (CASCADE handles related data)
 * 2. Delete from auth.users using admin API
 */

import supabase from './supabase';
import { verifyStudentDataAccess } from './authorizationUtils';

/** Grace period in days before permanent deletion */
const GRACE_PERIOD_DAYS = 30;

/**
 * Request account deletion with name confirmation.
 * Starts the soft delete process with 30-day grace period.
 *
 * @param {string} studentId - Student UUID
 * @param {string} confirmationName - Must match student's display name
 * @returns {Promise<{success: boolean, scheduledDeletion: Date, message: string}>}
 * @throws {Error} If name doesn't match or account already deleted
 */
export async function requestAccountDeletion(studentId, confirmationName) {
  // Verify access (student themselves or connected teacher)
  await verifyStudentDataAccess(studentId);

  // Get student's name for confirmation
  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('first_name, last_name, username, account_status')
    .eq('id', studentId)
    .single();

  if (fetchError || !student) {
    throw new Error('Student not found');
  }

  // Check if already deleted or pending
  if (student.account_status === 'deleted') {
    throw new Error('Account has already been deleted');
  }
  if (student.account_status === 'suspended_deletion') {
    throw new Error('Account is already pending deletion. Use cancelDeletionRequest to restore.');
  }

  // Build expected name from available fields
  const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
  const expectedName = fullName || student.username || '';

  if (!expectedName) {
    throw new Error('Account has no name on file. Please update your profile first.');
  }

  // Verify confirmation name matches (case-insensitive)
  const normalizedInput = confirmationName.toLowerCase().trim();
  const normalizedExpected = expectedName.toLowerCase();

  if (normalizedInput !== normalizedExpected) {
    throw new Error(`Account name does not match. Please type "${expectedName}" exactly.`);
  }

  // Calculate deletion date (30 days from now)
  const deletionDate = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  // Soft delete - update status and schedule deletion
  const { error: updateError } = await supabase
    .from('students')
    .update({
      account_status: 'suspended_deletion',
      deletion_requested_at: new Date().toISOString(),
      deletion_scheduled_at: deletionDate.toISOString()
    })
    .eq('id', studentId);

  if (updateError) throw updateError;

  // Sign out the user to prevent further access
  await supabase.auth.signOut();

  return {
    success: true,
    scheduledDeletion: deletionDate,
    message: `Account scheduled for permanent deletion on ${deletionDate.toLocaleDateString()}. You can cancel within ${GRACE_PERIOD_DAYS} days.`
  };
}

/**
 * Cancel a pending deletion request during grace period.
 * Restores account to active status.
 *
 * @param {string} studentId - Student UUID
 * @returns {Promise<{success: boolean, message: string}>}
 * @throws {Error} If no pending deletion or grace period expired
 */
export async function cancelDeletionRequest(studentId) {
  // Verify access
  await verifyStudentDataAccess(studentId);

  // Check current status
  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('account_status, deletion_scheduled_at')
    .eq('id', studentId)
    .single();

  if (fetchError || !student) {
    throw new Error('Student not found');
  }

  if (student.account_status !== 'suspended_deletion') {
    throw new Error('No pending deletion request to cancel');
  }

  // Check if still in grace period
  const scheduledDate = new Date(student.deletion_scheduled_at);
  if (scheduledDate < new Date()) {
    throw new Error('Grace period has expired. Account cannot be recovered.');
  }

  // Restore account
  const { error: updateError } = await supabase
    .from('students')
    .update({
      account_status: 'active',
      deletion_requested_at: null,
      deletion_scheduled_at: null
    })
    .eq('id', studentId);

  if (updateError) throw updateError;

  return {
    success: true,
    message: 'Deletion cancelled. Your account has been restored to active status.'
  };
}

/**
 * Get deletion status for an account.
 * Returns whether deletion is pending and time remaining.
 *
 * @param {string} studentId - Student UUID
 * @returns {Promise<{isPendingDeletion: boolean, deletionRequestedAt: string|null, scheduledDeletionAt: string|null, daysRemaining: number|null, canCancel: boolean}>}
 */
export async function getAccountDeletionStatus(studentId) {
  const { data, error } = await supabase
    .from('students')
    .select('account_status, deletion_requested_at, deletion_scheduled_at')
    .eq('id', studentId)
    .single();

  if (error) throw error;

  const isPendingDeletion = data.account_status === 'suspended_deletion';

  let daysRemaining = null;
  if (isPendingDeletion && data.deletion_scheduled_at) {
    const scheduledDate = new Date(data.deletion_scheduled_at);
    const now = new Date();
    const msRemaining = scheduledDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
  }

  return {
    isPendingDeletion,
    deletionRequestedAt: data.deletion_requested_at,
    scheduledDeletionAt: data.deletion_scheduled_at,
    daysRemaining,
    canCancel: isPendingDeletion && daysRemaining !== null && daysRemaining > 0
  };
}

/**
 * Get accounts scheduled for deletion (admin function).
 * Returns all accounts past their grace period for cleanup.
 *
 * NOTE: This should only be called from Edge Function with service role.
 * Client-side calls will be limited by RLS.
 *
 * @returns {Promise<Array<{id: string, deletion_scheduled_at: string}>>}
 */
export async function getAccountsReadyForDeletion() {
  // This function is for documentation/reference only
  // Actual implementation should be in Edge Function with service role
  if (process.env.NODE_ENV !== 'development') {
    console.warn('getAccountsReadyForDeletion should only be called from server-side');
    return [];
  }

  const { data, error } = await supabase
    .from('students')
    .select('id, deletion_scheduled_at')
    .eq('account_status', 'suspended_deletion')
    .lt('deletion_scheduled_at', new Date().toISOString());

  if (error) {
    console.error('Error fetching accounts for deletion:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if an account can still be recovered.
 * Useful for login flow to show recovery option.
 *
 * @param {string} studentId - Student UUID
 * @returns {Promise<{canRecover: boolean, daysRemaining: number|null}>}
 */
export async function checkAccountRecoverable(studentId) {
  try {
    const status = await getAccountDeletionStatus(studentId);
    return {
      canRecover: status.canCancel,
      daysRemaining: status.daysRemaining
    };
  } catch {
    return { canRecover: false, daysRemaining: null };
  }
}
