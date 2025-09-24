import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { Clock, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { practiceTimeService } from "../../services/practiceTimeService";
import { useUser } from "../../features/authentication/useUser";
import Button from "./Button";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";

const PracticeTimeChart = ({ variant = "default" }) => {
  const { user } = useUser();
  const [timeRange, setTimeRange] = useState("daily"); // daily, weekly, monthly
  const [chartType, setChartType] = useState("bar"); // bar, line, area
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id, timeRange]);

  const fetchData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      let chartData;
      const summaryData = await practiceTimeService.getPracticeTimeSummary(
        user.id
      );

      switch (timeRange) {
        case "daily":
          chartData = await practiceTimeService.getDailyPracticeTime(
            user.id,
            30
          );
          break;
        case "weekly":
          chartData = await practiceTimeService.getWeeklyPracticeTime(
            user.id,
            12
          );
          break;
        case "monthly":
          chartData = await practiceTimeService.getMonthlyPracticeTime(
            user.id,
            12
          );
          break;
        default:
          chartData = await practiceTimeService.getDailyPracticeTime(
            user.id,
            30
          );
      }

      setData(chartData);
      setSummary(summaryData);
    } catch (err) {
      console.error("Error fetching practice time data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTooltipValue = (value) => {
    return practiceTimeService.formatDuration(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const formattedValue = formatTooltipValue(value);

      return (
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-lg">
          <p className="text-gray-800 font-medium">{label}</p>
          <p className="text-blue-600 font-semibold">
            <Clock className="inline w-4 h-4 mr-1" />
            {formattedValue}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const chartProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...chartProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="formattedDate"
              stroke="rgba(255,255,255,0.7)"
              fontSize={12}
              angle={timeRange === "daily" ? -45 : 0}
              textAnchor={timeRange === "daily" ? "end" : "middle"}
              height={timeRange === "daily" ? 60 : 40}
            />
            <YAxis
              stroke="rgba(255,255,255,0.7)"
              fontSize={12}
              tickFormatter={formatTooltipValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="duration"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
            />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="formattedDate"
              stroke="rgba(255,255,255,0.7)"
              fontSize={12}
              angle={timeRange === "daily" ? -45 : 0}
              textAnchor={timeRange === "daily" ? "end" : "middle"}
              height={timeRange === "daily" ? 60 : 40}
            />
            <YAxis
              stroke="rgba(255,255,255,0.7)"
              fontSize={12}
              tickFormatter={formatTooltipValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="duration"
              stroke="#3B82F6"
              fill="url(#practiceTimeGradient)"
              strokeWidth={2}
            />
            <defs>
              <linearGradient
                id="practiceTimeGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </AreaChart>
        );

      default: // bar chart
        return (
          <BarChart {...chartProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="formattedDate"
              stroke="rgba(255,255,255,0.7)"
              fontSize={12}
              angle={timeRange === "daily" ? -45 : 0}
              textAnchor={timeRange === "daily" ? "end" : "middle"}
              height={timeRange === "daily" ? 60 : 40}
            />
            <YAxis
              stroke="rgba(255,255,255,0.7)"
              fontSize={12}
              tickFormatter={formatTooltipValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="duration" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Practice Time Tracking
          </h3>
        </div>
        <LoadingState message="Loading practice time data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Practice Time Tracking
          </h3>
        </div>
        <ErrorState
          message="Failed to load practice time data"
          onRetry={fetchData}
        />
      </div>
    );
  }

  const timeRangeButtons = [
    { value: "daily", label: "Daily", icon: Calendar },
    { value: "weekly", label: "Weekly", icon: Calendar },
    { value: "monthly", label: "Monthly", icon: Calendar },
  ];

  const chartTypeButtons = [
    { value: "bar", label: "Bar", icon: BarChart3 },
    { value: "line", label: "Line", icon: TrendingUp },
    { value: "area", label: "Area", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Practice Time Tracking
        </h3>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Time Range Toggle */}
          <div className="flex rounded-lg bg-white/10 p-1">
            {timeRangeButtons.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTimeRange(value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 ${
                  timeRange === value
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex rounded-lg bg-white/10 p-1">
            {chartTypeButtons.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setChartType(value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 ${
                  chartType === value
                    ? "bg-purple-500 text-white shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="text-white/70 text-sm">This Week</div>
            <div className="text-xl font-bold text-white">
              {practiceTimeService.formatDuration(summary.thisWeekTime)}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="text-white/70 text-sm">This Month</div>
            <div className="text-xl font-bold text-white">
              {practiceTimeService.formatDuration(summary.thisMonthTime)}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="text-white/70 text-sm">Daily Average</div>
            <div className="text-xl font-bold text-white">
              {practiceTimeService.formatDuration(summary.averageDailyTime)}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="text-white/70 text-sm">Total Sessions</div>
            <div className="text-xl font-bold text-white">
              {summary.totalSessions}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
        {data.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 text-lg">No practice data yet</p>
            <p className="text-white/50 text-sm">
              Start practicing to see your progress here!
            </p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Additional Insights */}
      {summary && summary.totalSessions > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Practice Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="text-white/70">
              <span className="text-white font-medium">
                Average session:{" "}
                {practiceTimeService.formatDuration(summary.averageSessionTime)}
              </span>
              <br />
              Perfect for building consistent habits!
            </div>
            <div className="text-white/70">
              <span className="text-white font-medium">
                Total practice:{" "}
                {practiceTimeService.formatDuration(summary.totalTime)}
              </span>
              <br />
              Keep up the great work!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeTimeChart;
