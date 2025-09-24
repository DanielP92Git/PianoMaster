import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { Calendar, TrendingUp, Users, Clock } from "lucide-react";

const PracticeActivityTimeline = ({ students }) => {
  const [viewMode, setViewMode] = useState("daily"); // daily, weekly, monthly
  const [chartType, setChartType] = useState("line"); // line, area

  // Generate timeline data based on student practice sessions
  const generateTimelineData = () => {
    if (!students || students.length === 0) return [];

    const now = new Date();
    const data = [];

    // Get date range based on view mode
    const getDaysBack = () => {
      switch (viewMode) {
        case "daily":
          return 30;
        case "weekly":
          return 84; // 12 weeks
        case "monthly":
          return 365; // 12 months
        default:
          return 30;
      }
    };

    const daysBack = getDaysBack();

    // Initialize data points
    for (let i = daysBack; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const dateKey =
        viewMode === "monthly"
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          : date.toISOString().split("T")[0];

      const displayDate =
        viewMode === "monthly"
          ? date.toLocaleDateString("en-GB", {
              month: "short",
              year: "numeric",
            })
          : viewMode === "weekly"
            ? `Week ${Math.ceil((now - date) / (7 * 24 * 60 * 60 * 1000)) + 1}`
            : date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              });

      data.push({
        date: dateKey,
        displayDate,
        totalSessions: 0,
        totalMinutes: 0,
        activeStudents: 0,
        averageAccuracy: 0,
        studentsData: [],
      });
    }

    // Process student practice data
    students.forEach((student) => {
      if (student.recent_practices && Array.isArray(student.recent_practices)) {
        student.recent_practices.forEach((practice) => {
          const practiceDate = new Date(practice.created_at);
          const dateKey =
            viewMode === "monthly"
              ? `${practiceDate.getFullYear()}-${String(practiceDate.getMonth() + 1).padStart(2, "0")}`
              : practiceDate.toISOString().split("T")[0];

          const dataPoint = data.find((d) => d.date === dateKey);
          if (dataPoint) {
            dataPoint.totalSessions++;
            dataPoint.totalMinutes += practice.duration || 0;
            dataPoint.studentsData.push({
              student: student.student_name,
              accuracy: practice.analysis_score || 0,
              duration: practice.duration || 0,
            });
          }
        });
      }
    });

    // Calculate aggregated metrics
    data.forEach((point) => {
      const uniqueStudents = new Set(point.studentsData.map((s) => s.student));
      point.activeStudents = uniqueStudents.size;

      if (point.studentsData.length > 0) {
        point.averageAccuracy = Math.round(
          point.studentsData.reduce((sum, s) => sum + s.accuracy, 0) /
            point.studentsData.length
        );
      }
    });

    return data.filter((d) => d.totalSessions > 0 || viewMode === "daily");
  };

  const timelineData = generateTimelineData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.displayDate}</p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600">
              <span className="font-medium">Sessions:</span>{" "}
              {data.totalSessions}
            </p>
            <p className="text-sm text-green-600">
              <span className="font-medium">Practice Time:</span>{" "}
              {Math.round(data.totalMinutes)} min
            </p>
            <p className="text-sm text-purple-600">
              <span className="font-medium">Active Students:</span>{" "}
              {data.activeStudents}
            </p>
            <p className="text-sm text-orange-600">
              <span className="font-medium">Avg Accuracy:</span>{" "}
              {data.averageAccuracy}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getChartComponent = () => {
    if (chartType === "area") {
      return (
        <AreaChart
          data={timelineData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="displayDate"
            stroke="#64748b"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="totalSessions"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
            name="Practice Sessions"
          />
          <Area
            type="monotone"
            dataKey="activeStudents"
            stackId="2"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
            name="Active Students"
          />
        </AreaChart>
      );
    }

    return (
      <LineChart
        data={timelineData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="displayDate"
          stroke="#64748b"
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="totalSessions"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
          name="Practice Sessions"
        />
        <Line
          type="monotone"
          dataKey="activeStudents"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
          name="Active Students"
        />
        <Line
          type="monotone"
          dataKey="averageAccuracy"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
          name="Avg Accuracy (%)"
        />
      </LineChart>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">
            Practice Activity Timeline
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily (30 days)</option>
            <option value="weekly">Weekly (12 weeks)</option>
            <option value="monthly">Monthly (12 months)</option>
          </select>

          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-600">Total Sessions</span>
          </div>
          <div className="text-2xl font-semibold text-blue-700">
            {timelineData.reduce((sum, d) => sum + d.totalSessions, 0)}
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">Active Students</span>
          </div>
          <div className="text-2xl font-semibold text-green-700">
            {Math.max(...timelineData.map((d) => d.activeStudents), 0)}
          </div>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-purple-600">Total Hours</span>
          </div>
          <div className="text-2xl font-semibold text-purple-700">
            {Math.round(
              timelineData.reduce((sum, d) => sum + d.totalMinutes, 0) / 60
            )}
          </div>
        </div>

        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-600">Avg Accuracy</span>
          </div>
          <div className="text-2xl font-semibold text-orange-700">
            {timelineData.length > 0
              ? Math.round(
                  timelineData.reduce((sum, d) => sum + d.averageAccuracy, 0) /
                    timelineData.length
                )
              : 0}
            %
          </div>
        </div>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          {getChartComponent()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PracticeActivityTimeline;
