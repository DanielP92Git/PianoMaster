/**
 * TrailMapPage Component
 *
 * Page wrapper for the Trail Map with clean, minimal background
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { useUser } from '../features/authentication/useUser';
import { getStudentXP } from '../utils/xpSystem';
import TrailMap from '../components/trail/TrailMap';
import { useAccessibility } from '../contexts/AccessibilityContext';
import '../styles/trail-effects.css';

const TrailMapPage = () => {
  const { t, i18n } = useTranslation(['common', 'trail']);
  const isRTL = i18n.dir() === 'rtl';
  const { user } = useUser();
  const { reducedMotion } = useAccessibility();

  // Fetch student XP data for header display
  const { data: xpData } = useQuery({
    queryKey: ['student-xp', user?.id],
    queryFn: () => getStudentXP(user.id),
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });

  return (
    <div className={`trail-page trail-forest-bg fixed inset-0 overflow-y-auto font-quicksand${reducedMotion ? ' reduced-motion' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Enchanted starfield */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {[
          { left: '5%', top: '8%', size: 2, duration: '3s', delay: '0s' },
          { left: '15%', top: '22%', size: 1, duration: '4s', delay: '1.2s' },
          { left: '25%', top: '5%', size: 3, duration: '3.5s', delay: '0.5s' },
          { left: '35%', top: '35%', size: 1, duration: '5s', delay: '2s' },
          { left: '45%', top: '12%', size: 2, duration: '3.8s', delay: '0.8s' },
          { left: '55%', top: '28%', size: 1, duration: '4.2s', delay: '1.5s' },
          { left: '65%', top: '7%', size: 2, duration: '3.2s', delay: '0.3s' },
          { left: '75%', top: '18%', size: 3, duration: '4.5s', delay: '1.8s' },
          { left: '85%', top: '32%', size: 1, duration: '3.7s', delay: '2.5s' },
          { left: '92%', top: '10%', size: 2, duration: '4s', delay: '0.7s' },
          { left: '10%', top: '45%', size: 1, duration: '5.2s', delay: '1s' },
          { left: '30%', top: '55%', size: 2, duration: '3.3s', delay: '2.2s' },
          { left: '50%', top: '42%', size: 1, duration: '4.8s', delay: '0.4s' },
          { left: '70%', top: '60%', size: 3, duration: '3.6s', delay: '1.7s' },
          { left: '88%', top: '48%', size: 1, duration: '4.3s', delay: '2.8s' },
          { left: '20%', top: '72%', size: 2, duration: '3.9s', delay: '0.6s' },
          { left: '40%', top: '68%', size: 1, duration: '5s', delay: '1.3s' },
          { left: '60%', top: '75%', size: 2, duration: '3.4s', delay: '2.1s' },
          { left: '80%', top: '65%', size: 1, duration: '4.6s', delay: '0.9s' },
          { left: '95%', top: '78%', size: 2, duration: '3.1s', delay: '1.6s' },
        ].map((star, i) => (
          <div
            key={`star-${i}`}
            className="trail-star"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              '--star-duration': star.duration,
              '--star-delay': star.delay,
            }}
          />
        ))}
      </div>

      {/* Ambient glow orbs (bottom-of-screen forest glow, matching Stitch reference) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="trail-glow-orb trail-glow-orb--purple"
          style={{ bottom: '40px', left: '16px', width: '48px', height: '48px', opacity: 0.6 }}
        />
        <div
          className="trail-glow-orb trail-glow-orb--blue"
          style={{ bottom: '80px', right: '40px', width: '64px', height: '64px', opacity: 0.5 }}
        />
        <div
          className="trail-glow-orb trail-glow-orb--green"
          style={{ bottom: '20px', left: '40%', width: '40px', height: '40px', opacity: 0.4 }}
        />
      </div>

      {/* Navigation bar */}
      <div className="relative z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
        <div className={`mx-auto max-w-6xl space-y-2.5 p-4 ${isRTL ? 'text-right' : ''}`}>
          {/* Row 1: Navigation + Title + Free Practice */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <span className="text-xl">{isRTL ? '\u2192' : '\u2190'}</span>
              <span className="font-medium text-sm">{t('common.dashboard', { defaultValue: 'Dashboard' })}</span>
            </Link>
            <h1 className="text-xl font-bold text-white font-quicksand">
              {t('pageTitle', { ns: 'trail' })}
            </h1>
            <Link
              to="/practice-modes"
              className="text-sm text-white/70 hover:text-white border border-white/20 rounded-lg px-2.5 py-1 hover:bg-white/10 transition-colors"
            >
              {t('freePracticeLink', { ns: 'trail' })}
            </Link>
          </div>

          {/* Row 2: Level badge + XP progress bar */}
          <div className="flex items-center gap-3">
            {/* Shield badge */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Shield className="h-9 w-9 text-yellow-400" fill="rgba(250, 204, 21, 0.15)" strokeWidth={1.5} />
                {/* Level number centered inside shield */}
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-yellow-400 pt-0.5">
                  {xpData?.levelData?.level || 1}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-tight">
                  {xpData?.levelData?.title || 'Beginner'}
                </span>
                <span className="text-[10px] text-white/50 leading-tight">
                  {xpData?.progress?.xpInCurrentLevel || 0} / {xpData?.progress?.nextLevelXP
                    ? xpData.progress.nextLevelXP - (xpData.progress.currentLevel?.xpRequired || 0)
                    : 100} XP
                </span>
              </div>
            </div>

            {/* XP progress bar */}
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${xpData?.progress?.progressPercentage || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trail content */}
      <TrailMap />
    </div>
  );
};

export default TrailMapPage;
