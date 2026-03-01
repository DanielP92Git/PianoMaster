/**
 * ParentPortalPage — /parent-portal
 *
 * Subscription management page for parents. Shows current subscription status,
 * plan details, billing period, renewal date, and provides cancel + re-subscribe flows.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Calendar,
  XCircle,
  RefreshCw,
  Loader2,
  Crown,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUser } from '../features/authentication/useUser';
import { useSubscription } from '../contexts/SubscriptionContext';
import { fetchSubscriptionDetail } from '../services/subscriptionService';
import supabase from '../services/supabase';

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  // Optimistic state after cancel to avoid waiting for DB refresh
  const [optimisticCancel, setOptimisticCancel] = useState(null);

  const {
    data: detail,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ['subscription-detail', user?.id],
    queryFn: () => fetchSubscriptionDetail(user?.id),
    enabled: !!user?.id,
    staleTime: 0,
  });

  const isLoading = detailLoading || subCtxLoading;

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

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
        {/* Back navigation */}
        <Link
          to="/settings"
          className={`mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
          {t('parentPortal.back')}
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-white">{t('parentPortal.title')}</h1>

        {/* No subscription state */}
        {!effectiveDetail && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 text-center">
            <CreditCard size={40} className="mx-auto mb-3 text-white/40" />
            <p className="mb-4 text-white/70">{t('parentPortal.noSubscription')}</p>
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
      </div>

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
  );
}
