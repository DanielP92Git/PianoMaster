/**
 * ComingSoon Component
 *
 * Shared placeholder page for games not yet implemented.
 * Reusable for all new exercise types and any future games (D-06).
 * Reads gameName from location.state, navigates back to /trail on button click.
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hourglass } from 'lucide-react';

const ComingSoon = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation(['trail']);
  const gameName = location.state?.gameName || 'Game';

  const handleBack = () => {
    navigate('/trail');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex max-w-[400px] flex-col items-center gap-6 rounded-2xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur-md">
        <Hourglass size={48} className="text-cyan-300" />
        <h1 className="text-2xl font-bold text-white">{gameName}</h1>
        <p className="text-base text-white/70">
          This game is coming soon! Check back after the next update.
        </p>
        <button
          onClick={handleBack}
          className="min-h-[44px] rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 active:scale-95"
        >
          {t('backToTrail', { defaultValue: 'Back to Trail' })}
        </button>
      </div>
    </div>
  );
};

export default ComingSoon;
