/**
 * DailyChallengeCard Component
 *
 * Displays today's daily challenge with play CTA or completion status
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, CheckCircle, Trophy } from 'lucide-react';
import { useUser } from '../../features/authentication/useUser';
import { getTodaysChallenge } from '../../services/dailyChallengeService';

const DailyChallengeCard = () => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.dir() === 'rtl';
  const navigate = useNavigate();
  const { user } = useUser();
  const dateString = new Date().toISOString().split('T')[0];

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['daily-challenge', user?.id, dateString],
    queryFn: () => getTodaysChallenge(user.id),
    enabled: !!user?.id,
  });

  const isCompleted = challenge?.completed;

  const getChallengeIcon = (type) => {
    switch (type) {
      case 'speed_round':
        return <Zap className="h-5 w-5 text-amber-400" />;
      case 'review_challenge':
        return <Trophy className="h-5 w-5 text-indigo-400" />;
      default:
        return <Zap className="h-5 w-5 text-amber-400" />;
    }
  };

  const getChallengeName = (type) => {
    switch (type) {
      case 'speed_round':
        return t('dashboard.dailyChallenge.speedRound', 'Speed Round');
      case 'review_challenge':
        return t('dashboard.dailyChallenge.reviewChallenge', 'Review Challenge');
      default:
        return t('dashboard.dailyChallenge.challenge', 'Challenge');
    }
  };

  const getChallengeDescription = (type) => {
    switch (type) {
      case 'speed_round':
        return t('dashboard.dailyChallenge.speedRoundDesc', {
          defaultValue:
            'Answer {{count}} questions in {{time}} seconds!',
          count: challenge.challenge_config?.questionCount ?? 20,
          time: challenge.challenge_config?.timeLimit ?? 60,
        });
      case 'review_challenge':
        return t(
          'dashboard.dailyChallenge.reviewChallengeDesc',
          'Review notes you have learned so far.'
        );
      default:
        return t(
          'dashboard.dailyChallenge.defaultDesc',
          'Complete today\'s challenge to earn bonus XP!'
        );
    }
  };

  const handlePlayChallenge = () => {
    navigate('/notes-master-mode/notes-recognition-game', {
      state: {
        challengeMode: true,
        challengeConfig: challenge.challenge_config,
        challengeId: challenge.id,
        xpReward: challenge.xp_reward,
      },
    });
  };

  // Loading / skeleton state
  if (isLoading || !challenge) {
    return (
      <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md">
        <div className="mb-3 h-5 w-28 animate-pulse rounded bg-white/10" />
        <div className="h-12 animate-pulse rounded-lg bg-white/5" />
      </div>
    );
  }

  // Completed state
  if (isCompleted) {
    return (
      <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md">
        {/* Header */}
        <div
          className="mb-3 flex items-center gap-2"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <Zap className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">
            {t('dashboard.dailyChallenge.title', 'Daily Challenge')}
          </h3>
        </div>

        {/* Completed content */}
        <div className="rounded-lg border border-green-400/30 bg-green-500/10 p-3">
          <div
            className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <CheckCircle className="h-5 w-5 shrink-0 text-green-400" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-green-300">
                {t(
                  'dashboard.dailyChallenge.complete',
                  'Challenge Complete!'
                )}
              </div>
              {challenge.xp_reward && (
                <div className="mt-0.5 text-xs text-green-300/70">
                  {t('dashboard.dailyChallenge.earnedXP', {
                    defaultValue: '+{{xp}} XP earned',
                    xp: challenge.xp_reward,
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Come back tomorrow message */}
          <div
            className={`mt-2 flex items-center gap-1.5 text-xs text-white/60 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400/70" />
            <span>
              {t('dashboard.dailyChallenge.comeBackTomorrow',
                'New challenge tomorrow!'
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Active challenge state
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md">
      {/* Header */}
      <div
        className="mb-3 flex items-center gap-2"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Zap className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white">
          {t('dashboard.dailyChallenge.title', 'Daily Challenge')}
        </h3>
      </div>

      {/* Challenge content */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <div
          className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          {/* Challenge type icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-white/5">
            {getChallengeIcon(challenge.challenge_type)}
          </div>

          {/* Challenge info */}
          <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {getChallengeName(challenge.challenge_type)}
              </span>
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                {t('dashboard.dailyChallenge.xpReward', {
                  defaultValue: '+{{xp}} XP',
                  xp: challenge.xp_reward,
                })}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/60">
              {getChallengeDescription(challenge.challenge_type)}
            </p>
          </div>
        </div>

        {/* Play button */}
        <button
          onClick={handlePlayChallenge}
          className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          {t('dashboard.dailyChallenge.play', 'Play Challenge')}
        </button>
      </div>
    </div>
  );
};

export default DailyChallengeCard;
