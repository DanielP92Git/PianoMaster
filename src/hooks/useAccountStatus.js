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
        // Non-students (teachers) and placeholder students may not have these columns.
        // Default to active — this hook is only critical for suspension/deletion gating.
        setStatus('active');
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
