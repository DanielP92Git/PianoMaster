import { useEffect, useState } from 'react';
import supabase from '../services/supabase';

/**
 * Hook to check student account status for route guarding
 * Returns account status and suspension details for UI rendering
 *
 * @param {string} userId - Student UUID (from auth)
 * @returns {{ status, loading, isSuspended, suspensionReason, parentEmail, refetch }}
 */
export function useAccountStatus(userId, { enabled = true } = {}) {
  const [status, setStatus] = useState(null);
  const [parentEmail, setParentEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    if (!userId || !enabled) {
      setStatus('active');
      setLoading(false);
      return;
    }

    try {
      // Query with wildcard — avoids 406 if COPPA columns haven't been migrated yet
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Non-students (teachers) or row not found — default to active
        setStatus('active');
      } else {
        setStatus(data?.account_status || 'active');
        setParentEmail(data?.parent_email || null);
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
