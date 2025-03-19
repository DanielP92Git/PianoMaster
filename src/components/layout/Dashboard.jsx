import React from "react";
import { Loader2 } from "lucide-react";
import { useScores } from "../../features/userData/useScores";
import { useUser } from "../../features/authentication/useUser";
import { useQuery } from "@tanstack/react-query";
import { streakService } from "../../services/streakService";
import PracticeRecorder from "../practice/PracticeRecorder";
import PracticeReminder from "../practice/PracticeReminder";
import { Link } from "react-router-dom";

function Dashboard() {
  const { user } = useUser();
  const { scores, isLoading } = useScores();
  const { data: streak } = useQuery({
    queryKey: ["streak"],
    queryFn: () => streakService.getStreak(),
    refetchInterval: 1000 * 30,
    staleTime: 1000 * 30,
  });
  let totalScore = scores?.totalScore;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {/* Welcome Section */}
      <div className="text-center lg:text-left">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">
          Welcome back,
          {user?.user_metadata?.full_name ? (
            <span className="block mt-1">{user.user_metadata.full_name}!</span>
          ) : (
            "!"
          )}
        </h1>
        <p className="mt-2 text-gray-300">
          Ready to continue your musical journey?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Daily Streak */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-6 border border-white/20">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm lg:text-lg font-medium text-gray-300">
              Daily Streak
            </h3>
            <p className="mt-1 lg:mt-2 text-2xl lg:text-4xl font-bold text-white">
              {streak || 0}
              <span className="text-base lg:text-xl ml-1">days</span>
            </p>
          </div>
        </div>

        {/* Total Points */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-6 border border-white/20">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm lg:text-lg font-medium text-gray-300">
              Total Points
            </h3>
            <p className="mt-1 lg:mt-2 text-2xl lg:text-4xl font-bold text-white">
              {totalScore || 0}
            </p>
          </div>
        </div>

        {/* Practice Time */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-6 border border-white/20">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-sm lg:text-lg font-medium text-gray-300">
              Practice Time
            </h3>
            <p className="mt-1 lg:mt-2 text-2xl lg:text-4xl font-bold text-white">
              {scores?.practice_time || 0}
              <span className="text-base lg:text-xl ml-1">h</span>
            </p>
          </div>
        </div>
      </div>

      {/* Practice Tools Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Practice Reminder Section */}
        <PracticeReminder />

        {/* Practice Recorder Section */}
        <PracticeRecorder />

        {/* View Practice Sessions */}
        <div className="lg:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white mb-4">
              View Practice History
            </h2>
            <Link
              to="/practice-sessions"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
            >
              View All Sessions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
