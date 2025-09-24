import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ClassPerformanceChart = ({ students, selectedMetric = "all" }) => {
  // Transform student data for chart display
  const chartData =
    students?.map((student) => ({
      name: student.student_name || "Unknown",
      points: student.total_points || 0,
      attendance: student.attendance_rate || 0,
      accuracy: student.average_accuracy || 0,
      practiceTime: Math.round(student.total_practice_minutes || 0), // Already in minutes
      streak: student.current_streak || 0,
    })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === "attendance" || entry.dataKey === "accuracy"
                ? "%"
                : ""}
              {entry.dataKey === "practiceTime" ? " min" : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getChartConfig = () => {
    switch (selectedMetric) {
      case "points":
        return {
          bars: [{ dataKey: "points", fill: "#3b82f6", name: "Points" }],
        };
      case "attendance":
        return {
          bars: [
            { dataKey: "attendance", fill: "#10b981", name: "Attendance %" },
          ],
        };
      case "accuracy":
        return {
          bars: [{ dataKey: "accuracy", fill: "#f59e0b", name: "Accuracy %" }],
        };
      case "practiceTime":
        return {
          bars: [
            {
              dataKey: "practiceTime",
              fill: "#8b5cf6",
              name: "Practice Time (min)",
            },
          ],
        };
      case "streak":
        return {
          bars: [
            { dataKey: "streak", fill: "#ef4444", name: "Current Streak" },
          ],
        };
      default:
        return {
          bars: [
            { dataKey: "points", fill: "#3b82f6", name: "Points" },
            { dataKey: "attendance", fill: "#10b981", name: "Attendance %" },
            { dataKey: "accuracy", fill: "#f59e0b", name: "Accuracy %" },
          ],
        };
    }
  };

  const { bars } = getChartConfig();

  return (
    <div className="w-full h-96 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Class Performance Overview
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {bars.map((bar, index) => (
            <Bar
              key={index}
              dataKey={bar.dataKey}
              fill={bar.fill}
              name={bar.name}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClassPerformanceChart;
