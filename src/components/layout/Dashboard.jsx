import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useScores } from "../../features/userData/useScores";
import { useUser } from "../../features/authentication/useUser";
import AssignmentsList from "../student/AssignmentsList";
import { useQuery } from "@tanstack/react-query";
import { streakService } from "../../services/streakService";
import { achievementService } from "../../services/achievementService";
import StreakDisplay from "../streak/StreakDisplay";
import PointsDisplay from "../ui/PointsDisplay";
import LevelDisplay from "../ui/LevelDisplay";
import { useModal } from "../../contexts/ModalContext";
import {
  Bell,
  X,
  BellOff,
  Flame,
  Trophy,
  Award,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { practiceService } from "../../services/practiceService";
import AudioRecorder from "../ui/AudioRecorder";
import AudioPlayer from "../ui/AudioPlayer";
import { Send, Loader2, Mic, Music2 } from "lucide-react";
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

function Dashboard() {
  const { user, isTeacher, isStudent, userRole, profile } = useUser();
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";
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
    data: streak = { current_streak: 0, longest_streak: 0 },
    isLoading: streakLoading,
  } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: () => streakService.getUserStreak(user.id),
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
  const levelDescription = levelInfo.description;

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
    return `${prevMilestone} to ${nextMilestone} ${t("dashboard.streak.dayLabel", { count: nextMilestone })}`;
  };

  // Check if connected to real-time updates
  const isConnected = true; // Placeholder for real-time connection status

  // Fetch user's earned achievements to filter out completed next steps (only for students)
  const { data: earnedAchievements = [] } = useQuery({
    queryKey: ["earned-achievements", user?.id],
    queryFn: () => achievementService.getEarnedAchievements(user.id),
    enabled: !!user?.id && isStudent, // Only fetch for students
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create a set of earned achievement IDs for quick lookup
  const earnedAchievementIds = new Set(
    earnedAchievements.map((achievement) => achievement.achievement_id)
  );

  // Define next steps with their corresponding achievement IDs
  const allNextSteps = [
    {
      id: "first_session",
      icon: "🎯",
      title: t("dashboard.nextSteps.items.firstSession.title"),
      description: t("dashboard.nextSteps.items.firstSession.description"),
      points: 50,
      colors: {
        bg: "from-blue-50 to-indigo-50",
        border: "border-blue-100",
        icon: "from-blue-500 to-indigo-500",
        text: "text-blue-600",
      },
    },
    {
      id: "streak_3",
      icon: "🔥",
      title: t("dashboard.nextSteps.items.streak3.title"),
      description: t("dashboard.nextSteps.items.streak3.description"),
      points: 100,
      colors: {
        bg: "from-orange-50 to-red-50",
        border: "border-orange-100",
        icon: "from-orange-500 to-red-500",
        text: "text-orange-600",
      },
    },
    {
      id: "perfect_score",
      icon: "🎵",
      title: t("dashboard.nextSteps.items.perfectScore.title"),
      description: t("dashboard.nextSteps.items.perfectScore.description"),
      points: 150,
      colors: {
        bg: "from-purple-50 to-pink-50",
        border: "border-purple-100",
        icon: "from-purple-500 to-pink-500",
        text: "text-purple-600",
      },
    },
    {
      id: "high_scorer",
      icon: "💎",
      title: t("dashboard.nextSteps.items.highScorer.title"),
      description: t("dashboard.nextSteps.items.highScorer.description"),
      points: 250,
      colors: {
        bg: "from-green-50 to-emerald-50",
        border: "border-green-100",
        icon: "from-green-500 to-emerald-500",
        text: "text-green-600",
      },
    },
    {
      id: "streak_7",
      icon: "⭐",
      title: t("dashboard.nextSteps.items.streak7.title"),
      description: t("dashboard.nextSteps.items.streak7.description"),
      points: 200,
      colors: {
        bg: "from-yellow-50 to-amber-50",
        border: "border-yellow-100",
        icon: "from-yellow-500 to-amber-500",
        text: "text-yellow-600",
      },
    },
  ];

  // Filter out completed achievements and limit to 4 items
  const availableNextSteps = allNextSteps
    .filter((step) => !earnedAchievementIds.has(step.id))
    .slice(0, 4);

  // Handle cancel reminder
  const handleCancelReminder = () => {
    dashboardReminderService.cancelReminder();
    toast.success(t("dashboard.toasts.reminderCancelled"));
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

          const result = await uploadPracticeSession.mutateAsync({
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
        } catch (error) {
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
            srcSet="/images/desktop-dashboard-hero.png"
          />
          <img
            src="/images/dashboard-hero.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            aria-hidden="true"
            loading="eager"
          />
        </picture>

        {/* Dark gradient overlay like the reference */}
        <div className="absolute inset-0 bg-gradient-to-t from-violet-950 via-violet-950/40 to-transparent opacity-90" />

        <div className="relative flex h-full flex-col justify-between p-4 md:p-8 lg:p-10">
          {/* Hero top row: avatar + app icon/name (matches reference screenshots) */}
          <div
            className={`flex items-center gap-4 ${
              isRTL ? "flex-row-reverse justify-end" : "justify-start"
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
              <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg md:text-6xl">
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

      <div className="relative mx-auto max-w-7xl space-y-8 px-6 py-6 md:px-8 md:py-8">
        {/* Stats grid (exact match from screenshot) */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Daily Streak Card */}
          <div className="flex min-h-[180px] transform flex-col items-center justify-between rounded-3xl bg-white p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Flame className="h-5 w-5 text-orange-500" />
              {t("dashboard.stats.dailyStreak")}
            </div>
            <div className="text-center">
              <div
                className="text-4xl font-black text-gray-900"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {streak?.current_streak || 0}{" "}
                <span className="text-lg font-bold text-gray-500">
                  {t("dashboard.streak.dayLabel", {
                    count: streak?.current_streak || 0,
                  })}
                </span>
              </div>
              <div className="mt-1 text-sm font-bold text-red-500">
                {streak?.current_streak >= 3 && streak?.current_streak < 7
                  ? t("dashboard.streak.messages.gettingHot")
                  : streak?.current_streak >= 7
                    ? t("dashboard.streak.messages.onFire")
                    : t("dashboard.streak.messages.buildingMomentum")}
              </div>
            </div>
            <div className="mt-2 w-full">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                  style={{
                    width: `${getStreakProgress(streak?.current_streak || 0)}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-center text-xs font-medium text-gray-400">
                {getNextStreakMilestone(streak?.current_streak || 0)}
              </div>
            </div>
          </div>

          {/* Total Points Card */}
          <div className="flex min-h-[180px] transform flex-col items-center justify-between rounded-3xl bg-white p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {t("dashboard.stats.totalPoints")}
            </div>
            <div className="text-center">
              <div
                className="text-4xl font-black text-gray-900"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {totalPoints.toLocaleString()}
              </div>
              {pointsTrend > 0 && (
                <div className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-green-500">
                  <TrendingUp className="h-4 w-4" />
                  {Math.round(pointsTrend)}%
                </div>
              )}
            </div>
            <div className="h-4" />
          </div>

          {/* Practice Time Card */}
          <div className="flex min-h-[180px] transform flex-col items-center justify-between rounded-3xl bg-white p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              {t("dashboard.stats.practiceTime")}
            </div>
            <div className="text-center">
              <div
                className="text-4xl font-black text-gray-900"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {scores?.practice_time || 0}{" "}
                <span className="text-xl font-bold text-gray-500">
                  {t("dashboard.stats.hoursAbbrev")}
                </span>
              </div>
            </div>
            <div className="h-4" />
          </div>

          {/* Level Card */}
          <div className="flex min-h-[180px] transform flex-col items-center justify-between rounded-3xl bg-white p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Award className="h-5 w-5 text-yellow-600" />
              {t("dashboard.stats.level")}
            </div>
            <div className="text-center">
              <div
                className="text-3xl font-black text-yellow-600"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {levelName}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {levelDescription}
              </div>
            </div>
            <div className="mt-2">
              <span className="rounded-full border border-yellow-200 bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                {levelName}
              </span>
            </div>
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

        {/* Bottom Section - Three Equal Width Containers (exact match from screenshot) */}
        <section className="grid grid-cols-1 gap-6 pb-8 lg:grid-cols-3">
          {/* Next Steps Section */}
          <div className="rounded-3xl border border-white/50 bg-white/10 p-6 shadow-lg backdrop-blur-sm">
            <h3 className="mb-6 text-lg font-bold text-white">
              {t("dashboard.nextSteps.title")}
            </h3>

            <div className="space-y-4">
              {availableNextSteps.length > 0 ? (
                availableNextSteps.slice(0, 1).map((step) => (
                  <div
                    key={step.id}
                    className="flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100">
                      <Flame className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {step.title}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {step.description}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <div className="mb-4 text-4xl">🎉</div>
                  <div className="mb-2 font-medium text-white">
                    {t("dashboard.nextSteps.emptyTitle")}
                  </div>
                  <div className="mb-4 text-sm text-white/80">
                    {t("dashboard.nextSteps.emptyDescription")}
                  </div>
                  <Link
                    to="/achievements"
                    className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    {t("dashboard.nextSteps.viewAll")}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Assignments Section */}
          <div className="rounded-3xl border border-white/50 bg-white/10 p-6 shadow-lg backdrop-blur-sm">
            <h3 className="mb-6 text-lg font-bold text-white">
              {t("dashboard.assignments.title")}
            </h3>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-lg bg-blue-200 px-3 py-1.5 text-sm font-bold text-blue-800 shadow-sm">
                {t("dashboard.assignments.noPending", {
                  defaultValue: "No pending",
                })}
              </span>
              <span className="rounded-lg bg-green-200 px-3 py-1.5 text-sm font-bold text-green-800 shadow-sm">
                {t("dashboard.assignments.completed", {
                  count: 0,
                  defaultValue: "0 completed",
                })}
              </span>
            </div>
            <div className="mt-6 text-center text-sm italic text-white/70">
              {t("dashboard.assignments.allCaughtUp", {
                defaultValue: "You're all caught up!",
              })}
            </div>
          </div>

          {/* Practice Tools Section */}
          <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/10 p-6 shadow-lg backdrop-blur-sm">
            <h3 className="mb-6 text-lg font-bold text-white">
              {t("dashboard.practiceTools.title")}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Practice Reminder Button - matches screenshot */}
              {!activeReminder && (
                <button
                  onClick={openReminderModal}
                  className="relative z-10 flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <Bell className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {t("dashboard.practiceTools.cards.reminder.title")}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {t("dashboard.practiceTools.cards.reminder.description")}
                    </div>
                  </div>
                </button>
              )}
              {/* Active Reminder Indicator */}
              {activeReminder && (
                <div className="relative z-10 flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <Bell className="h-6 w-6 animate-pulse text-purple-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {t("dashboard.practiceTools.activeReminder.title")}{" "}
                      {formatTimeRemaining(activeReminder.timeLeft)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
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

              {/* Record Practice Session */}
              <button
                onClick={openRecordModal}
                className={`block rounded-xl border border-gray-200 bg-gray-100 p-4 hover:bg-gray-200 ${
                  isRTL ? "text-right" : "text-left"
                } w-full transition-colors`}
              >
                <div
                  className={`flex items-start gap-3 ${
                    isRTL ? "flex-row-reverse text-right" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500">
                    🎤
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 font-medium text-gray-900">
                      {t("dashboard.practiceTools.cards.recording.title")}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("dashboard.practiceTools.cards.recording.description")}
                    </div>
                  </div>
                </div>
              </button>

              {/* View Practice History */}
              <Link
                to="/practice-sessions"
                className={`block rounded-xl border border-gray-200 bg-gray-100 p-4 transition-colors hover:bg-gray-200 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`flex items-start gap-3 ${
                    isRTL ? "flex-row-reverse text-right" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                    📊
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 font-medium text-gray-900">
                      {t("dashboard.practiceTools.cards.history.title")}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("dashboard.practiceTools.cards.history.description")}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
