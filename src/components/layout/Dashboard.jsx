import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useScores } from "../../features/userData/useScores";
import { useUser } from "../../features/authentication/useUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { streakService } from "../../services/streakService";
import { getNextRecommendedNode } from "../../services/skillProgressService";
import { useModal } from "../../contexts/ModalContext";
import { Bell, X, Mic, Piano } from "lucide-react";
import { toast } from "react-hot-toast";
import AudioRecorder from "../ui/AudioRecorder";
import AudioPlayer from "../ui/AudioPlayer";
import { Send, Loader2 } from "lucide-react";
import { usePracticeSessionWithAchievements } from "../../hooks/usePracticeSessionWithAchievements";
import {
  dashboardReminderService,
} from "../../services/dashboardReminderService";
import { useUserProfile } from "../../hooks/useUserProfile";
import { ACCESSORY_SLOT_STYLES } from "../ui/AnimatedAvatar";
import { getAvatarImageSource } from "../../utils/avatarAssets";
import Fireflies from "../ui/Fireflies";
import DailyGoalsCard from "../dashboard/DailyGoalsCard";
import WeeklySummaryCard from "../dashboard/WeeklySummaryCard";
import DailyMessageBanner from "../dashboard/DailyMessageBanner";
import PlayNextButton from "../dashboard/PlayNextButton";
import DailyChallengeCard from "../dashboard/DailyChallengeCard";
import { useOnboarding } from "../../hooks/useOnboarding";
import OnboardingTour from "../onboarding/OnboardingTour";
import UnifiedStatsCard from "../dashboard/UnifiedStatsCard";
import PushOptInCard from "../dashboard/PushOptInCard";
import PracticeLogCard from "../dashboard/PracticeLogCard";
import { practiceLogService } from "../../services/practiceLogService";
import { getDailyGoalsWithProgress } from "../../services/dailyGoalsService";
import { getWeeklyProgress } from "../../services/weeklyProgressService";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import {
  getStudentXP,
  getLevelProgress,
  calculateLevel,
} from "../../utils/xpSystem";
import { motion } from "framer-motion";

function Dashboard() {
  const { user, isTeacher, isStudent, profile } = useUser();
  const { isPremium } = useSubscription();
  const { shouldShowOnboarding, completeOnboarding } = useOnboarding();
  const { t, i18n } = useTranslation(["common", "trail"]);
  const isRTL = i18n.dir() === "rtl";
  const { data: profileData, isLoading: isProfileLoading } = useUserProfile();
  const { reducedMotion } = useAccessibility();

  // URL param detection for practice check-in notification (PUSH-05, D-11, D-12)
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const avatarUrl = getAvatarImageSource(
    profileData?.avatars || profileData?.avatar_url,
    profileData?.avatar_url
  );
  const layeredAccessories = Array.isArray(profileData?.equipped_accessories)
    ? profileData.equipped_accessories.filter((item) => item?.image_url)
    : [];

  // Only load student-specific data if user is a student (Performance optimization for teachers)
  const { isLoading } = useScores(); // Already has isStudent check internally
  const { openModal, closeModal } = useModal();
  const [activeReminder, setActiveReminder] = useState(null);

  // Note: Progress migration removed in v1.3 - all users started fresh with redesigned trail system

  // Poll for active reminder status (only for students)
  useEffect(() => {
    if (!isStudent) return;

    const updateReminderStatus = () => {
      const reminder = dashboardReminderService.getActiveReminder();
      setActiveReminder(reminder);
    };

    // Initial check
    updateReminderStatus();

    // Update every second
    const interval = setInterval(updateReminderStatus, 1000);

    return () => clearInterval(interval);
  }, [isStudent]);

  // Fetch user streak (only for students)
  const { data: currentStreak = 0, isLoading: streakLoading } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: () => streakService.getStreak(),
    enabled: !!user?.id && isStudent, // Only fetch for students
    staleTime: 2 * 60 * 1000, // 2 minutes - streak doesn't change often
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  // Fetch full streak state for comeback bonus banner (only for students)
  const { data: streakState } = useQuery({
    queryKey: ["streak-state", user?.id],
    queryFn: () => streakService.getStreakState(),
    enabled: !!user?.id && isStudent,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
  const comebackBonus = streakState?.comebackBonus;

  // Auto-log practice from notification tap (PUSH-05, D-11, D-12)
  const hasPracticeCheckin = searchParams.get('practice_checkin') === '1';

  useEffect(() => {
    if (!hasPracticeCheckin || !user?.id || !isStudent) return;

    // Clean URL synchronously before async work — prevents re-trigger on re-render (D-18)
    window.history.replaceState({}, '', '/');

    const localDate = practiceLogService.getCalendarDate();

    practiceLogService.logPractice(localDate)
      .then(({ inserted }) => {
        if (inserted) {
          // D-11: Triggers PracticeLogCard settled state via React Query cache invalidation
          queryClient.invalidateQueries({ queryKey: ['practice-log-today', user.id, localDate] });
          queryClient.invalidateQueries({ queryKey: ['practice-streak', user.id] });
          queryClient.invalidateQueries({ queryKey: ['student-xp', user.id] });
          toast.success(t('practice.toast.autoLogged'));
        } else {
          // D-12: Already logged — show friendly neutral toast
          toast(t('practice.toast.alreadyLogged'));
        }
      })
      .catch((err) => {
        console.error('[Dashboard] practice_checkin auto-log failed:', err);
        toast.error(t('practice.toast.autoLogError'));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPracticeCheckin, user?.id, isStudent]);

  // Fetch next recommended trail node (only for students)
  // isPremium in queryKey ensures cache invalidates when subscription status changes
  const { data: nextNode } = useQuery({
    queryKey: ["next-recommended-node", user?.id, isPremium],
    queryFn: () => {
      if (!user?.id || !isStudent) return null;
      return getNextRecommendedNode(user.id, isPremium);
    },
    enabled: !!user?.id && isStudent,
    staleTime: 1 * 60 * 1000, // 1 minute - node availability changes when exercises complete
  });

  // Fetch daily goals with progress (only for students)
  const {
    data: dailyGoals = [],
    isLoading: goalsLoading,
    error: goalsError,
  } = useQuery({
    queryKey: [
      "daily-goals",
      user?.id,
      (() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      })(),
    ],
    queryFn: async () => {
      if (!user?.id || !isStudent) {
        return [];
      }
      return await getDailyGoalsWithProgress(user.id);
    },
    enabled: !!user?.id && isStudent,
    staleTime: 30 * 1000, // 30 seconds - goals update frequently during practice
    refetchInterval: 60 * 1000, // Refetch every minute to keep progress fresh
  });

  // Log goals error if any
  useEffect(() => {
    if (goalsError) {
      console.error("Daily goals query error:", goalsError);
    }
  }, [goalsError]);

  // Fetch weekly progress summary (only for students)
  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ["weekly-summary", user?.id],
    queryFn: () => getWeeklyProgress(user.id),
    enabled: !!user?.id && isStudent,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch student XP data (previously inside XPProgressCard)
  const { data: xpData, isLoading: xpLoading } = useQuery({
    queryKey: ["student-xp", user?.id],
    queryFn: () => getStudentXP(user.id),
    enabled: !!user?.id && isStudent,
    staleTime: 0,
    refetchInterval: 60 * 1000,
  });

  // Extract XP-related values
  const level = xpData?.levelData?.level || 1;
  const totalXP = xpData?.totalXP || 0;
  const progress = xpData?.progress || getLevelProgress(0);
  const levelData = calculateLevel(totalXP);
  const isPrestige = levelData.isPrestige;
  const rawLevelTitle = levelData.title || "Beginner";
  const levelTitle = isPrestige
    ? t("xpLevels.prestigeTitle", { tier: levelData.prestigeTier })
    : t("xpLevels." + rawLevelTitle, { defaultValue: rawLevelTitle });

  // Compute XP range values for UnifiedStatsCard
  const xpInCurrentLevel = progress.xpInCurrentLevel || 0;
  const xpNeededForNext = progress.xpNeededForNext || 0;
  const xpRange = xpInCurrentLevel + xpNeededForNext; // total span of current level
  const progressPercentage = progress.progressPercentage || 0;

  // Get first name for compact greeting
  const firstName = profile?.first_name
    ? profile.first_name
    : user?.user_metadata?.full_name
      ? user.user_metadata.full_name.split(" ")[0]
      : t("dashboard.header.defaultName");

  // Modal opening functions
  const openReminderModal = async () => {
    // Request notification permission if not granted
    const permission = dashboardReminderService.getPermissionStatus();
    if (permission === "default") {
      try {
        const result = await dashboardReminderService.requestPermission();
        if (result !== "granted") {
          toast.error(t("dashboard.toasts.permissionRequired"));
          return;
        }
      } catch (error) {
        console.error("Permission request failed:", error);
        toast.error(t("dashboard.toasts.requestFailed"));
        return;
      }
    } else if (permission === "denied") {
      toast.error(t("dashboard.toasts.notificationsBlocked"));
      return;
    }

    const now = new Date();
    const minDate = now.toISOString().split("T")[0];
    const currentTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const ReminderForm = () => {
      const [formDate, setFormDate] = useState(minDate);
      const [formTime, setFormTime] = useState(currentTime);

      const handleSubmit = (e) => {
        e.preventDefault();
        const dateTime = new Date(`${formDate}T${formTime}`);
        const timeDifferenceInMinutes = Math.floor(
          (dateTime - now) / (1000 * 60)
        );

        if (timeDifferenceInMinutes > 0) {
          // Schedule reminder using the service
          const dateTimeMs =
            new Date().getTime() + timeDifferenceInMinutes * 60 * 1000;
          dashboardReminderService.scheduleReminder(dateTimeMs);
          closeModal();
          toast.success(t("dashboard.toasts.reminderScheduled"));
        } else {
          toast.error(t("dashboard.toasts.futureTimeRequired"));
        }
      };

      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("dashboard.reminders.dateLabel")}
            </label>
            <input
              type="date"
              required
              min={minDate}
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("dashboard.reminders.timeLabel")}
            </label>
            <input
              type="time"
              required
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2"
            />
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Bell className="h-5 w-5" />
            {t("common.actions.setReminder")}
          </button>
        </form>
      );
    };

    openModal(
      <>
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="mb-4 text-xl font-bold text-gray-800">
          {t("dashboard.reminders.modalTitle")}
        </h3>
        <ReminderForm />
      </>
    );
  };

  const openRecordModal = () => {
    const RecordingModalContent = () => {
      const [recordingBlob, setRecordingBlob] = useState(null);
      const [recordingDuration, setRecordingDuration] = useState(0);
      const [notes, setNotes] = useState("");
      const [uploadProgress, setUploadProgress] = useState(null);
      const uploadPracticeSession = usePracticeSessionWithAchievements();

      const handleRecordingComplete = (blob, duration) => {
        setRecordingBlob(blob);
        setRecordingDuration(duration);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const secondsString = seconds.toString().padStart(2, "0");
        toast.success(
          t("dashboard.recording.completed", {
            minutes,
            seconds: secondsString,
          })
        );
      };

      const handleRecordingCancel = () => {
        setRecordingBlob(null);
        setRecordingDuration(0);
        setNotes("");
      };

      const handleModalClose = () => {
        handleRecordingCancel();
        closeModal();
      };

      const handleSubmit = async () => {
        if (!recordingBlob) return;

        try {
          setUploadProgress({ phase: "preparing", percentage: 0 });

          await uploadPracticeSession.mutateAsync({
            recordingBlob,
            notes,
            recordingDuration,
            options: {
              compressionQuality: "MEDIUM",
              maxRetries: 3,
              onProgress: (progress) => {
                setUploadProgress(progress);
              },
              onRetry: (retryInfo) => {
                toast.error(
                  t("dashboard.recording.retry", {
                    attempt: retryInfo.attempt,
                  })
                );
              },
            },
          });

          closeModal();
        } catch {
          // Error handling is done in the hook
        }
      };

      return (
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {t("dashboard.recording.title")}
            </h2>
            <button
              onClick={handleModalClose}
              className="p-2 text-gray-500 transition-colors hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {!recordingBlob && (
              <div className="rounded-xl bg-gray-50 p-6">
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  onRecordingCancel={handleRecordingCancel}
                  maxDuration={600}
                  showVisualization={true}
                  visualizationHeight={120}
                  className="bg-white shadow-sm"
                />
              </div>
            )}

            {recordingBlob && (
              <div className="space-y-6">
                <div className="rounded-xl bg-gray-50 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-800">
                    {t("dashboard.recording.reviewTitle")}
                  </h3>
                  <AudioPlayer
                    src={URL.createObjectURL(recordingBlob)}
                    showVolumeControl={true}
                    showSeekBar={true}
                    showTimeDisplay={true}
                    className="bg-white shadow-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t("dashboard.recording.notesLabel")}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("dashboard.recording.notesPlaceholder")}
                    className="w-full resize-none rounded-xl border border-gray-300 p-4 text-gray-900 placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="4"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSubmit}
                    disabled={uploadPracticeSession.isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadPracticeSession.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {uploadProgress?.phase === "preparing" &&
                          t("dashboard.recording.uploadStatus.preparing")}
                        {uploadProgress?.phase === "uploading" &&
                          t("dashboard.recording.uploadStatus.uploading", {
                            percentage: uploadProgress.percentage,
                          })}
                        {uploadProgress?.phase === "completed" &&
                          t("dashboard.recording.uploadStatus.finalizing")}
                        {!uploadProgress &&
                          t("dashboard.recording.uploadStatus.default")}
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        {t("dashboard.recording.submit")}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRecordingCancel}
                    disabled={uploadPracticeSession.isPending}
                    className="flex items-center gap-2 rounded-xl bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                    {t("common.actions.recordAgain")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    openModal(<RecordingModalContent />);
  };

  // Loading state — compact skeleton matching new layout
  if (isLoading || streakLoading) {
    return (
      <div className="min-h-screen">
        <div className="animate-pulse">
          {/* Hero skeleton */}
          <div className="h-[220px] bg-white/10 md:h-[260px]" />
          {/* Play button skeleton */}
          <div className="mx-auto -mt-7 flex justify-center">
            <div className="h-16 w-56 rounded-full bg-white/15" />
          </div>
          <div className="mx-auto max-w-2xl space-y-6 px-4 pt-6 md:px-6">
            {/* Stats card skeleton */}
            <div className="h-40 rounded-2xl bg-white/10" />
            {/* Goals skeleton */}
            <div className="h-48 rounded-3xl bg-white/10" />
            {/* Practice tools skeleton */}
            <div className="flex justify-center gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-full bg-white/10" />
                  <div className="h-3 w-12 rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Practice tools data for staggered animation
  const practiceTools = [
    {
      key: "reminder",
      onClick: openReminderModal,
      element: "button",
      borderColor: "border-amber-400/40",
      bgColor: "bg-amber-500/15",
      glowShadow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
      icon: <Bell className="h-7 w-7 text-amber-300" />,
      label: t("dashboard.practiceTools.cards.reminder.short", {
        defaultValue: "Reminder",
      }),
      hasIndicator: !!activeReminder,
    },
    {
      key: "record",
      onClick: openRecordModal,
      element: "button",
      borderColor: "border-emerald-400/40",
      bgColor: "bg-emerald-500/15",
      glowShadow: "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
      icon: <Mic className="h-7 w-7 text-emerald-300" />,
      label: t("dashboard.practiceTools.cards.recording.short", {
        defaultValue: "Record",
      }),
      hasIndicator: false,
    },
    {
      key: "history",
      to: "/practice-sessions",
      element: "link",
      borderColor: "border-blue-400/40",
      bgColor: "bg-blue-500/15",
      glowShadow: "shadow-[0_0_20px_rgba(59,130,246,0.25)]",
      icon: <Piano className="h-7 w-7 text-blue-300" />,
      label: t("dashboard.practiceTools.cards.history.short", {
        defaultValue: "History",
      }),
      hasIndicator: false,
    },
  ];

  const MotionOrDiv = reducedMotion ? "div" : motion.div;

  return (
    <div className="min-h-screen pb-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* COMPACT HERO */}
      <header className="group relative h-[220px] overflow-hidden rounded-b-[3rem] shadow-2xl md:h-[260px]">
        <picture className="absolute inset-0">
          <source
            media="(min-width: 1024px)"
            type="image/webp"
            srcSet="/images/desktop-dashboard-hero.webp"
          />
          <source type="image/webp" srcSet="/images/dashboard-hero.webp" />
          <source
            media="(min-width: 1024px)"
            srcSet="/images/desktop-dashboard-hero.png"
          />
          <img
            src="/images/dashboard-hero.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            aria-hidden="true"
            loading="eager"
            fetchpriority="high"
          />
        </picture>

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-violet-950 via-violet-950/40 to-transparent opacity-90" />

        {/* Fireflies effect overlay */}
        <Fireflies count={5} className="z-[2]" />

        <div className="relative z-20 flex h-full flex-col items-center justify-center">
          {/* Small app name */}
          <span className="mb-2 text-xs font-medium uppercase tracking-widest text-white/60">
            {t("app.title")}
          </span>

          {/* Horizontal avatar + level pill */}
          {isProfileLoading ? (
            <div className="mb-2 h-16 w-16 animate-pulse rounded-full bg-white/10" />
          ) : (
            <div
              className={`mb-2 flex items-center  ${isRTL ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar (z-10, overlaps the pill) */}
              <Link to="/avatars" className="relative z-10 shrink-0">
                {avatarUrl ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-sky-300/50 shadow-[0_2px_12px_rgba(56,189,248,0.4)]">
                    <img
                      className="h-full w-full object-cover"
                      src={avatarUrl}
                      alt={t("avatars.title", { defaultValue: "User avatar" })}
                      loading="eager"
                    />
                    {layeredAccessories.map((item) => {
                      const slot = item.slot || item.category || "accessory";
                      const slotClass =
                        ACCESSORY_SLOT_STYLES[slot] ||
                        ACCESSORY_SLOT_STYLES.accessory;
                      return (
                        <img
                          key={`${item.accessory_id || item.image_url}-${slot}`}
                          src={item.image_url}
                          alt=""
                          aria-hidden="true"
                          className={`${slotClass} pointer-events-none object-contain`}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/30 bg-slate-800">
                    <span className="text-2xl">🎹</span>
                  </div>
                )}
              </Link>
              {/* Level pill (tucks behind avatar with negative margin) */}
              <div
                className={`flex h-6 items-center rounded-full border-2 border-transparent pl-5 pr-2 -ml-7`}
                style={{
                  background: isPrestige
                    ? "linear-gradient(135deg, #f59e0b, #d97706, #b45309) padding-box, linear-gradient(to right, #fbbf24, #fde68a, #fbbf24) border-box"
                    : "linear-gradient(to right, rgba(30,41,59,0.85), rgba(30,41,59,0.85)) padding-box, linear-gradient(to right, #38bdf8, #f97316) border-box",
                  boxShadow: isPrestige
                    ? "0 2px 12px rgba(251,191,36,0.5), inset 0 1px 0 rgba(253,230,138,0.4)"
                    : "0 2px 12px rgba(56,189,248,0.4)",
                }}
              >
                <span className="ml-3 text-xs font-bold uppercase tracking-wider text-white">
                  {isPrestige
                    ? t("xpLevels.prestigeTitle", { tier: levelData.prestigeTier })
                    : t("dashboard.header.level", {
                        level,
                        defaultValue: `Level ${level}`,
                      })}
                </span>
              </div>
            </div>
          )}

          {/* Compact greeting */}
          <h1 className="text-xl font-bold text-white drop-shadow">
            {t("dashboard.header.greeting", {
              name: firstName,
              defaultValue: `Hi, ${firstName}!`,
            })}
          </h1>
        </div>
      </header>

      {/* ONBOARDING TOUR */}
      {shouldShowOnboarding && (
        <OnboardingTour onComplete={completeOnboarding} />
      )}

      {/* PLAY NEXT BUTTON (overlaps hero) */}
      {isStudent && nextNode && (
        <PlayNextButton
          to="/trail"
          highlightNodeId={nextNode.id}
          hasStarted={!!(nextNode.progress || nextNode.prerequisites?.length)}
          isRTL={isRTL}
        />
      )}

      {/* MAIN CONTENT */}
      <MotionOrDiv
        className="mx-auto max-w-2xl space-y-12 px-4 pt-6 md:px-6"
        {...(!reducedMotion && {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.4 },
        })}
      >
        {/* DAILY FUN FACT BANNER */}
        {isStudent && <DailyMessageBanner />}

        {/* UNIFIED STATS CARD */}
        {isStudent && (
          <UnifiedStatsCard
            levelTitle={levelTitle}
            levelNumber={level}
            progressPercentage={progressPercentage}
            xpCurrent={xpInCurrentLevel}
            xpTotal={xpRange}
            totalXP={totalXP}
            isPrestige={isPrestige}
            streakCount={currentStreak || 0}
            freezeCount={streakState?.freezeCount || 0}
            inGraceWindow={streakState?.inGraceWindow || false}
            goalsCompleted={dailyGoals.filter((g) => g.completed).length}
            goalsTotal={dailyGoals.length || 3}
            isRTL={isRTL}
            reducedMotion={reducedMotion}
            isLoading={streakLoading || xpLoading}
          />
        )}

        {/* PRACTICE LOG CARD — Phase 2 */}
        {isStudent && <PracticeLogCard />}

        {/* PRACTICE TOOLS (3 circular buttons) */}
        {isStudent && (
          <section>
            <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-white/70">
              {t("dashboard.practiceTools.title", {
                defaultValue: "Practice Tools",
              })}
            </h3>
            <div className="flex justify-center gap-8">
              {practiceTools.map((tool, index) => {
                const circleClasses = `relative flex h-16 w-16 items-center justify-center rounded-full border-2 ${tool.borderColor} ${tool.bgColor} ${tool.glowShadow} transition-transform duration-200 group-hover:scale-110 group-active:scale-95`;

                const innerContent = (
                  <>
                    <div className={circleClasses}>
                      {tool.icon}
                      {tool.hasIndicator && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-white/70">
                      {tool.label}
                    </span>
                  </>
                );

                const toolWrapper = (children) => {
                  if (reducedMotion) {
                    return (
                      <div
                        key={tool.key}
                        className="flex flex-col items-center gap-2"
                      >
                        {children}
                      </div>
                    );
                  }
                  return (
                    <motion.div
                      key={tool.key}
                      className="flex flex-col items-center gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {children}
                    </motion.div>
                  );
                };

                if (tool.element === "link") {
                  return toolWrapper(
                    <Link
                      to={tool.to}
                      className="group flex flex-col items-center gap-2"
                    >
                      {innerContent}
                    </Link>
                  );
                }

                return toolWrapper(
                  <button
                    onClick={tool.onClick}
                    className="group flex flex-col items-center gap-2"
                  >
                    {innerContent}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* COMEBACK BONUS BANNER */}
        {isStudent && comebackBonus?.active && (
          <div className="w-full rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-3 text-center">
            <p className="text-sm font-bold text-amber-300">
              {t("streak.comebackBanner", { days: comebackBonus.daysLeft })}
            </p>
            <p className="mt-0.5 text-xs text-amber-200/70">
              {t("streak.comebackDescription")}
            </p>
          </div>
        )}

        {/* PUSH OPT-IN CARD */}
        {isStudent && user && (
          <PushOptInCard
            studentId={user.id}
            createdAt={profileData?.created_at}
            isRTL={isRTL}
          />
        )}

        {/* DAILY CHALLENGE CARD */}
        {isStudent && <DailyChallengeCard />}

        {/* DAILY GOALS CARD (refreshed) */}
        {isStudent && (
          <DailyGoalsCard goals={dailyGoals} isLoading={goalsLoading} />
        )}

        {/* WEEKLY SUMMARY CARD */}
        {isStudent && (
          <WeeklySummaryCard data={weeklyData} isLoading={weeklyLoading} />
        )}
      </MotionOrDiv>

      {/* TEACHER PANEL (preserved as-is) */}
      {isTeacher && (
        <div className="relative z-30 mx-auto max-w-7xl space-y-8 px-6 py-6 md:px-8 md:py-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Students Overview */}
            <Link to="/teacher/students" className="card-hover group block p-6">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 transition-transform group-hover:scale-110">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="mb-2 font-medium text-gray-900">
                  {t("dashboard.teacherPanel.students.title")}
                </div>
                <div className="text-sm text-gray-600">
                  {t("dashboard.teacherPanel.students.description")}
                </div>
              </div>
            </Link>

            {/* Assignments */}
            <Link
              to="/teacher/assignments"
              className="card-hover group block p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 transition-transform group-hover:scale-110">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="font-medium text-gray-900">
                  {t("dashboard.teacherPanel.assignments.title")}
                </div>
                <div className="text-sm text-gray-600">
                  {t("dashboard.teacherPanel.assignments.description")}
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
