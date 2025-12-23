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
import { Bell, X, BellOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { practiceService } from "../../services/practiceService";
import AudioRecorder from "../ui/AudioRecorder";
import AudioPlayer from "../ui/AudioPlayer";
import { Send, Loader2, Mic } from "lucide-react";
import { usePracticeSessionWithAchievements } from "../../hooks/usePracticeSessionWithAchievements";
import {
  dashboardReminderService,
  formatTimeRemaining,
} from "../../services/dashboardReminderService";
import { lockOrientation } from "../../utils/pwa";

function Dashboard() {
  const { user, isTeacher, isStudent, userRole, profile } = useUser();
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";
  useEffect(() => {
    if (!isStudent) return;
    lockOrientation("landscape-primary");
  }, [isStudent]);

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
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
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
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header Section */}
        <div
          className={`text-center ${isRTL ? "lg:text-right" : "lg:text-left"}`}
        >
          <h1 className="mb-2 text-3xl font-bold text-white lg:text-4xl">
            {t("dashboard.header.welcomeBack")},
            {profile?.first_name ? (
              <span className="ml-2"> {profile.first_name}!</span>
            ) : user?.user_metadata?.full_name ? (
              <span className="mt-1 block">
                {user.user_metadata.full_name}!
              </span>
            ) : (
              <span className="mt-1 block">
                {t("dashboard.header.defaultName")}!
              </span>
            )}
          </h1>
        </div>

        {/* Stats Section */}
        <div className="space-y-8">
          {/* Stats Grid - 4 columns on large, 2 on medium, 1 on small */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
            {/* Daily Streak */}
            <StreakDisplay variant="card" />

            {/* Total Points */}
            <PointsDisplay variant="card" />

            {/* Practice Time */}
            <div className="card-compact p-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <h3 className="text-xs font-medium text-gray-600">
                  {t("dashboard.stats.practiceTime")}
                </h3>
                <p className="mt-1 flex items-center justify-center gap-2 text-lg font-bold text-gray-900">
                  {scores?.practice_time || 0}
                  <span className="ml-1 text-s">
                    {t("dashboard.stats.hoursAbbrev")}
                  </span>
                </p>
              </div>
            </div>

            {/* Level */}
            <LevelDisplay variant="card" />
          </div>

          {/* Quick Access Panel for Teachers */}
          {isTeacher && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Students Overview */}
              <Link
                to="/teacher/students"
                className="card-hover group block p-6"
              >
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
        </div>

        {/* Bottom Section - Three Equal Width Containers */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Next Steps Section */}
          <div className="card p-6">
            <h3 className="mb-6 text-lg font-medium text-gray-900">
              {t("dashboard.nextSteps.title")}
            </h3>

            <div className="space-y-4">
              {availableNextSteps.length > 0 ? (
                availableNextSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 bg-gradient-to-r p-4 ${step.colors.bg} rounded-xl border ${step.colors.border}`}
                  >
                    <div
                      className={`h-10 w-10 bg-gradient-to-br ${step.colors.icon} flex flex-shrink-0 items-center justify-center rounded-full`}
                    >
                      <span className="text-lg text-white">{step.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 font-medium text-gray-900">
                        {step.title}
                      </div>
                      <div className="mb-2 text-sm text-gray-600">
                        {step.description}
                      </div>
                      <div
                        className={`text-xs ${step.colors.text} font-medium`}
                      >
                        {t("dashboard.nextSteps.points", {
                          points: step.points,
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <div className="mb-4 text-4xl">🎉</div>
                  <div className="mb-2 font-medium text-gray-900">
                    {t("dashboard.nextSteps.emptyTitle")}
                  </div>
                  <div className="mb-4 text-sm text-gray-600">
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

            <div className="mt-6 border-t border-gray-100 pt-4">
              <div className="text-center">
                <Link
                  to="/achievements"
                  className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                >
                  {t("dashboard.nextSteps.cta")}
                </Link>
              </div>
            </div>
          </div>

          {/* Assignments Section */}
          <div>
            <AssignmentsList />
          </div>

          {/* Practice Tools Section */}
          <div className="card p-6">
            <h3 className="mb-6 text-lg font-medium text-gray-900">
              {t("dashboard.practiceTools.title")}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Active Reminder Indicator */}
              {activeReminder && (
                <div className="rounded-xl border-2 border-blue-500/40 bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4">
                  <div className="flex flex-col gap-3">
                    <div
                      className={`flex items-center gap-3 ${
                        isRTL ? "flex-row-reverse text-right" : ""
                      }`}
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                        🔔
                      </div>
                      <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                        <div className="mb-1 font-medium text-gray-900">
                          ⏰ {t("dashboard.practiceTools.activeReminder.title")}{" "}
                          {formatTimeRemaining(activeReminder.timeLeft)}
                        </div>
                        <div className="text-sm text-gray-600">
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
                    <button
                      onClick={handleCancelReminder}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <BellOff className="h-4 w-4" />
                      {t("common.actions.cancel")}
                    </button>
                  </div>
                </div>
              )}

              {/* Practice Reminder Button */}
              {!activeReminder && (
                <button
                  onClick={openReminderModal}
                  className={`block rounded-xl border border-gray-200 bg-gray-100 p-4 hover:bg-gray-200 ${
                    isRTL ? "text-right" : "text-left"
                  } w-full transition-colors`}
                >
                  <div
                    className={`flex items-start gap-3 ${
                      isRTL ? "flex-row-reverse text-right" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                      🔔
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 font-medium text-gray-900">
                        {t("dashboard.practiceTools.cards.reminder.title")}
                      </div>
                      <div className="text-sm text-gray-600">
                        {t(
                          "dashboard.practiceTools.cards.reminder.description"
                        )}
                      </div>
                    </div>
                  </div>
                </button>
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
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
