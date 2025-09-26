import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentAssignments } from "../../services/apiStudent";
import {
  FaCalendarAlt as CalendarIcon,
  FaClock as ClockIcon,
  FaCheckCircle as CheckCircleIcon,
  FaExclamationTriangle as ExclamationCircleIcon,
} from "react-icons/fa";

const AssignmentsList = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
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
      return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    }

    if (daysRemaining !== null && daysRemaining < 0) {
      return <ExclamationCircleIcon className="w-4 h-4 text-red-500" />;
    }

    if (daysRemaining !== null && daysRemaining <= 3) {
      return <ExclamationCircleIcon className="w-4 h-4 text-yellow-500" />;
    }

    return <ClockIcon className="w-4 h-4 text-blue-500" />;
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

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Assignments</h3>
          <div className="w-4 h-4 bg-white/20 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  const pendingAssignments = assignments.filter((a) => a.status === "pending");
  const completedAssignments = assignments.filter(
    (a) => a.status === "completed"
  );

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Assignments</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
            {pendingAssignments.length} pending
          </span>
          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
            {completedAssignments.length} completed
          </span>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8">
          <CalendarIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600">No assignments yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
          {assignments.slice(0, 5).map((assignment) => (
            <div
              key={assignment.id}
              className="bg-gray-100 rounded-xl p-4 border border-gray-200 hover:bg-gray-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {assignment.assignment.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {assignment.assignment.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(assignment.status, assignment.daysRemaining)}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${getStatusColor(assignment.status, assignment.daysRemaining)}`}
                  >
                    {getStatusText(assignment.status, assignment.daysRemaining)}
                  </span>
                </div>

                {assignment.assignment.points_possible && (
                  <span className="text-sm text-gray-600">
                    {assignment.points_earned || 0}/
                    {assignment.assignment.points_possible} pts
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {assignments.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate("/assignments")}
            className="w-full text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all {assignments.length} assignments
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignmentsList;
