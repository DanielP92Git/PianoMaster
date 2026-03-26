/**
 * ParentPortalPage — /parent-portal
 *
 * Gate-first parent portal with 4 sections:
 *   1. Quick Stats — 2x2 grid of child progress cards
 *   2. Practice Heatmap — monthly calendar
 *   3. Subscription Management — existing cancel/resubscribe flow
 *   4. Parent Settings — notifications + weekend pass toggle
 *
 * Math gate (ParentGateMath) renders on every visit. Gate dismissal
 * reveals portal content with fadeIn animation.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Calendar,
  XCircle,
  RefreshCw,
  Loader2,
  Crown,
  AlertTriangle,
  Trash2,
  Scale,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import PracticeHeatmapCard from '../components/parent/PracticeHeatmapCard';
import QuickStatsGrid from '../components/parent/QuickStatsGrid';
import ParentGateMath from '../components/settings/ParentGateMath';
import NotificationPermissionCard from '../components/settings/NotificationPermissionCard';
import ToggleSetting from '../components/settings/ToggleSetting';
import TimePicker from '../components/settings/TimePicker';
import SettingsSection from '../components/settings/SettingsSection';
import AccountDeletionModal from '../components/teacher/AccountDeletionModal';
import { toast } from 'react-hot-toast';
import { useUser } from '../features/authentication/useUser';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useSettings } from '../contexts/SettingsContext';
import { fetchSubscriptionDetail } from '../services/subscriptionService';
import { getStudentXP } from '../utils/xpSystem';
import { getStudentProgress } from '../services/skillProgressService';
import { streakService } from '../services/streakService';
import supabase from '../services/supabase';
import BackButton from '../components/ui/BackButton';

/**
 * Format amount from cents to locale-aware currency string.
 * e.g. 2990, 'ILS', 'he-IL' → '₪29.90'
 */
function formatAmount(amountCents, currency, locale) {
  if (!amountCents || !currency) return null;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    return `${currency} ${(amountCents / 100).toFixed(2)}`;
  }
}

/**
 * Format a date string to a human-readable date using the user's locale.
 */
function formatDate(dateString, locale) {
  if (!dateString) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

/**
 * Status badge component — color-coded by subscription status.
 */
function StatusBadge({ status, t }) {
  const statusConfig = {
    active: { className: 'bg-green-400/20 border-green-400/30 text-green-300', labelKey: 'parentPortal.statusActive' },
    on_trial: { className: 'bg-blue-400/20 border-blue-400/30 text-blue-300', labelKey: 'parentPortal.statusOnTrial' },
    cancelled: { className: 'bg-amber-400/20 border-amber-400/30 text-amber-300', labelKey: 'parentPortal.statusCancelled' },
    past_due: { className: 'bg-red-400/20 border-red-400/30 text-red-300', labelKey: 'parentPortal.statusPastDue' },
    expired: { className: 'bg-gray-400/20 border-gray-400/30 text-gray-300', labelKey: 'parentPortal.statusExpired' },
  };
  const config = statusConfig[status] || statusConfig.expired;

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${config.className}`}>
      {t(config.labelKey)}
    </span>
  );
}

export default function ParentPortalPage() {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.dir() === 'rtl';
  const locale = i18n.language || 'en';
  const { user } = useUser();
  const { isLoading: subCtxLoading } = useSubscription();
  const { preferences, updatePreference, updateNotificationType } = useSettings();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Gate state — true means gate is visible, false means portal content is visible
  const [gateOpen, setGateOpen] = useState(true);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  // Optimistic state after cancel to avoid waiting for DB refresh
  const [optimisticCancel, setOptimisticCancel] = useState(null);

  // Subscription detail query (Section 3)
  const {
    data: detail,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ['subscription-detail', user?.id],
    queryFn: () => fetchSubscriptionDetail(user?.id),
    enabled: !!user?.id,
    staleTime: 0,
  });

  // Quick Stats queries — only fetch after gate is passed (D-06)
  const { data: xpData, isLoading: xpLoading } = useQuery({
    queryKey: ['student-xp', user?.id],
    queryFn: () => getStudentXP(user.id),
    enabled: !!user?.id && !gateOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['student-progress', user?.id],
    queryFn: () => getStudentProgress(user.id),
    enabled: !!user?.id && !gateOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: streakState, isLoading: streakLoading } = useQuery({
    queryKey: ['streak-state', user?.id],
    queryFn: () => streakService.getStreakState(),
    enabled: !!user?.id && !gateOpen,
    staleTime: 60 * 1000,
  });

  // Combined loading state for Quick Stats
  const statsLoading = xpLoading || progressLoading || streakLoading;

  // Apply optimistic cancel state on top of fetched detail
  const effectiveDetail = detail
    ? {
        ...detail,
        status: optimisticCancel?.cancelled ? 'cancelled' : detail.status,
        currentPeriodEnd: optimisticCancel?.endsAt ?? detail.currentPeriodEnd,
      }
    : null;

  const status = effectiveDetail?.status;
  const isCancellable = status === 'active' || status === 'on_trial';
  const isCancelled = status === 'cancelled';
  const endDate = effectiveDetail?.currentPeriodEnd;
  const formattedEndDate = formatDate(endDate, locale);
  const formattedAmount = formatAmount(effectiveDetail?.amountCents, effectiveDetail?.currency, locale);

  const billingLabel = effectiveDetail?.billingPeriod === 'yearly'
    ? t('parentPortal.yearly')
    : effectiveDetail?.billingPeriod === 'monthly'
      ? t('parentPortal.monthly')
      : effectiveDetail?.billingPeriod || '';

  /**
   * Call the cancel-subscription Edge Function.
   * JWT auth.uid() is used server-side — no body needed.
   */
  async function handleCancel() {
    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Unknown error');
      }
      const endsAt = data?.endsAt ?? endDate;
      const endsAtFormatted = formatDate(endsAt, locale);

      setOptimisticCancel({ cancelled: true, endsAt });
      setShowCancelDialog(false);
      toast.success(t('parentPortal.cancelSuccess', { date: endsAtFormatted }));

      // Invalidate both caches so SubscriptionContext and this page refresh
      queryClient.invalidateQueries({ queryKey: ['subscription-detail', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    } catch (err) {
      console.error('[ParentPortalPage] cancel-subscription error:', err);
      toast.error(t('parentPortal.cancelError'));
      setShowCancelDialog(false);
    } finally {
      setIsCancelling(false);
    }
  }

  /**
   * Toggle weekend pass — no individual gate needed (portal gate covers it).
   * Per D-13: weekend pass toggle works without its own ParentGateMath gate.
   */
  const handleWeekendPassToggle = async (newValue) => {
    try {
      await streakService.setWeekendPass(newValue);
      queryClient.invalidateQueries({ queryKey: ['streak-state', user?.id] });
    } catch {
      toast.error(t('common.saving'));
    }
  };

  // Account deletion — no individual parent gate needed (portal gate covers it)
  const studentDisplayName = user
    ? `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.user_metadata?.username || user.email || ''
    : '';

  const handleDeleteAccountClick = async () => {
    try {
      if (user?.id) {
        await supabase
          .from('push_subscriptions')
          .upsert(
            {
              student_id: user.id,
              parent_consent_granted: true,
              parent_consent_at: new Date().toISOString(),
              is_enabled: false,
            },
            { onConflict: 'student_id' }
          );
      }
      queryClient.invalidateQueries({ queryKey: ['push-subscription-status', user?.id] });
      setShowDeleteModal(true);
    } catch {
      toast.error(t('common.saving'));
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Math gate — renders on every visit, always first */}
      {gateOpen && (
        <ParentGateMath
          onConsent={() => setGateOpen(false)}
          onCancel={() => navigate(-1)}
          isRTL={isRTL}
        />
      )}

      {/* Portal content — shown only after gate is passed */}
      {!gateOpen && (
        <div className="animate-fadeIn motion-reduce:animate-none min-h-screen pb-8">
          <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 pb-16">
            {/* Back navigation — only on mobile (desktop has sidebar nav) */}
            <BackButton styling="mb-6 md:hidden" />

            <h1 className="mb-6 text-2xl font-bold text-white">
              {t('parentPortal.parentZoneTitle')}
            </h1>

            {/* Section 1: Quick Stats */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">
                {t('parentPortal.quickStatsHeading')}
              </h2>
              <QuickStatsGrid
                xpData={xpData}
                progressData={progressData}
                streakState={streakState}
                isLoading={statsLoading}
              />
            </section>

            {/* Section 2: Practice Heatmap */}
            <section className="mt-8">
              <PracticeHeatmapCard studentId={user?.id} />
            </section>

            {/* Section 3: Subscription Management */}
            <section className="mt-8">
              {detailLoading || subCtxLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-indigo-400" />
                </div>
              ) : (
                <>
                  {/* No subscription state */}
                  {!effectiveDetail && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 text-center">
                      <CreditCard size={40} className="mx-auto mb-3 text-white/40" />
                      <p className="mb-1 font-semibold text-white">{t('parentPortal.noSubscriptionHeading')}</p>
                      <p className="mb-4 text-white/70 text-sm">{t('parentPortal.noSubscriptionBody')}</p>
                      <button
                        onClick={() => navigate('/subscribe')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-6 py-3 text-sm font-bold text-amber-900 hover:from-amber-300 hover:to-yellow-300 transition-all duration-200"
                      >
                        {t('parentPortal.unlockAccess')}
                      </button>
                    </div>
                  )}

                  {/* Active/cancelled subscription card */}
                  {effectiveDetail && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 space-y-5">
                      {/* Header */}
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/20 border border-amber-400/30">
                          <Crown size={20} className="text-amber-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white">
                            {effectiveDetail.planName || t('parentPortal.premiumTitle')}
                          </h2>
                          <StatusBadge status={status} t={t} />
                        </div>
                      </div>

                      {/* Plan details grid */}
                      <div className="rounded-xl bg-white/5 border border-white/10 divide-y divide-white/10">
                        {/* Billing period */}
                        {billingLabel && (
                          <div className={`flex items-center justify-between px-4 py-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="text-sm text-white/60">{t('parentPortal.plan')}</span>
                            <span className="text-sm font-medium text-white">{billingLabel}</span>
                          </div>
                        )}

                        {/* Price */}
                        {formattedAmount && (
                          <div className={`flex items-center justify-between px-4 py-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="flex items-center gap-1.5 text-sm text-white/60">
                              <CreditCard size={14} />
                              {billingLabel}
                            </span>
                            <span className="text-sm font-bold text-indigo-300">{formattedAmount}</span>
                          </div>
                        )}

                        {/* Next renewal or access until */}
                        {endDate && (
                          <div className={`flex items-center justify-between px-4 py-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="flex items-center gap-1.5 text-sm text-white/60">
                              <Calendar size={14} />
                              {isCancelled ? t('parentPortal.accessUntil') : t('parentPortal.nextRenewal')}
                            </span>
                            <span className={`text-sm font-medium ${isCancelled ? 'text-amber-300' : 'text-white'}`}>
                              {formattedEndDate}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Cancelled: access end info + re-subscribe */}
                      {isCancelled && (
                        <div className="rounded-xl bg-amber-400/10 border border-amber-400/30 p-4">
                          <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <XCircle size={20} className="mt-0.5 flex-shrink-0 text-amber-400" />
                            <div>
                              <p className="text-sm font-medium text-amber-300">
                                {t('parentPortal.accessUntil')}: <span className="font-bold">{formattedEndDate}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate('/subscribe')}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-4 py-2.5 text-sm font-bold text-amber-900 hover:from-amber-300 hover:to-yellow-300 transition-all duration-200 w-full justify-center"
                          >
                            <RefreshCw size={16} />
                            {t('parentPortal.resubscribe')}
                          </button>
                        </div>
                      )}

                      {/* Cancel button (only for active/on_trial) */}
                      {isCancellable && (
                        <div className={`flex justify-end ${isRTL ? 'justify-start' : ''}`}>
                          <button
                            onClick={() => setShowCancelDialog(true)}
                            className="bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 rounded-xl py-2.5 px-6 text-sm font-medium transition-colors duration-200"
                          >
                            {t('parentPortal.cancelSubscription')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Section 4: Parent Settings */}
            <div className="mt-8 space-y-4">
              <SettingsSection
                isRTL={isRTL}
                title={t('parentPortal.parentSettingsHeading')}
                icon={ShieldCheck}
                defaultOpen={false}
              >
                <div className="space-y-4">
                  <ToggleSetting
                    isRTL={isRTL}
                    label={t('streak.weekendPassLabel')}
                    description={t('streak.weekendPassDescription')}
                    value={streakState?.weekendPassEnabled || false}
                    onChange={handleWeekendPassToggle}
                  />
                  {streakState?.weekendPassEnabled && (
                    <p className="text-xs text-green-300 mt-2">
                      {t('streak.weekendPassEnabled')}
                    </p>
                  )}
                </div>
              </SettingsSection>

              {/* Section 5: Notification Preferences */}
              <SettingsSection
                isRTL={isRTL}
                title={t('parentPortal.notificationsHeading')}
                icon={Bell}
                defaultOpen={false}
              >
                {/* Practice reminders push permission */}
                <NotificationPermissionCard
                  isRTL={isRTL}
                  studentId={user?.id}
                  onPermissionChange={() => {}}
                />

                <ToggleSetting
                  isRTL={isRTL}
                  label={t('pages.settings.notifications.enableAllNotifications')}
                  description={t('pages.settings.notifications.enableAllNotificationsDescription')}
                  value={preferences.notifications_enabled}
                  onChange={(value) => updatePreference('notifications_enabled', value)}
                />

                <div className="space-y-2 mt-4">
                  <h4 className="text-white font-semibold text-sm mb-2">
                    {t('pages.settings.notifications.notificationTypesTitle')}
                  </h4>
                  <ToggleSetting isRTL={isRTL} label={t('pages.settings.notifications.achievements')} value={preferences.notification_types?.achievement !== false} onChange={(value) => updateNotificationType('achievement', value)} disabled={!preferences.notifications_enabled} />
                  <ToggleSetting isRTL={isRTL} label={t('pages.settings.notifications.assignments')} value={preferences.notification_types?.assignment !== false} onChange={(value) => updateNotificationType('assignment', value)} disabled={!preferences.notifications_enabled} />
                  <ToggleSetting isRTL={isRTL} label={t('pages.settings.notifications.messages')} value={preferences.notification_types?.message !== false} onChange={(value) => updateNotificationType('message', value)} disabled={!preferences.notifications_enabled} />
                  <ToggleSetting isRTL={isRTL} label={t('pages.settings.notifications.reminders')} value={preferences.notification_types?.reminder !== false} onChange={(value) => updateNotificationType('reminder', value)} disabled={!preferences.notifications_enabled} />
                  <ToggleSetting isRTL={isRTL} label={t('pages.settings.notifications.system')} value={preferences.notification_types?.system !== false} onChange={(value) => updateNotificationType('system', value)} disabled={!preferences.notifications_enabled} />
                </div>

                <div className="mt-6">
                  <ToggleSetting
                    isRTL={isRTL}
                    label={t('pages.settings.notifications.quietHours')}
                    description={t('pages.settings.notifications.quietHoursDescription')}
                    value={preferences.quiet_hours_enabled}
                    onChange={(value) => updatePreference('quiet_hours_enabled', value)}
                    disabled={!preferences.notifications_enabled}
                  />
                  {preferences.quiet_hours_enabled && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <TimePicker isRTL={isRTL} label={t('pages.settings.notifications.startTime')} value={preferences.quiet_hours_start} onChange={(value) => updatePreference('quiet_hours_start', value)} />
                      <TimePicker isRTL={isRTL} label={t('pages.settings.notifications.endTime')} value={preferences.quiet_hours_end} onChange={(value) => updatePreference('quiet_hours_end', value)} />
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <ToggleSetting
                    isRTL={isRTL}
                    label={t('pages.settings.notifications.dailyPracticeReminder')}
                    description={t('pages.settings.notifications.dailyPracticeReminderDescription')}
                    value={preferences.daily_reminder_enabled}
                    onChange={(value) => updatePreference('daily_reminder_enabled', value)}
                    disabled={!preferences.notifications_enabled}
                  />
                  {preferences.daily_reminder_enabled && (
                    <div className="mt-3">
                      <TimePicker isRTL={isRTL} label={t('pages.settings.notifications.reminderTime')} value={preferences.daily_reminder_time} onChange={(value) => updatePreference('daily_reminder_time', value)} />
                    </div>
                  )}
                </div>
              </SettingsSection>

              {/* Section 6: Account */}
              <SettingsSection
                isRTL={isRTL}
                title={t('parentPortal.accountHeading')}
                icon={Trash2}
                defaultOpen={false}
              >
                <div className="space-y-3">
                  <p className="text-white/70 text-sm">
                    {t('pages.settings.deleteAccountDescription')}
                  </p>
                  <button
                    onClick={handleDeleteAccountClick}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 hover:text-red-200 transition-all duration-200 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('pages.settings.deleteAccountButton')}
                  </button>
                </div>
              </SettingsSection>

              {/* Section 7: Legal */}
              <SettingsSection
                isRTL={isRTL}
                title={t('parentPortal.legalHeading')}
                icon={Scale}
                defaultOpen={false}
              >
                <div className="space-y-3">
                  <Link to="/privacy" className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors text-sm">
                    {t('pages.settings.privacyPolicy', 'Privacy Policy')}
                  </Link>
                  <Link to="/terms" className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors text-sm">
                    {t('pages.settings.termsOfService', 'Terms of Service')}
                  </Link>
                  <Link to="/legal" className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors text-sm">
                    {t('pages.settings.attributions', 'Attributions & Licenses')}
                  </Link>
                </div>
              </SettingsSection>
            </div>
          </div>

          {/* Account Deletion Modal */}
          <AccountDeletionModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            student={user ? { student_id: user.id, student_name: studentDisplayName } : null}
            onDeletionRequested={() => setShowDeleteModal(false)}
          />

          {/* Cancel Confirmation Dialog */}
          {showCancelDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/70" onClick={() => !isCancelling && setShowCancelDialog(false)} aria-hidden="true" />
              <div className="relative bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-xl p-6 max-w-sm w-full shadow-2xl">
                <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <AlertTriangle size={24} className="flex-shrink-0 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">{t('parentPortal.cancelConfirmTitle')}</h3>
                </div>
                <p className="text-sm text-white/70 mb-6">
                  {t('parentPortal.cancelConfirmBody', { date: formattedEndDate || '' })}
                </p>
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => setShowCancelDialog(false)}
                    disabled={isCancelling}
                    className="flex-1 rounded-xl bg-white/10 border border-white/20 py-2.5 px-4 text-sm font-semibold text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    {t('parentPortal.keepSubscription')}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="flex-1 rounded-xl bg-red-500 py-2.5 px-4 text-sm font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {t('parentPortal.cancelling')}
                      </>
                    ) : (
                      t('parentPortal.yesCancel')
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
