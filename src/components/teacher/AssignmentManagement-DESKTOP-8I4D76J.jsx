import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  BookOpen,
  FileText,
  Target,
  Award,
  Eye,
  Send,
  X,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import { toast } from "react-hot-toast";
import {
  getTeacherAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  updateSubmissionGrade,
} from "../../services/apiTeacher";

// Create Assignment Modal
const CreateAssignmentModal = ({
  isOpen,
  onClose,
  onCreateAssignment,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    assignmentType: "practice",
    dueDate: "",
    pointsPossible: 100,
    requirements: {
      minPracticeSessions: 1,
      minPracticeTime: 30,
      targetAccuracy: 80,
      practiceMode: "any",
    },
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRequirementChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid()) {
      onCreateAssignment(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      instructions: "",
      assignmentType: "practice",
      dueDate: "",
      pointsPossible: 100,
      requirements: {
        minPracticeSessions: 1,
        minPracticeTime: 30,
        targetAccuracy: 80,
        practiceMode: "any",
      },
    });
    onClose();
  };

  const isFormValid = () => {
    return formData.title.trim() && formData.description.trim();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Assignment">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 custom-scrollbar-light"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Assignment Title
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Practice Session Week 1"
              className="w-full"
              variant="solid"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe what students need to accomplish..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) =>
                handleInputChange("instructions", e.target.value)
              }
              placeholder="Detailed instructions for completing the assignment..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Assignment Type
            </label>
            <select
              value={formData.assignmentType}
              onChange={(e) =>
                handleInputChange("assignmentType", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="practice">Practice Session</option>
              <option value="theory">Theory Study</option>
              <option value="performance">Performance</option>
              <option value="composition">Composition</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Due Date
            </label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange("dueDate", e.target.value)}
              className="w-full"
              variant="solid"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Points Possible
            </label>
            <Input
              type="number"
              value={formData.pointsPossible}
              onChange={(e) =>
                handleInputChange("pointsPossible", parseInt(e.target.value))
              }
              min="1"
              max="1000"
              className="w-full"
              variant="solid"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Practice Mode
            </label>
            <select
              value={formData.requirements.practiceMode}
              onChange={(e) =>
                handleRequirementChange("practiceMode", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="any">Any Mode</option>
              <option value="note-recognition">Note Recognition</option>
              <option value="rhythm-master">Rhythm Master</option>
              <option value="sight-reading">Sight Reading</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Min Practice Sessions
            </label>
            <Input
              type="number"
              value={formData.requirements.minPracticeSessions}
              onChange={(e) =>
                handleRequirementChange(
                  "minPracticeSessions",
                  parseInt(e.target.value)
                )
              }
              min="1"
              max="20"
              className="w-full"
              variant="solid"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Min Practice Time (minutes)
            </label>
            <Input
              type="number"
              value={formData.requirements.minPracticeTime}
              onChange={(e) =>
                handleRequirementChange(
                  "minPracticeTime",
                  parseInt(e.target.value)
                )
              }
              min="5"
              max="180"
              className="w-full"
              variant="solid"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Target Accuracy (%)
            </label>
            <Input
              type="number"
              value={formData.requirements.targetAccuracy}
              onChange={(e) =>
                handleRequirementChange(
                  "targetAccuracy",
                  parseInt(e.target.value)
                )
              }
              min="0"
              max="100"
              className="w-full"
              variant="solid"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid() || isLoading}
            loading={isLoading}
          >
            Create Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Assignment Details Modal
const AssignmentDetailsModal = ({
  isOpen,
  onClose,
  assignment,
  submissions,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (!assignment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assignment Details"
      size="large"
    >
      <div className="space-y-6">
        {/* Assignment Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            {assignment.title}
          </h3>
          <p className="text-gray-700 mb-3">{assignment.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-700">Type:</span>
              <p className="font-medium">{assignment.assignment_type}</p>
            </div>
            <div>
              <span className="text-gray-700">Due Date:</span>
              <p className="font-medium">
                {assignment.due_date
                  ? new Date(assignment.due_date).toLocaleDateString()
                  : "No due date"}
              </p>
            </div>
            <div>
              <span className="text-gray-700">Points:</span>
              <p className="font-medium">{assignment.points_possible}</p>
            </div>
            <div>
              <span className="text-gray-700">Submissions:</span>
              <p className="font-medium">{submissions?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Requirements */}
        {assignment.requirements && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Requirements</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {assignment.requirements.minPracticeSessions && (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>
                    {assignment.requirements.minPracticeSessions} sessions
                  </span>
                </div>
              )}
              {assignment.requirements.minPracticeTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{assignment.requirements.minPracticeTime} minutes</span>
                </div>
              )}
              {assignment.requirements.targetAccuracy && (
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>
                    {assignment.requirements.targetAccuracy}% accuracy
                  </span>
                </div>
              )}
              {assignment.requirements.practiceMode &&
                assignment.requirements.practiceMode !== "any" && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>{assignment.requirements.practiceMode}</span>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Submissions */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Student Submissions
          </h4>
          {submissions && submissions.length > 0 ? (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-white border rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {submission.student_name}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {submission.student_email}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(submission.status)}`}
                    >
                      {getStatusIcon(submission.status)}
                      {submission.status.replace("_", " ")}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-700">Progress:</span>
                      <p className="font-medium">
                        {submission.completion_percentage}%
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-700">Sessions:</span>
                      <p className="font-medium">
                        {submission.practice_sessions}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-700">Time:</span>
                      <p className="font-medium">
                        {submission.total_practice_time}m
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-700">Score:</span>
                      <p className="font-medium">
                        {submission.score || "Not graded"}
                      </p>
                    </div>
                  </div>

                  {submission.feedback && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">
                        {submission.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-700">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-500" />
              <p>No submissions yet</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const AssignmentManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);

  const queryClient = useQueryClient();

  // Fetch assignments
  const {
    data: assignments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["teacherAssignments"],
    queryFn: getTeacherAssignments,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherAssignments"] });
      setShowCreateModal(false);
      toast.success("Assignment created successfully!");
    },
    onError: (error) => {
      console.error("Create assignment error:", error);
      toast.error("Failed to create assignment. Please try again.");
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherAssignments"] });
      toast.success("Assignment deleted successfully!");
    },
    onError: (error) => {
      console.error("Delete assignment error:", error);
      toast.error("Failed to delete assignment. Please try again.");
    },
  });

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || assignment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateAssignment = (formData) => {
    createAssignmentMutation.mutate(formData);
  };

  const handleDeleteAssignment = (assignmentId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this assignment? This action cannot be undone."
      )
    ) {
      deleteAssignmentMutation.mutate(assignmentId);
    }
  };

  const handleViewAssignment = async (assignment) => {
    try {
      const submissions = await getAssignmentSubmissions(assignment.id);
      setAssignmentSubmissions(submissions);
      setSelectedAssignment(assignment);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load assignment details.");
    }
  };

  const getAssignmentStatus = (assignment) => {
    const now = new Date();
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;

    if (dueDate && now > dueDate) {
      return "overdue";
    } else if (
      dueDate &&
      now > new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    ) {
      return "due_soon";
    } else {
      return "active";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "due_soon":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-red-600">
            Error loading assignments: {error.message}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Assignment Management</h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={Plus}
          className="whitespace-nowrap"
        >
          Create Assignment
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="all">All Assignments</option>
              <option value="active">Active</option>
              <option value="due_soon">Due Soon</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Assignments List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          My Assignments ({filteredAssignments.length})
        </h3>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-8 text-gray-200">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-white">No assignments found</p>
            <p className="text-sm text-gray-300">
              Create your first assignment to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-4 custom-scrollbar">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">
                        {assignment.title}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getAssignmentStatus(assignment))}`}
                      >
                        {getAssignmentStatus(assignment).replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">
                      {assignment.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {assignment.due_date
                            ? `Due: ${new Date(assignment.due_date).toLocaleDateString()}`
                            : "No due date"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        <span>{assignment.points_possible} points</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {assignment.submission_count || 0} submissions
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => handleViewAssignment(assignment)}
                      icon={Eye}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      icon={Trash2}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreateAssignmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateAssignment={handleCreateAssignment}
        isLoading={createAssignmentMutation.isPending}
      />

      <AssignmentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        assignment={selectedAssignment}
        submissions={assignmentSubmissions}
      />
    </div>
  );
};

export default AssignmentManagement;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       