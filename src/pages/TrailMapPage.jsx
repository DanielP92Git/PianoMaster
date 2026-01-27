/**
 * TrailMapPage Component
 *
 * Page wrapper for the Trail Map with clean, minimal background
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TrailMap from '../components/trail/TrailMap';

const TrailMapPage = () => {
  const { t, i18n } = useTranslation(['common', 'trail']);
  const isRTL = i18n.dir() === 'rtl';

  return (
    <div className="fixed inset-0 overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Subtle accent stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute h-1 w-1 rounded-full bg-white/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation bar */}
      <div className="relative z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
        <div className={`mx-auto flex max-w-6xl items-center justify-between p-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link
            to="/"
            className={`flex items-center gap-2 text-white/70 transition-colors hover:text-white ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <span className="text-xl">&#8592;</span>
            <span className="font-medium">{t('common.dashboard', { defaultValue: 'Dashboard' })}</span>
          </Link>
          <h1 className="text-xl font-bold text-white">{t('pageTitle', { ns: 'trail' })}</h1>
          <Link
            to="/practice-modes"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            {t('freePracticeLink', { ns: 'trail' })}
          </Link>
        </div>
      </div>

      {/* Trail content */}
      <TrailMap />

      {/* CSS for animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default TrailMapPage;
