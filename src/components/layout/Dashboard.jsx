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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("dashboard.reminders.dateLabel")}
            </label>
            <input
              type="date"
              required
              min={minDate}
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("dashboard.reminders.timeLabel")}
            </label>
            <input
              type="time"
              required
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-6 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Bell className="w-5 h-5" />
            {t("common.actions.setReminder")}
          </button>
        </form>
      );
    };

    openModal(
      <>
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
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
        <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {t("dashboard.recording.title")}
          </h2>
            <button
              onClick={handleModalClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {!recordingBlob && (
              <div className="bg-gray-50 rounded-xl p-6">
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
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
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
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {t("dashboard.recording.notesLabel")}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("dashboard.recording.notesPlaceholder")}
                    className="w-full p-4 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    rows="4"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSubmit}
                    disabled={uploadPracticeSession.isPending}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {uploadPracticeSession.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
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
                        <Send className="w-5 h-5" />
                        {t("dashboard.recording.submit")}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRecordingCancel}
                    disabled={uploadPracticeSession.isPending}
                    className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <X className="w-5 h-5" />
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
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white/20 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div
          className={`text-center ${
            isRTL ? "lg:text-right" : "lg:text-left"
          }`}
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            {t("dashboard.header.welcomeBack")},
            {profile?.first_name ? (
              <span className="ml-2">{profile.first_name}!</span>
            ) : user?.user_metadata?.full_name ? (
              <span className="block mt-1">
                {user.user_metadata.full_name}!
              </span>
            ) : (
              <span className="block mt-1">
                {t("dashboard.header.defaultName")}!
              </span>
            )}
          </h1>
        </div>

        {/* Stats Section */}
        <div className="space-y-8">
          {/* Stats Grid - 4 columns on large, 2 on medium, 1 on small */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Daily Streak */}
            <StreakDisplay variant="card" />

            {/* Total Points */}
            <PointsDisplay variant="card" />

            {/* Practice Time */}
            <div className="card-compact p-3">
              <div className="flex flex-col items-center text-center">
                <h3 className="text-xs font-medium text-gray-600">
                  {t("dashboard.stats.practiceTime")}
                </h3>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {scores?.practice_time || 0}
                  <span className="text-xs ml-1">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Students Overview */}
              <Link
                to="/teacher/students"
                className="card-hover p-6 block group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="text-gray-900 font-medium mb-2">
                    {t("dashboard.teacherPanel.students.title")}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {t("dashboard.teacherPanel.students.description")}
                  </div>
                </div>
              </Link>

              {/* Assignments */}
              <Link
                to="/teacher/assignments"
                className="card-hover p-6 block group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="text-gray-900 font-medium">
                    {t("dashboard.teacherPanel.assignments.title")}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {t("dashboard.teacherPanel.assignments.description")}
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Bottom Section - Three Equal Width Containers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Next Steps Section */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {t("dashboard.nextSteps.title")}
            </h3>

            <div className="space-y-4">
              {availableNextSteps.length > 0 ? (
                availableNextSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-4 bg-gradient-to-r ${step.colors.bg} rounded-xl border ${step.colors.border}`}
                  >
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${step.colors.icon} rounded-full flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-white text-lg">{step.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">
                        {step.title}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
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
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎉</div>
                  <div className="font-medium text-gray-900 mb-2">
                    {t("dashboard.nextSteps.emptyTitle")}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {t("dashboard.nextSteps.emptyDescription")}
                  </div>
                  <Link
                    to="/achievements"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    {t("dashboard.nextSteps.viewAll")}
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <Link
                  to="/achievements"
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
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
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {t("dashboard.practiceTools.title")}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Active Reminder Indicator */}
              {activeReminder && (
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500/40 rounded-xl p-4">
                  <div className="flex flex-col gap-3">
                    <div
                      className={`flex items-center gap-3 ${
                        isRTL ? "flex-row-reverse text-right" : ""
                      }`}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                        🔔
                      </div>
                      <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                        <div className="text-gray-900 font-medium mb-1">
                          ⏰ {t("dashboard.practiceTools.activeReminder.title")}{" "}
                          {formatTimeRemaining(activeReminder.timeLeft)}
                        </div>
                        <div className="text-gray-600 text-sm">
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
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium text-sm ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <BellOff className="w-4 h-4" />
                      {t("common.actions.cancel")}
                    </button>
                  </div>
                </div>
              )}

              {/* Practice Reminder Button */}
              {!activeReminder && (
                <button
                  onClick={openReminderModal}
                  className={`bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl p-4 block ${
                    isRTL ? "text-right" : "text-left"
                  } w-full transition-colors`}
                >
                  <div
                    className={`flex items-start gap-3 ${
                      isRTL ? "flex-row-reverse text-right" : ""
                    }`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      🔔
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-900 font-medium mb-1">
                        {t("dashboard.practiceTools.cards.reminder.title")}
                      </div>
                      <div className="text-gray-600 text-sm">
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
                className={`bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl p-4 block ${
                  isRTL ? "text-right" : "text-left"
                } w-full transition-colors`}
              >
                <div
                  className={`flex items-start gap-3 ${
                    isRTL ? "flex-row-reverse text-right" : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    🎤
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium mb-1">
                      {t("dashboard.practiceTools.cards.recording.title")}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {t("dashboard.practiceTools.cards.recording.description")}
                    </div>
                  </div>
                </div>
              </button>

              {/* View Practice History */}
              <Link
                to="/practice-sessions"
                className={`bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl p-4 block transition-colors ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`flex items-start gap-3 ${
                    isRTL ? "flex-row-reverse text-right" : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                    📊
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium mb-1">
                      {t("dashboard.practiceTools.cards.history.title")}
                    </div>
                    <div className="text-gray-600 text-sm">
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
