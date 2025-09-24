import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Target, Award, TrendingUp, Users } from "lucide-react";

const PerformanceDistribution = ({ students }) => {
  const [selectedView, setSelectedView] = useState("performance"); // performance, attendance, accuracy, streak

  const getPerformanceLevel = (student) => {
    const attendance = student.attendance_rate || 0;
    const accuracy = student.average_accuracy || 0;
    const streak = student.current_streak || 0;

    // Composite score: attendance (40%) + accuracy (40%) + streak (20%)
    const score =
      attendance * 0.4 +
      accuracy * 0.4 +
      (Math.min(streak, 30) * 0.2 * 100) / 30;

    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Help";
  };

  const getAttendanceCategory = (rate) => {
    if (rate >= 80) return "Excellent (80%+)";
    if (rate >= 60) return "Good (60-79%)";
    if (rate >= 40) return "Fair (40-59%)";
    return "Poor (<40%)";
  };

  const getAccuracyCategory = (accuracy) => {
    if (accuracy >= 90) return "Excellent (90%+)";
    if (accuracy >= 75) return "Good (75-89%)";
    if (accuracy >= 60) return "Fair (60-74%)";
    return "Needs Work (<60%)";
  };

  const getStreakCategory = (streak) => {
    if (streak >= 14) return "High (14+ days)";
    if (streak >= 7) return "Medium (7-13 days)";
    if (streak >= 3) return "Low (3-6 days)";
    return "None (0-2 days)";
  };

  const generateDistributionData = () => {
    if (!students || students.length === 0) return [];

    const distribution = {};

    students.forEach((student) => {
      let category;

      switch (selectedView) {
        case "performance":
          category = getPerformanceLevel(student);
          break;
        case "attendance":
          category = getAttendanceCategory(student.attendance_rate || 0);
          break;
        case "accuracy":
          category = getAccuracyCategory(student.average_accuracy || 0);
          break;
        case "streak":
          category = getStreakCategory(student.current_streak || 0);
          break;
        default:
          category = "Unknown";
      }

      distribution[category] = (distribution[category] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / students.length) * 100),
    }));
  };

  const getColors = () => {
    switch (selectedView) {
      case "performance":
        return {
          Excellent: "#10b981",
          Good: "#3b82f6",
          Fair: "#f59e0b",
          "Needs Help": "#ef4444",
        };
      case "attendance":
        return {
          "Excellent (80%+)": "#10b981",
          "Good (60-79%)": "#3b82f6",
          "Fair (40-59%)": "#f59e0b",
          "Poor (<40%)": "#ef4444",
        };
      case "accuracy":
        return {
          "Excellent (90%+)": "#10b981",
          "Good (75-89%)": "#3b82f6",
          "Fair (60-74%)": "#f59e0b",
          "Needs Work (<60%)": "#ef4444",
        };
      case "streak":
        return {
          "High (14+ days)": "#10b981",
          "Medium (7-13 days)": "#3b82f6",
          "Low (3-6 days)": "#f59e0b",
          "None (0-2 days)": "#ef4444",
        };
      default:
        return {};
    }
  };

  const distributionData = generateDistributionData();
  const colors = getColors();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-400">
            {data.value} students ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    value,
    percentage,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  const getViewConfig = () => {
    switch (selectedView) {
      case "performance":
        return {
          title: "Overall Performance Distribution",
          icon: Target,
          color: "text-blue-500",
        };
      case "attendance":
        return {
          title: "Attendance Rate Distribution",
          icon: Users,
          color: "text-green-500",
        };
      case "accuracy":
        return {
          title: "Accuracy Level Distribution",
          icon: Award,
          color: "text-purple-500",
        };
      case "streak":
        return {
          title: "Practice Streak Distribution",
          icon: TrendingUp,
          color: "text-orange-500",
        };
      default:
        return {
          title: "Distribution",
          icon: Target,
          color: "text-gray-400",
        };
    }
  };

  const viewConfig = getViewConfig();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <viewConfig.icon className={`w-5 h-5 ${viewConfig.color}`} />
          <h3 className="text-lg font-medium text-gray-900">
            {viewConfig.title}
          </h3>
        </div>

        <select
          value={selectedView}
          onChange={(e) => setSelectedView(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="performance">Overall Performance</option>
          <option value="attendance">Attendance Rate</option>
          <option value="accuracy">Accuracy Level</option>
          <option value="streak">Practice Streak</option>
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Chart */}
        <div className="flex-1">
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[entry.name] || "#64748b"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistics */}
        <div className="lg:w-80">
          <h4 className="text-sm font-medium text-gray-400 mb-4">
            Distribution Summary
          </h4>
          <div className="space-y-3">
            {distributionData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: colors[item.name] || "#64748b" }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {item.value}
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Students */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">
                Total Students
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {students?.length || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDistribution;
