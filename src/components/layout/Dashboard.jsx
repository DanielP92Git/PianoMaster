import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useScores } from "../../features/userData/useScores";
import { useUser } from "../../features/authentication/useUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { streakService } from "../../services/streakService";
import { getNextRecommendedNode } from "../../services/skillProgressService";
import { useModal } from "../../contexts/ModalContext";
import { Bell, X, TrendingUp } from "lucide-react";
import { toast } from "react-hot-toast";
import AudioRecorder from "../ui/AudioRecorder";
import AudioPlayer from "../ui/AudioPlayer";
import { Send, Loader2, Music2 } from "lucide-react";
import { useTotalPoints } from "../../hooks/useTotalPoints";
import { usePracticeSessionWithAchievements } from "../../hooks/usePracticeSessionWithAchievements";
import {
  dashboardReminderService,
  formatTimeRemaining,
} from "../../services/dashboardReminderService";
import { useUserProfile } from "../../hooks/useUserProfile";
import { ACCESSORY_SLOT_STYLES } from "../ui/AnimatedAvatar";
import { getAvatarImageSource } from "../../utils/avatarAssets";
import { getStudentScores } from "../../services/apiDatabase";
import iconClock from "../../assets/icons/clock.png";
import iconCrown from "../../assets/icons/crown.png";
import iconFlame from "../../assets/icons/flame.png";
import iconStar from "../../assets/icons/star.png";
import Fireflies from "../ui/Fireflies";
import iconFlameSimple from "../../assets/icons/flame-simple.png";
import DailyGoalsCard from "../dashboard/DailyGoalsCard";
import XPProgressCard from "../dashboard/XPProgressCard";
import { getDailyGoalsWithProgress } from "../../services/dailyGoalsService";
import { translateNodeName } from "../../utils/translateNodeName";

function Dashboard() {
  const { user, isTeacher, isStudent, profile } = useUser();
  const { t, i18n } = useTranslation(["common", "trail"]);
  const isRTL = i18n.dir() === "rtl";
  const queryClient = useQueryClient();
  const { data: profileData, isLoading: isProfileLoading } = useUserProfile();
  const avatarUrl = getAvatarImageSource(
    profileData?.avatars || profileData?.avatar_url,
    profileData?.avatar_url
  );
  const layeredAccessories = Array.isArray(profileData?.equipped_accessories)
    ? profileData.equipped_accessories.filter((item) => item?.image_url)
    : [];


  // Only load student-specific data if user is a student (Performance optimization for teachers)
  const { scores, isLoading } = useScores(); // Already has isStudent check internally
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
  const {
    data: currentStreak = 0,
    isLoading: streakLoading,
  } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: () => streakService.getStreak(),
    enabled: !!user?.id && isStudent, // Only fetch for students
    staleTime: 2 * 60 * 1000, // 2 minutes - streak doesn't change often
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  // Fetch total points and calculate trend
  const { data: totalPointsData } = useTotalPoints({
    staleTime: 0,
    refetchOnMount: "always",
    keepPreviousData: false,
  });
  const totalPoints = totalPointsData?.totalPoints || 0;

  // Calculate points trend (simplified - using recent scores if available)
  const calculateRecentTrend = (scores) => {
    if (!scores || !Array.isArray(scores) || scores.length === 0) return 0;
    const recent = scores.slice(0, 7);
    const older = scores.slice(7, 14);
    const recentAvg =
      recent.reduce((sum, score) => sum + (score.score || 0), 0) /
      recent.length;
    const olderAvg =
      older.length > 0
        ? older.reduce((sum, score) => sum + (score.score || 0), 0) /
          older.length
        : recentAvg;
    if (olderAvg === 0) return 0;
    return ((recentAvg - olderAvg) / olderAvg) * 100;
  };

  const { data: scoresData } = useQuery({
    queryKey: ["student-scores", user?.id],
    queryFn: () => {
      if (!user?.id || !isStudent) return [];
      return getStudentScores(user.id);
    },
    enabled: !!user?.id && isStudent,
    staleTime: 3 * 60 * 1000,
  });

  const pointsTrend = calculateRecentTrend(scoresData || []);

  // Fetch next recommended trail node (only for students)
  const { data: nextNode } = useQuery({
    queryKey: ["next-recommended-node", user?.id],
    queryFn: () => {
      if (!user?.id || !isStudent) return null;
      return getNextRecommendedNode(user.id);
    },
    enabled: !!user?.id && isStudent,
    staleTime: 1 * 60 * 1000, // 1 minute - node availability changes when exercises complete
  });

  // Fetch daily goals with progress (only for students)
  const { data: dailyGoals = [], isLoading: goalsLoading, error: goalsError } = useQuery({
    queryKey: ["daily-goals", user?.id, (() => {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    })()],
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
      console.error('Daily goals query error:', goalsError);
    }
  }, [goalsError]);

  // Get level info
  const getLevelInfo = (points) => {
    if (points === 0) {
      return {
        name: t("dashboard.levels.beginner.name"),
        description: t("dashboard.levels.beginner.description"),
      };
    } else if (points < 100) {
      return {
        name: t("dashboard.levels.student.name"),
        description: t("dashboard.levels.student.description"),
      };
    } else if (points < 500) {
      return {
        name: t("dashboard.levels.practitioner.name"),
        description: t("dashboard.levels.practitioner.description"),
      };
    } else if (points < 1000) {
      return {
        name: t("dashboard.levels.expert.name"),
        description: t("dashboard.levels.expert.description"),
      };
    } else if (points < 2500) {
      return {
        name: t("dashboard.levels.master.name"),
        description: t("dashboard.levels.master.description"),
      };
    } else {
      return {
        name: t("dashboard.levels.legend.name"),
        description: t("dashboard.levels.legend.description"),
      };
    }
  };

  const levelInfo = getLevelInfo(totalPoints);
  const levelName = levelInfo.name;

  // Helper functions for streak progress
  const getStreakProgress = (currentStreak) => {
    const milestones = [1, 3, 7, 14, 30, 50, 100];
    const nextMilestone = milestones.find((m) => m > currentStreak);
    if (!nextMilestone) return 100;
    const prevMilestone =
      milestones[milestones.indexOf(nextMilestone) - 1] || 0;
    const progress =
      ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getNextStreakMilestone = (currentStreak) => {
    const milestones = [1, 3, 7, 14, 30, 50, 100];
    const nextMilestone = milestones.find((m) => m > currentStreak);
    if (!nextMilestone) return t("dashboard.streak.maxReached");
    const prevMilestone =
      milestones[milestones.indexOf(nextMilestone) - 1] || 0;
    return `${prevMilestone} ${t("dashboard.streak.rangeSeparator")} ${nextMilestone} ${t("dashboard.streak.dayLabel", { count: nextMilestone })}`;
  };

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

  if (isLoading || streakLoading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-6 py-6 md:px-8 md:py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-1/3 rounded bg-white/20"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/20"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero (full-width on mobile, contained on desktop) */}
      <header className="group relative h-[320px] overflow-hidden rounded-none shadow-2xl md:mx-auto md:h-[400px] md:max-w-7xl md:rounded-[2.5rem] md:px-6 md:py-6 lg:px-8 lg:py-8">
        <picture className="absolute inset-0">
          <source
            media="(min-width: 1024px)"
            type="image/webp"
            srcSet="/images/desktop-dashboard-hero.webp"
          />
          <source
            type="image/webp"
            srcSet="/images/dashboard-hero.webp"
          />
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

        {/* Dark gradient overlay like the reference */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-violet-950 via-violet-950/40 to-transparent opacity-90" />

        {/* Fireflies effect overlay */}
        <Fireflies count={5} className="z-[2]" />

        <div className="relative z-20 flex h-full flex-col justify-between p-4 md:p-8 lg:p-10">
          {/* Hero top row: avatar + app icon/name (matches reference screenshots) */}
          <div
            className={`absolute left-4 top-[calc(var(--safe-area-top)+1rem)] z-30 flex items-center gap-4 md:left-6 md:top-[calc(var(--safe-area-top)+1.5rem)] lg:left-0 lg:top-0 ${
              isRTL
                ? "left-auto right-4 flex-row-reverse md:left-auto md:right-6 lg:left-auto lg:right-8"
                : ""
            }`}
          >
            {isProfileLoading ? (
              <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
            ) : avatarUrl ? (
              <Link to="/avatars">
                <div className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-full border-2 border-indigo-500/60 bg-white/10">
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
              </Link>
            ) : null}

            <div
              className={`flex items-center gap-2 text-white/90 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <Music2 className="h-6 w-6 text-indigo-300" />
              <span className="text-xl font-extrabold tracking-wide">
                {t("app.title")}
              </span>
            </div>
          </div>

          {/* Hero center: welcome text */}
          <div className="flex flex-1 items-center justify-center">
            <div className="space-y-3 text-center md:space-y-4">
              <h1 className="text-4xl font-medium tracking-tight text-white drop-shadow-lg md:text-6xl">
                {t("dashboard.header.welcomeBack")},{" "}
                <span className="bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  {profile?.first_name
                    ? `${profile.first_name}!`
                    : user?.user_metadata?.full_name
                      ? `${user.user_metadata.full_name}!`
                      : `${t("dashboard.header.defaultName")}!`}
                </span>
              </h1>
              <p className="text-base font-medium text-white/80 md:text-lg">
                {t("dashboard.header.subtitle", {
                  defaultValue: "Your musical journey continues",
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-30 mx-auto max-w-7xl space-y-8 px-6 py-6 md:px-8 md:py-8">
        {/* Continue Learning Section (only for students with trail access) */}
        {isStudent && nextNode && (
          <section className="space-y-3">
            <Link
              to="/trail"
              state={{ highlightNodeId: nextNode.id }}
              className="group relative block overflow-hidden rounded-3xl border-2 border-blue-400/60 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_0_20px_rgba(99,102,241,0.5),0_0_40px_rgba(139,92,246,0.4)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_0_2px_rgba(59,130,246,0.5),0_0_30px_rgba(99,102,241,0.6),0_0_60px_rgba(139,92,246,0.5)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative z-10">
                <div className={isRTL ? "text-right" : ""}>
                  <div className="text-xl font-bold text-white drop-shadow">
                    {t("dashboard.continueButton.title", { defaultValue: "Continue Learning" })}
                  </div>
                  <div className="mt-1 text-sm text-white/80">
                    {translateNodeName(nextNode.name, t, i18n)} {nextNode.progress?.stars > 0 && `(${nextNode.progress.stars}★)`}
                  </div>
                </div>
              </div>
            </Link>

            <div className="text-center">
              <Link
                to="/practice-modes"
                className="text-sm font-medium text-white/70 transition-colors hover:text-white/90 hover:underline"
              >
                {t("dashboard.continueButton.freePractice", { defaultValue: "Free Practice Mode" })} →
              </Link>
            </div>
          </section>
        )}

        {/* XP Progress Section (only for students) */}
        {isStudent && (
          <section>
            <XPProgressCard />
          </section>
        )}

        {/* Daily Goals Section (only for students) */}
        {isStudent && (
          <section>
            <DailyGoalsCard goals={dailyGoals} isLoading={goalsLoading} />
          </section>
        )}

        {/* Stats grid (glass style like reference image) */}
        <section className="relative z-30 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Daily Streak Card */}
          <div className="group relative flex min-h-[150px] transform flex-col items-center justify-between rounded-3xl border border-white/10 bg-white/10 p-2 pt-16 shadow-xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1">
            <div className="pointer-events-none absolute -top-12 left-1/2 z-50 flex h-24 w-24 -translate-x-1/2 items-center justify-center drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
              <div className="stats-icon-glow stats-icon-glow-orange flex h-full w-full items-center justify-center">
                <img
                  src={iconFlame}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full select-none object-contain"
                  style={{
                    filter:
                      "drop-shadow(0 0 20px rgba(255, 140, 0, 0.6)) drop-shadow(0 0 40px rgba(255, 69, 0, 0.4)) drop-shadow(0 0 60px rgba(255, 140, 0, 0.2))",
                  }}
                  draggable="false"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              {t("dashboard.stats.dailyStreak")}
            </div>
            <div className="text-center">
              <div
                className="text-3xl font-black text-white"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {currentStreak || 0}{" "}
                <span className="text-base font-bold text-white/70">
                  {t("dashboard.streak.dayLabel", {
                    count: currentStreak || 0,
                  })}
                </span>
              </div>
              <div className="mt-1 text-sm font-bold text-orange-200">
                {currentStreak >= 3 && currentStreak < 7
                  ? t("dashboard.streak.messages.gettingHot")
                  : currentStreak >= 7
                    ? t("dashboard.streak.messages.onFire")
                    : t("dashboard.streak.messages.buildingMomentum")}
              </div>
            </div>
            <div className="mt-2 w-full">
              <div className="h-2 w-full rounded-full bg-white/15">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                  style={{
                    width: `${getStreakProgress(currentStreak || 0)}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-center text-xs font-medium text-white/60">
                {getNextStreakMilestone(currentStreak || 0)}
              </div>
            </div>
          </div>

          {/* Total Points Card */}
          <div className="group relative flex min-h-[150px] transform flex-col items-center justify-between rounded-3xl border border-white/10 bg-white/10 p-2 pt-16 shadow-xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1">
            <div className="pointer-events-none absolute -top-12 left-1/2 z-50 flex h-24 w-24 -translate-x-1/2 items-center justify-center drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
              <div className="stats-icon-glow stats-icon-glow-gold flex h-full w-full items-center justify-center">
                <img
                  src={iconStar}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full select-none object-contain"
                  style={{
                    filter:
                      "drop-shadow(0 0 20px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 40px rgba(255, 223, 0, 0.4)) drop-shadow(0 0 60px rgba(255, 215, 0, 0.2))",
                  }}
                  draggable="false"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              {t("dashboard.stats.totalPoints")}
            </div>
            <div className="text-center">
              <div
                className="text-3xl font-black text-white"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {totalPoints.toLocaleString()}
              </div>
              {pointsTrend > 0 && (
                <div className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-green-300">
                  <TrendingUp className="h-4 w-4" />
                  {Math.round(pointsTrend)}%
                </div>
              )}
            </div>
            <div className="h-2" />
          </div>

          {/* Practice Time Card */}
          <div className="group relative flex min-h-[150px] transform flex-col items-center justify-between rounded-3xl border border-white/10 bg-white/10 p-2 pt-16 shadow-xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1">
            <div className="pointer-events-none absolute -top-12 left-1/2 z-50 flex h-24 w-24 -translate-x-1/2 items-center justify-center drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
              <div className="stats-icon-glow stats-icon-glow-blue flex h-full w-full items-center justify-center">
                <img
                  src={iconClock}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full select-none object-contain"
                  style={{
                    filter:
                      "drop-shadow(0 0 20px rgba(100, 181, 246, 0.6)) drop-shadow(0 0 40px rgba(66, 165, 245, 0.4)) drop-shadow(0 0 60px rgba(100, 181, 246, 0.2))",
                  }}
                  draggable="false"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              {t("dashboard.stats.practiceTime")}
            </div>
            <div className="text-center">
              <div
                className="text-3xl font-black text-white"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {scores?.practice_time || 0}{" "}
                <span className="text-lg font-bold text-white/70">
                  {t("dashboard.stats.hoursAbbrev")}
                </span>
              </div>
            </div>
            <div className="h-2" />
          </div>

          {/* Level Card */}
          <div className="group relative flex min-h-[150px] transform flex-col items-center justify-between rounded-3xl border border-white/10 bg-white/10 p-2 pt-16 shadow-xl backdrop-blur-md transition-transform duration-300 hover:-translate-y-1">
            <div className="pointer-events-none absolute -top-12 left-1/2 z-50 flex h-24 w-24 -translate-x-1/2 items-center justify-center drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
              <div className="stats-icon-glow stats-icon-glow-amber flex h-full w-full items-center justify-center">
                <img
                  src={iconCrown}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full select-none object-contain"
                  style={{
                    filter:
                      "drop-shadow(0 0 20px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 40px rgba(255, 193, 7, 0.4)) drop-shadow(0 0 60px rgba(255, 215, 0, 0.2))",
                  }}
                  draggable="false"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              {t("dashboard.stats.level")}
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-yellow-200">
                {String(levelName || "").toUpperCase()}
              </div>
            </div>
            <div className="h-2" />
          </div>
        </section>

        {/* Quick Access Panel for Teachers */}
        {isTeacher && (
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
        )}

        {/* Bottom Section - Mystical forest style (matches reference) */}
        <section className="grid grid-cols-1 gap-6 pb-8 lg:grid-cols-3">
          {/* Left / Big Panel: My Progress */}
          <div
            className="relative overflow-hidden rounded-[2.25rem] border-2 border-purple-400/60 bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-violet-900/90 shadow-[0_0_0_1px_rgba(168,85,247,0.4),0_0_0_2px_rgba(139,92,246,0.3),0_0_20px_rgba(168,85,247,0.5),0_0_40px_rgba(139,92,246,0.4),0_0_60px_rgba(168,85,247,0.3),0_0_80px_rgba(59,130,246,0.2),inset_0_0_20px_rgba(168,85,247,0.1)] lg:col-span-2"
          >
            <div className="relative z-10 p-6 sm:p-8">
              <div
                className={`mb-6 flex items-center justify-between ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <h3 className="text-lg font-bold text-white/90 drop-shadow">
                  {t("dashboard.myProgress.title", {
                    defaultValue: "My Progress",
                  })}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Build a Practice Streak */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_24px_rgba(99,102,241,0.22)] backdrop-blur-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  <div className="relative">
                    <div className={isRTL ? "text-right" : ""}>
                      <div className="text-sm font-semibold text-white/90">
                        {t("dashboard.nextSteps.items.streak3.title", {
                          defaultValue: "Build a Practice Streak",
                        })}
                      </div>
                      <div className="mt-2 text-xs text-white/70">
                        {t("dashboard.nextSteps.items.streak3.description", {
                          defaultValue: "Keep it up!",
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignments */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_24px_rgba(168,85,247,0.20)] backdrop-blur-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  <div className="relative">
                    <div
                      className={`mb-4 flex items-center justify-between ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <h4 className="text-sm font-semibold text-white/90">
                        {t("dashboard.assignments.title", {
                          defaultValue: "Assignments",
                        })}
                      </h4>
                    </div>

                    <div
                      className={`flex flex-wrap gap-3 ${
                        isRTL ? "justify-end" : ""
                      }`}
                    >
                      <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 shadow-[0_0_16px_rgba(59,130,246,0.18)]">
                        {t("dashboard.assignments.noPending", {
                          defaultValue: "No pending",
                        })}
                      </span>
                      <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 shadow-[0_0_16px_rgba(34,197,94,0.14)]">
                        {t("dashboard.assignments.completed", {
                          count: 0,
                          defaultValue: "0 completed",
                        })}
                      </span>
                    </div>

                    <div className="mt-6 text-center text-xs italic text-white/70">
                      {t("dashboard.assignments.allCaughtUp", {
                        defaultValue: "You're all caught up!",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Practice Tools */}
          <div
            className="relative overflow-hidden rounded-[2.25rem] border-2 border-indigo-400/60 bg-gradient-to-br from-indigo-900/90 via-blue-900/90 to-cyan-900/90 shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_0_0_2px_rgba(79,70,229,0.3),0_0_20px_rgba(99,102,241,0.5),0_0_40px_rgba(79,70,229,0.4),0_0_60px_rgba(99,102,241,0.3),0_0_80px_rgba(59,130,246,0.2),inset_0_0_20px_rgba(99,102,241,0.1)]"
          >
            <div className="relative z-10 p-6 sm:p-8">
              <h3 className="mb-6 text-lg font-bold text-white/90 drop-shadow">
                {t("dashboard.practiceTools.title", {
                  defaultValue: "Practice Tools",
                })}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* Shared card style */}
                {!activeReminder && (
                  <button
                    onClick={openReminderModal}
                    className={`group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_26px_rgba(168,85,247,0.20)] backdrop-blur-md transition hover:bg-white/10 ${
                      isRTL ? "flex-row-reverse text-right" : ""
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/25 shadow-[0_0_18px_rgba(168,85,247,0.28)]">
                      <Bell className="h-6 w-6 text-white/90" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">
                        {t("dashboard.practiceTools.cards.reminder.title")}
                      </div>
                      <div className="mt-0.5 text-xs text-white/70">
                        {t(
                          "dashboard.practiceTools.cards.reminder.description"
                        )}
                      </div>
                    </div>
                  </button>
                )}

                {activeReminder && (
                  <div
                    className={`flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_26px_rgba(168,85,247,0.20)] backdrop-blur-md ${
                      isRTL ? "flex-row-reverse text-right" : ""
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/25 shadow-[0_0_18px_rgba(168,85,247,0.28)]">
                      <Bell className="h-6 w-6 animate-pulse text-white/90" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">
                        {t("dashboard.practiceTools.activeReminder.title")}{" "}
                        {formatTimeRemaining(activeReminder.timeLeft)}
                      </div>
                      <div className="mt-0.5 text-xs text-white/70">
                        {t("dashboard.practiceTools.activeReminder.setFor", {
                          time: new Date(
                            activeReminder.dateTime
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={openRecordModal}
                  className={`group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_26px_rgba(34,197,94,0.14)] backdrop-blur-md transition hover:bg-white/10 ${
                    isRTL ? "flex-row-reverse text-right" : ""
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/25 shadow-[0_0_18px_rgba(34,197,94,0.18)]">
                    <span className="text-lg">🎤</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {t("dashboard.practiceTools.cards.recording.title")}
                    </div>
                    <div className="mt-0.5 text-xs text-white/70">
                      {t("dashboard.practiceTools.cards.recording.description")}
                    </div>
                  </div>
                </button>

                <Link
                  to="/practice-sessions"
                  className={`group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_26px_rgba(59,130,246,0.18)] backdrop-blur-md transition hover:bg-white/10 ${
                    isRTL ? "flex-row-reverse text-right" : ""
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/25 shadow-[0_0_18px_rgba(59,130,246,0.22)]">
                    <span className="text-lg">📊</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {t("dashboard.practiceTools.cards.history.title")}
                    </div>
                    <div className="mt-0.5 text-xs text-white/70">
                      {t("dashboard.practiceTools.cards.history.description")}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
