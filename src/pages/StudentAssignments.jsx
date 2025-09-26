import React, { useState, useEffect } from "react";
import { getStudentAssignments } from "../services/apiStudent";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt as CalendarIcon,
  FaClock as ClockIcon,
  FaCheckCircle as CheckCircleIcon,
  FaExclamationTriangle as ExclamationCircleIcon,
  FaArrowLeft as ArrowLeftIcon,
  FaFilter as FilterIcon,
  FaSort as SortIcon,
} from "react-icons/fa";

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, completed, overdue
  const [sortBy, setSortBy] = useState("dueDate"); // dueDate, title, status
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await getStudentAssignments();
        setAssignments(data);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const getStatusIcon = (status, daysRemaining) => {
    if (status === "completed") {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }

    if (daysRemaining !== null && daysRemaining < 0) {
      return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
    }

    if (daysRemaining !== null && daysRemaining <= 3) {
      return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
    }

    return <ClockIcon className="w-5 h-5 text-blue-500" />;
  };

  const getStatusText = (status, daysRemaining) => {
    if (status === "completed") {
      return "Completed";
    }

    if (daysRemaining !== null && daysRemaining < 0) {
      return "Overdue";
    }

    if (daysRemaining !== null && daysRemaining <= 3) {
      return `Due in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`;
    }

    if (daysRemaining !== null) {
      return `Due in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`;
    }

    return "No due date";
  };

  const getStatusColor = (status, daysRemaining) => {
    if (status === "completed") {
      return "text-green-500";
    }

    if (daysRemaining !== null && daysRemaining < 0) {
      return "text-red-500";
    }

    if (daysRemaining !== null && daysRemaining <= 3) {
      return "text-yellow-500";
    }

    return "text-blue-500";
  };

  const getAssignmentStatus = (status, daysRemaining) => {
    if (status === "completed") return "completed";
    if (daysRemaining !== null && daysRemaining < 0) return "overdue";
    return "pending";
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === "all") return true;
    const assignmentStatus = getAssignmentStatus(
      assignment.status,
      assignment.daysRemaining
    );
    return assignmentStatus === filter;
  });

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.assignment.title.localeCompare(b.assignment.title);
      case "status":
        const statusA = getAssignmentStatus(a.status, a.daysRemaining);
        const statusB = getAssignmentStatus(b.status, b.daysRemaining);
        return statusA.localeCompare(statusB);
      case "dueDate":
      default:
        // Sort by due date, with overdue first, then by days remaining
        if (a.daysRemaining === null && b.daysRemaining === null) return 0;
        if (a.daysRemaining === null) return 1;
        if (b.daysRemaining === null) return -1;
        return a.daysRemaining - b.daysRemaining;
    }
  });

  const pendingCount = assignments.filter((a) => a.status === "pending").length;
  const completedCount = assignments.filter(
    (a) => a.status === "completed"
  ).length;
  const overdueCount = assignments.filter(
    (a) => a.daysRemaining !== null && a.daysRemaining < 0
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="w-32 h-8 bg-white/20 rounded animate-pulse mb-4"></div>
            <div className="w-48 h-6 bg-white/20 rounded animate-pulse"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6">
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Assignments skeleton */}
          <div className="card p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">My Assignments</h1>
          <p className="text-white/80">
            View and manage all your assignments in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-blue-600">
                  {pendingCount}
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {completedCount}
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {overdueCount}
                </p>
              </div>
              <ExclamationCircleIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Assignments</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <SortIcon className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Showing {sortedAssignments.length} of {assignments.length}{" "}
              assignments
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="card p-6">
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No assignments yet
              </h3>
              <p className="text-gray-600">
                Your assignments will appear here when your teacher creates
                them.
              </p>
            </div>
          ) : sortedAssignments.length === 0 ? (
            <div className="text-center py-12">
              <FilterIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No assignments match your filter
              </h3>
              <p className="text-gray-600">
                Try adjusting your filter to see more assignments.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(
                          assignment.status,
                          assignment.daysRemaining
                        )}
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {assignment.assignment.title}
                        </h3>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {assignment.assignment.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${getStatusColor(assignment.status, assignment.daysRemaining)}`}
                          >
                            {getStatusText(
                              assignment.status,
                              assignment.daysRemaining
                            )}
                          </span>
                        </div>

                        {assignment.assignment.due_date && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              Due:{" "}
                              {new Date(
                                assignment.assignment.due_date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {assignment.assignment.points_possible && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span>
                              {assignment.points_earned || 0}/
                              {assignment.assignment.points_possible} pts
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {assignment.status === "pending" && (
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                        Start Assignment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignments;
