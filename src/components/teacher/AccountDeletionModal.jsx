import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { AlertTriangle, Calendar, Info, Shield } from 'lucide-react';
import {
  requestAccountDeletion,
  getAccountDeletionStatus,
  cancelDeletionRequest,
} from '../../services/accountDeletionService';
import { getExportedDataTypes } from '../../services/dataExportService';
import { toast } from 'react-hot-toast';

const AccountDeletionModal = ({ isOpen, onClose, student, onDeletionRequested }) => {
  const [deletionStatus, setDeletionStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [confirmationName, setConfirmationName] = useState('');

  useEffect(() => {
    if (isOpen && student?.student_id) {
      loadDeletionStatus();
      setConfirmationName(''); // Reset confirmation input
    }
  }, [isOpen, student]);

  const loadDeletionStatus = async () => {
    setIsLoadingStatus(true);
    setError(null);
    try {
      const status = await getAccountDeletionStatus(student.student_id);
      setDeletionStatus(status);
    } catch (err) {
      console.error('Error loading deletion status:', err);
      setError('Failed to load deletion status. Please try again.');
      toast.error('Failed to load account status');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!student?.student_id || !confirmationName.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await requestAccountDeletion(student.student_id, confirmationName.trim());
      toast.success(result.message);

      // Notify parent component that deletion was requested
      if (onDeletionRequested) {
        onDeletionRequested();
      }

      onClose();
    } catch (err) {
      console.error('Error requesting deletion:', err);
      setError(err.message || 'Failed to request account deletion');
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!student?.student_id) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await cancelDeletionRequest(student.student_id);
      toast.success(result.message);

      // Reload status to show updated state
      await loadDeletionStatus();

      // Notify parent to refresh student list
      if (onDeletionRequested) {
        onDeletionRequested();
      }
    } catch (err) {
      console.error('Error canceling deletion:', err);
      setError(err.message || 'Failed to cancel deletion');
      toast.error(err.message || 'Failed to cancel deletion');
    } finally {
      setIsProcessing(false);
    }
  };

  const isConfirmationValid = () => {
    if (!student?.student_name || !confirmationName.trim()) return false;
    return confirmationName.trim().toLowerCase() === student.student_name.toLowerCase();
  };

  if (!student) return null;

  // Mode B: Pending Deletion
  if (deletionStatus?.isPendingDeletion) {
    const scheduledDate = deletionStatus.scheduledDeletionAt
      ? new Date(deletionStatus.scheduledDeletionAt)
      : null;
    const formattedDate = scheduledDate
      ? scheduledDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Unknown';

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Deletion Pending"
        size="default"
        className="bg-gray-900 text-white border-gray-700"
      >
        <div className="space-y-6">
          {/* Warning Banner */}
          <div className="rounded-lg bg-orange-900/20 border border-orange-700 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-300">Account Deletion Scheduled</h3>
                <p className="mt-1 text-sm text-orange-400/90">
                  This account is scheduled for permanent deletion.
                </p>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="rounded-lg bg-gray-800 p-4 border border-gray-700">
            <p className="text-sm text-gray-400">Student:</p>
            <p className="text-lg font-semibold text-white">{student.student_name}</p>
          </div>

          {/* Deletion Schedule */}
          <div className="rounded-lg bg-gray-800 border border-gray-700 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-400">Scheduled Deletion Date</p>
                <p className="text-lg font-semibold text-white">{formattedDate}</p>
              </div>
            </div>
            {deletionStatus.daysRemaining !== null && (
              <div className="pt-3 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Days Remaining: {' '}
                  <span className="font-semibold text-orange-400">
                    {deletionStatus.daysRemaining} {deletionStatus.daysRemaining === 1 ? 'day' : 'days'}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Grace Period Info */}
          <div className="rounded-lg bg-blue-900/20 border border-blue-700 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300 space-y-1">
                <p className="font-semibold">30-Day Grace Period</p>
                <p className="text-blue-400/90">
                  You can cancel this deletion request at any time during the grace period.
                  After the scheduled date, all data will be permanently deleted and cannot be recovered.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/20 border border-red-700 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isProcessing}
              className="text-gray-400 hover:bg-gray-800"
            >
              Close
            </Button>
            {deletionStatus.canCancel && (
              <Button
                variant="primary"
                onClick={handleCancelDeletion}
                disabled={isProcessing}
                loading={isProcessing}
                icon={Shield}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400"
              >
                Cancel Deletion
              </Button>
            )}
          </div>
        </div>
      </Modal>
    );
  }

  // Mode A: Not Pending Deletion (Request Deletion Flow)
  const dataTypes = getExportedDataTypes();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Student Account"
      size="large"
      className="bg-gray-900 text-white border-gray-700"
    >
      <div className="space-y-6">
        {/* Critical Warning */}
        <div className="rounded-lg bg-red-900/20 border-2 border-red-700 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-7 w-7 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-300">Permanent Account Deletion</h3>
              <p className="mt-1 text-sm text-red-400/90">
                This action will permanently delete all student data after a 30-day grace period.
                This cannot be undone after the grace period expires.
              </p>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="rounded-lg bg-gray-800 p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Student to be deleted:</p>
          <p className="text-lg font-semibold text-white">{student.student_name}</p>
        </div>

        {isLoadingStatus && (
          <div className="text-center py-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-400">Checking account status...</p>
          </div>
        )}

        {!isLoadingStatus && (
          <>
            {/* What Will Be Deleted */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Data to be permanently deleted
              </h3>
              <div className="rounded-lg bg-gray-800 border border-gray-700 p-4">
                <ul className="space-y-2">
                  {dataTypes.map((type) => (
                    <li key={type.table} className="flex items-start gap-2 text-sm">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span className="text-gray-300">{type.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Grace Period Info */}
            <div className="rounded-lg bg-blue-900/20 border border-blue-700 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300 space-y-2">
                  <p className="font-semibold">30-Day Grace Period</p>
                  <p className="text-blue-400/90">
                    After requesting deletion, you will have 30 days to change your mind.
                    During this period, you can cancel the deletion request and restore the account.
                    After 30 days, all data will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>

            {/* Name Confirmation */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Confirm Deletion
              </h3>
              <div className="rounded-lg bg-gray-800 border border-gray-700 p-4 space-y-3">
                <p className="text-sm text-gray-400">
                  To confirm deletion, please type the student's name exactly as shown below:
                </p>
                <p className="text-center text-lg font-bold text-white bg-gray-750 px-4 py-2 rounded border border-gray-600">
                  {student.student_name}
                </p>
                <Input
                  type="text"
                  placeholder="Type student name to confirm"
                  value={confirmationName}
                  onChange={(e) => setConfirmationName(e.target.value)}
                  variant="solid"
                  className="w-full bg-gray-750 border-gray-600 text-white"
                  error={confirmationName && !isConfirmationValid() ? 'Name does not match' : null}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-900/20 border border-red-700 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isProcessing}
                className="text-gray-400 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                variant="error"
                onClick={handleRequestDeletion}
                disabled={isProcessing || !isConfirmationValid()}
                loading={isProcessing}
                icon={AlertTriangle}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
              >
                Delete Account
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default AccountDeletionModal;
