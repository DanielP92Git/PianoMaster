import { useState } from "react";
import { useScores } from "../../features/userData/useScores";
import { useUser } from "../../features/authentication/useUser";
import AssignmentsList from "../student/AssignmentsList";
import { useQuery } from "@tanstack/react-query";
import { streakService } from "../../services/streakService";
import { achievementService } from "../../services/achievementService";
import StreakDisplay from "../streak/StreakDisplay";
import PointsDisplay from "../ui/PointsDisplay";
import LevelDisplay from "../ui/LevelDisplay";
import { Link } from "react-router-dom";
import { useModal } from "../../contexts/ModalContext";
import { Bell, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { practiceService } from "../../services/practiceService";
import { useNewRecordingsCount } from "../../hooks/useNewRecordingsCount";
import AudioRecorder from "../ui/AudioRecorder";
import AudioPlayer from "../ui/AudioPlayer";
import { Send, Loader2, Mic } from "lucide-react";
import { usePracticeSessionWithAchievements } from "../../hooks/usePracticeSessionWithAchievements";

function Dashboard() {
  const { user, isTeacher, isStudent, userRole, profile } = useUser();
  const { scores, isLoading } = useScores();
  const { openModal, closeModal } = useModal();
  const { addNewRecording } = useNewRecordingsCount(user?.id);

  // Fetch user streak
  const {
    data: streak = { current_streak: 0, longest_streak: 0 },
    isLoading: streakLoading,
  } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: () => streakService.getUserStreak(user.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - streak doesn't change often
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  // Check if connected to real-time updates
  const isConnected = true; // Placeholder for real-time connection status

  // Fetch all achievements
  const { data: allAchievements = [], isLoading: achievementsLoading } =
    useQuery({
      queryKey: ["achievements"],
      queryFn: () => Promise.resolve(achievementService.getAllAchievements()),
      staleTime: 30 * 60 * 1000, // 30 minutes - achievements list rarely changes
    });

  // Fetch user's earned achievements
  const { data: earnedAchievements = [], isLoading: earnedLoading } = useQuery({
    queryKey: ["earned-achievements", user?.id],
    queryFn: () => achievementService.getEarnedAchievements(user.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - earned achievements don't change often
    refetchInterval: 10 * 60 * 1000, // Check every 10 minutes
  });

  // Fetch recent achievements
  const recentAchievements = earnedAchievements.slice(0, 3);

  // Calculate upcoming achievements
  const earnedIds = earnedAchievements.map((a) => a.achievement_id);
  const upcomingAchievements = allAchievements
    .filter((achievement) => !earnedIds.includes(achievement.id))
    .slice(0, 3);

  // Modal opening functions
  const openReminderModal = () => {
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
          // Save to localStorage
          const dateTimeMs =
            new Date().getTime() + timeDifferenceInMinutes * 60 * 1000;
          localStorage.setItem(
            "practiceTimer",
            JSON.stringify({
              timeLeft: timeDifferenceInMinutes,
              dateTime: dateTimeMs,
            })
          );
          closeModal();
          toast.success("Reminder set successfully!");
        } else {
          toast.error("Please select a future date and time");
        }
      };

      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
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
              Time
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
            Set Reminder
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
          Set Practice Reminder
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
        toast.success(
          `Recording completed (${minutes}:${seconds.toString().padStart(2, "0")})`
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
                  `Upload failed, retrying... (${retryInfo.attempt}/3)`
                );
              },
            },
          });

          if (result?.session?.id) {
            addNewRecording(result.session.id);
          }

          closeModal();
        } catch (error) {
          // Error handling is done in the hook
        }
      };

      return (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Record Practice Session
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
                    Review Your Recording
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
                    Practice Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about your practice session, what you worked on, challenges faced, etc..."
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
                          "Preparing..."}
                        {uploadProgress?.phase === "uploading" &&
                          `Uploading... (${uploadProgress.percentage}%)`}
                        {uploadProgress?.phase === "completed" &&
                          "Finalizing..."}
                        {!uploadProgress && "Uploading..."}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Recording
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRecordingCancel}
                    disabled={uploadPracticeSession.isPending}
                    className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <X className="w-5 h-5" />
                    Record Again
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
        <div className="text-center lg:text-left">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Welcome back,
            {profile?.first_name ? (
              <span className="ml-2">{profile.first_name}!</span>
            ) : user?.user_metadata?.full_name ? (
              <span className="block mt-1">
                {user.user_metadata.full_name}!
              </span>
            ) : (
              <span className="block mt-1">Musician!</span>
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
                  Practice Time
                </h3>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {scores?.practice_time || 0}
                  <span className="text-xs ml-1">h</span>
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
                  <div className="text-gray-900 font-medium mb-2">Students</div>
                  <div className="text-gray-600 text-sm">
                    Manage and track student progress
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
                  <div className="text-gray-900 font-medium">Assignments</div>
                  <div className="text-gray-600 text-sm">
                    Create and track assignments
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Bottom Section - Three Equal Width Containers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Achievements Section */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Recent Achievements
            </h3>

            {achievementsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-200 rounded-xl animate-pulse"
                  ></div>
                ))}
              </div>
            ) : recentAchievements.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 text-gray-500 mx-auto mb-4 text-4xl">
                  🏆
                </div>
                <div className="text-gray-600 mb-2">No achievements yet</div>
                <div className="text-gray-500 text-sm mb-6">
                  Complete practice sessions to earn badges!
                </div>

                <div className="text-left">
                  <div className="text-gray-900 font-medium mb-4">
                    Coming up:
                  </div>
                  <div className="space-y-3">
                    {upcomingAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-3 p-3 bg-gray-100 rounded-xl border border-gray-200"
                      >
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {achievement.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {achievement.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 bg-gray-100 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {achievement.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignments Section */}
          <div>
            <AssignmentsList />
          </div>

          {/* Practice Tools Section */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Practice Tools
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {/* Practice Reminder */}
              <button
                onClick={openReminderModal}
                className="bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl p-4 block text-left w-full transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    🔔
                  </div>
                  <div>
                    <div className="text-gray-900 font-medium">
                      Set a Practice Reminder
                    </div>
                    <div className="text-gray-600 text-sm">
                      Stay consistent with your practice
                    </div>
                  </div>
                </div>
              </button>

              {/* Record Practice Session */}
              <button
                onClick={openRecordModal}
                className="bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl p-4 block text-left w-full transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                    🎤
                  </div>
                  <div>
                    <div className="text-gray-900 font-medium">
                      Record Practice Session
                    </div>
                    <div className="text-gray-600 text-sm">
                      Record your practice for feedback
                    </div>
                  </div>
                </div>
              </button>

              {/* View Practice History */}
              <Link
                to="/practice-sessions"
                className="bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl p-4 block transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    📊
                  </div>
                  <div>
                    <div className="text-gray-900 font-medium">
                      View Practice History
                    </div>
                    <div className="text-gray-600 text-sm">
                      Review your progress and sessions
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
