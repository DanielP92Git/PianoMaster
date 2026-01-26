/**
 * Utility to reset trail progress for testing
 *
 * Run from browser console while logged in:
 * 1. Open your app in the browser
 * 2. Log in with your test account
 * 3. Open DevTools (F12) -> Console
 * 4. Copy and paste this entire file's content
 * 5. Run: resetTrailProgress()
 */

import supabase from '../services/supabase';

export async function resetTrailProgress() {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Not logged in. Please log in first.');
      return { success: false, error: 'Not logged in' };
    }

    console.log(`Resetting trail progress for user: ${user.email} (${user.id})`);

    // Delete all skill progress records
    const { error: progressError } = await supabase
      .from('student_skill_progress')
      .delete()
      .eq('student_id', user.id);

    if (progressError) {
      console.error('Error deleting skill progress:', progressError);
      return { success: false, error: progressError };
    }

    // Reset XP on students table (optional)
    const { error: xpError } = await supabase
      .from('students')
      .update({
        total_xp: 0,
        current_level: 1
      })
      .eq('id', user.id);

    if (xpError) {
      console.warn('Could not reset XP (table may not exist or column names differ):', xpError);
    }

    // Delete daily goals for this user
    const { error: goalsError } = await supabase
      .from('student_daily_goals')
      .delete()
      .eq('student_id', user.id);

    if (goalsError) {
      console.warn('Could not delete daily goals:', goalsError);
    }

    console.log('Trail progress reset successfully!');
    console.log('Refresh the page to see the changes.');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
}

// Also export a version that can be called from console
if (typeof window !== 'undefined') {
  window.resetTrailProgress = resetTrailProgress;
}

export default resetTrailProgress;
