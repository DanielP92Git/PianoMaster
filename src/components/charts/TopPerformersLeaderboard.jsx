import React, { useState } from "react";
import { Trophy, Star, Target, Clock, Award, TrendingUp } from "lucide-react";

const TopPerformersLeaderboard = ({ students, title = "Top Performers" }) => {
  const [selectedMetric, setSelectedMetric] = useState("points");

  const metrics = [
    { key: "points", label: "Points", icon: Star, color: "text-yellow-500" },
    {
      key: "attendance",
      label: "Attendance",
      icon: Target,
      color: "text-green-500",
    },
    { key: "accuracy", label: "Accuracy", icon: Award, color: "text-blue-500" },
    {
      key: "streak",
      label: "Current Streak",
      icon: TrendingUp,
      color: "text-red-500",
    },
    {
      key: "practiceTime",
      label: "Practice Time",
      icon: Clock,
      color: "text-purple-500",
    },
  ];

  const getRankedStudents = () => {
    if (!students || students.length === 0) return [];

    const sortedStudents = [...students].sort((a, b) => {
      let aValue, bValue;

      switch (selectedMetric) {
        case "points":
          aValue = a.total_points || 0;
          bValue = b.total_points || 0;
          break;
        case "attendance":
          aValue = a.attendance_rate || 0;
          bValue = b.attendance_rate || 0;
          break;
        case "accuracy":
          aValue = a.average_accuracy || 0;
          bValue = b.average_accuracy || 0;
          break;
        case "streak":
          aValue = a.current_streak || 0;
          bValue = b.current_streak || 0;
          break;
        case "practiceTime":
          aValue = a.total_practice_minutes || 0;
          bValue = b.total_practice_minutes || 0;
          break;
        default:
          aValue = a.total_points || 0;
          bValue = b.total_points || 0;
      }

      return bValue - aValue;
    });

    return sortedStudents.map((student, index) => ({
      ...student,
      rank: index + 1,
      value: getStudentValue(student, selectedMetric),
    }));
  };

  const getStudentValue = (student, metric) => {
    switch (metric) {
      case "points":
        return student.total_points || 0;
      case "attendance":
        return `${student.attendance_rate || 0}%`;
      case "accuracy":
        return `${student.average_accuracy || 0}%`;
      case "streak":
        return student.current_streak || 0;
      case "practiceTime":
        const hours = Math.floor((student.total_practice_minutes || 0) / 60);
        const minutes = Math.floor((student.total_practice_minutes || 0) % 60);
        return `${hours}h ${minutes}m`;
      default:
        return 0;
    }
  };

  const getTrophyIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
    return (
      <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-400">
        #{rank}
      </span>
    );
  };

  const currentMetric = metrics.find((m) => m.key === selectedMetric);
  const rankedStudents = getRankedStudents();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          {currentMetric && (
            <currentMetric.icon className={`w-5 h-5 ${currentMetric.color}`} />
          )}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {metrics.map((metric) => (
              <option key={metric.key} value={metric.key}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {rankedStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No student data available
          </div>
        ) : (
          rankedStudents.slice(0, 10).map((student) => (
            <div
              key={
                student.student_id || student.id || `student-${student.rank}`
              }
              className={`flex items-center justify-between p-3 rounded-lg border ${
                student.rank <= 3
                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {getTrophyIcon(student.rank)}
                <div>
                  <div className="font-medium text-gray-900">
                    {student.student_name || "Unknown Student"}
                  </div>
                  <div className="text-sm text-gray-400">
                    {student.email || "No email"}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {student.value}
                </div>
                <div className="text-sm text-gray-400">
                  {currentMetric?.label}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {rankedStudents.length > 10 && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing top 10 of {rankedStudents.length} students
        </div>
      )}
    </div>
  );
};

export default TopPerformersLeaderboard;
