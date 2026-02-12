import React, { useEffect, useState } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from './Modal';
import { Clock } from 'lucide-react';

/**
 * Modal that warns users of impending logout due to inactivity.
 * Shows countdown timer and "Stay Logged In" button.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onStayLoggedIn - Callback to reset inactivity timer
 * @param {Function} props.getRemainingTime - Function returning ms until logout
 */
export default function InactivityWarningModal({ isOpen, onStayLoggedIn, getRemainingTime }) {
  // State for countdown display
  const [remainingTime, setRemainingTime] = useState(getRemainingTime?.() || 0);

  // Update countdown every second while modal is open
  useEffect(() => {
    if (!isOpen || !getRemainingTime) return;

    // Update immediately when opened
    setRemainingTime(getRemainingTime());

    const interval = setInterval(() => {
      setRemainingTime(getRemainingTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, getRemainingTime]);

  // Format time as M:SS
  const formatTime = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      showCloseButton={false}
      size="default"
      variant="primary"
    >
      <ModalHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-kidsPrimary-100 rounded-full">
            <Clock className="w-8 h-8 text-kidsPrimary-600" aria-hidden="true" />
          </div>
        </div>
        <ModalTitle className="text-2xl text-center text-kidsPrimary-900">
          Still there?
        </ModalTitle>
      </ModalHeader>

      <ModalContent className="text-center">
        <p className="text-lg text-kidsPrimary-800 mb-2">
          You'll be logged out in{' '}
          <span className="font-bold text-kidsPrimary-600 text-2xl tabular-nums">
            {formatTime(remainingTime)}
          </span>{' '}
          due to inactivity.
        </p>
        <p className="text-kidsPrimary-700">
          Click below to stay logged in and keep practicing!
        </p>
      </ModalContent>

      <ModalFooter className="justify-center">
        <button
          onClick={onStayLoggedIn}
          className="
            w-full px-8 py-4 min-h-touch
            bg-kidsPrimary-500 hover:bg-kidsPrimary-600
            text-white font-bold text-lg
            rounded-kids-lg shadow-lg
            transform transition-all duration-200
            hover:scale-105 hover:shadow-xl
            focus:outline-none focus:ring-4 focus:ring-kidsPrimary-300
            active:scale-95
          "
          aria-label="Stay logged in and reset inactivity timer"
        >
          Stay Logged In
        </button>
      </ModalFooter>
    </Modal>
  );
}
