import { useEffect, useState } from 'react';
import supabase from '../services/supabase';

/**
 * Hook to check student account status for route guarding
 * Returns account status and suspension details for UI rendering
 *
 * @param {string} userId - Student UUID (from auth)
 * @returns {{ status, loading, isSuspended, suspensionReason, parentEmail, refetch }}
 */
export function useAccountStatus(userId) {
  const [status, setStatus] = useState(null);
  const [parentEmail, setParentEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('account_status, parent_email, deletion_scheduled_at')
        .eq('id', userId)
        .single();

      if (error) {
        // User might be a teacher, not a student
        // PGRST116 = "no rows returned" - user doesn't exist in students table
        if (error.code === 'PGRST116') {
          setStatus('active'); // Teachers don't have account_status
        } else {
          console.error('Error fetching account status:', error);
          setStatus('active'); // Default to active on error
        }
      } else {
        setStatus(data?.account_status || 'active');
        setParentEmail(data?.parent_email);
      }
    } catch (err) {
      console.error('Error in useAccountStatus:', err);
      setStatus('active');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const isSuspended = status === 'suspended_consent' || status === 'suspended_deletion';

  const suspensionReason = status === 'suspended_consent'
    ? 'consent'
    : status === 'suspended_deletion'
    ? 'deletion'
    : null;

  return {
    status,
    loading,
    isSuspended,
    suspensionReason,
    parentEmail,
    refetch: fetchStatus
  };
}

export default useAccountStatus;
