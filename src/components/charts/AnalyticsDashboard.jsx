import React, { useState } from "react";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Trophy,
  Filter,
  RefreshCw,
} from "lucide-react";
import ClassPerformanceChart from "./ClassPerformanceChart";
import TopPerformersLeaderboard from "./TopPerformersLeaderboard";

import PerformanceDistribution from "./PerformanceDistribution";

const AnalyticsDashboard = ({ students, onRefresh, loading = false }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMetric, setSelectedMetric] = useState("all");

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "performance", label: "Performance", icon: Trophy },
    { id: "distribution", label: "Distribution", icon: PieChart },
  ];

  const getClassStats = () => {
    if (!students || students.length === 0) {
      return {
        totalStudents: 0,
        avgAccuracy: 0,
        avgAttendance: 0,
        totalPracticeHours: 0,
        activeToday: 0,
      };
    }

    const totalStudents = students.length;
    const avgAccuracy = Math.round(
      students.reduce((sum, s) => sum + (s.average_accuracy || 0), 0) /
        totalStudents
    );
    const avgAttendance = Math.round(
      students.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) /
        totalStudents
    );
    const totalPracticeHours = Math.round(
      students.reduce((sum, s) => sum + (s.total_practice_minutes || 0), 0) / 60
    );

    // Count students active today (practiced in last 24 hours)
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const activeToday = students.filter((student) =>
      student.recent_practices?.some(
        (practice) => new Date(practice.submitted_at) >= yesterday
      )
    ).length;

    return {
      totalStudents,
      avgAccuracy,
      avgAttendance,
      totalPracticeHours,
      activeToday,
    };
  };

  const stats = getClassStats();

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <ClassPerformanceChart
                  students={students}
                  selectedMetric={selectedMetric}
                />
              </div>
              <div>
                <TopPerformersLeaderboard students={students} />
              </div>
            </div>
          </div>
        );

      case "performance":
        return (
          <div className="space-y-6">
            <TopPerformersLeaderboard
              students={students}
              title="Performance Rankings"
            />
          </div>
        );

      case "distribution":
        return (
          <div className="space-y-6">
            <PerformanceDistribution students={students} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl text-white">Class Analytics</h2>
          <p className="text-gray-300">
            Comprehensive insights into your students&apos; performance and
            engagement
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "overview" && (
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="appearance-none rounded-lg border border-white/20 bg-white/10 py-2 pl-3 pr-8 text-sm text-white focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="all">All Metrics</option>
              <option value="xp">XP</option>
              <option value="attendance">Attendance</option>
              <option value="accuracy">Accuracy</option>
              <option value="practiceTime">Practice Time</option>
              <option value="streak">Streak</option>
            </select>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/10 p-4 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Total Students</p>
              <p className="text-2xl font-bold text-white">
                {stats.totalStudents}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Trophy className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 p-4 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Avg Accuracy</p>
              <p className="text-2xl font-bold text-white">
                {stats.avgAccuracy}%
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 p-4 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Avg Attendance</p>
              <p className="text-2xl font-bold text-white">
                {stats.avgAttendance}%
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <PieChart className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 p-4 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Practice Hours</p>
              <p className="text-2xl font-bold text-white">
                {stats.totalPracticeHours}
              </p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/10 p-4 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Active Today</p>
              <p className="text-2xl font-bold text-white">
                {stats.activeToday}
              </p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <Filter className="w-4 h-4 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="overflow-x-auto border-b border-white/10">
        <nav className="flex min-w-max gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-200 hover:text-white hover:border-gray-600"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-300">Loading analytics...</span>
            </div>
          </div>
        ) : students && students.length > 0 ? (
          renderTabContent()
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No Data Available
              </h3>
              <p className="text-gray-300">
                Add students to see analytics and insights
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
