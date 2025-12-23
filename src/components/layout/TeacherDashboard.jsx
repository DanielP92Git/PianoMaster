import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import {
  getTeacherStudents,
  addStudentToTeacher,
  getStudentProgress,
  sendStudentMessage,
  removeStudentFromTeacher,
  removeMultipleStudentsFromTeacher,
  updateStudentDetails,
} from "../../services/apiTeacher";
import {
  Search,
  UserPlus,
  MessageCircle,
  TrendingUp,
  Trash2,
  CheckSquare,
  Square,
  Edit3,
  Star,
  Calendar,
  Zap,
  Clock,
  BarChart3,
  Target,
  Award,
  Users,
  PieChart,
  Headphones,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  X,
  ChevronDown,
  FileText,
  Bell,
  Gamepad2,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import AnalyticsDashboard from "../charts/AnalyticsDashboard";
import RecordingsReview from "../teacher/RecordingsReview";
import AssignmentManagement from "../teacher/AssignmentManagement";
import NotificationCenter from "../teacher/NotificationCenter";
import { useTeacherRecordingNotifications } from "../../hooks/useTeacherRecordingNotifications";
import { useUser } from "../../features/authentication/useUser";
import {
  getAchievementPointsTotal,
  getStudentScores,
} from "../../services/apiDatabase";
import { calculateGameplayPoints } from "../../utils/points";

import { toast } from "react-hot-toast";

// Dedicated modal component for adding students with multi-step form
const AddStudentModal = ({ isOpen, onClose, onAddStudent, isLoading }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    level: "",
    studyingYear: "",
    startDate: "",
  });

  const isValidDate = (dateString) => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);
    if (!match) return false;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Basic validation
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;

    // Check for valid date
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const convertDateFormat = (dateString) => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(regex);
    if (!match) return dateString;

    const day = match[1];
    const month = match[2];
    const year = match[3];

    return `${year}-${month}-${day}`;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid()) {
      const formattedData = {
        ...formData,
        startDate: convertDateFormat(formData.startDate), // Convert DD/MM/YYYY to YYYY-MM-DD
      };
      onAddStudent(formattedData);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      level: "",
      studyingYear: "",
      startDate: "",
    });
    onClose();
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      formData.level.trim() &&
      formData.studyingYear.trim() &&
      formData.startDate.trim() &&
      isValidDate(formData.startDate)
    );
  };

  const isCurrentStepValid = () => {
    switch (step) {
      case 1:
        return formData.firstName.trim() && formData.lastName.trim();
      case 2:
        return formData.level.trim();
      case 3:
        return formData.studyingYear.trim();
      case 4:
        return formData.email.trim();
      case 5:
        return formData.startDate.trim() && isValidDate(formData.startDate);
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                First Name
              </label>
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="John"
                variant="solid"
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Doe"
                variant="solid"
                className="w-full"
                required
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Level
              </label>
              <select
                value={formData.level}
                onChange={(e) => handleInputChange("level", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                required
              >
                <option value="">Select Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Elementary">Elementary</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Studying Year
              </label>
              <select
                value={formData.studyingYear}
                onChange={(e) =>
                  handleInputChange("studyingYear", e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                required
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
                <option value="6th Year">6th Year</option>
              </select>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="student@example.com"
                variant="solid"
                className="w-full"
                required
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="text"
                value={formData.startDate}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
                  if (value.length >= 3) {
                    value = value.substring(0, 2) + "/" + value.substring(2);
                  }
                  if (value.length >= 6) {
                    value = value.substring(0, 5) + "/" + value.substring(5, 9);
                  }
                  handleInputChange("startDate", value);
                }}
                placeholder="DD/MM/YYYY"
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                When did this student start studying with you?
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Student Name";
      case 2:
        return "Level";
      case 3:
        return "Studying Year";
      case 4:
        return "Email";
      case 5:
        return "Start Date";
      default:
        return "Add Student";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      variant="default"
      size="default"
      className="border-gray-600 bg-gray-900"
    >
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Add New Student - {getStepTitle()}
          </h3>
          <div className="text-sm text-gray-600">Step {step} of 5</div>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span>Name</span>
            <span>Level</span>
            <span>Year</span>
            <span>Email</span>
            <span>Start</span>
          </div>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded ${
                  i <= step ? "bg-blue-500" : "bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {renderStep()}

          <div className="flex justify-between gap-3">
            <div>
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              {step < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isCurrentStepValid()}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={!isFormValid() || isLoading}>
                  {isLoading ? "Adding..." : "Add Student"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// Dedicated modal component for editing students
const EditStudentModal = ({
  isOpen,
  onClose,
  student,
  onUpdateStudent,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    level: "",
    studyingYear: "",
    startDate: "",
    phoneNumber: "",
    parentEmail: "",
    parentPhone: "",
    instrument: "",
    goals: "",
    notes: "",
    isActive: true,
  });

  // Update form data when student prop changes
  React.useEffect(() => {
    if (student) {
      // Extract first and last name from student_name if individual names aren't available
      const nameParts = student.student_name
        ? student.student_name.split(" ")
        : ["", ""];
      const firstName = student.first_name || nameParts[0] || "";
      const lastName = student.last_name || nameParts.slice(1).join(" ") || "";

      setFormData({
        firstName,
        lastName,
        email: student.email || "",
        level: student.level || "",
        studyingYear: student.studying_year || "",
        startDate: student.member_since
          ? new Date(student.member_since).toISOString().split("T")[0]
          : "",
        phoneNumber: student.phone_number || "",
        parentEmail: student.parent_email || "",
        parentPhone: student.parent_phone || "",
        instrument: student.instrument || "",
        goals: student.goals || "",
        notes: student.notes || "",
        isActive: student.is_active !== false,
      });
    }
  }, [student]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid()) {
      onUpdateStudent(student.student_id, formData);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      level: "",
      studyingYear: "",
      startDate: "",
      phoneNumber: "",
      parentEmail: "",
      parentPhone: "",
      instrument: "",
      goals: "",
      notes: "",
      isActive: true,
    });
    setActiveTab("basic");
    onClose();
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim() &&
      formData.level.trim() &&
      formData.studyingYear.trim()
    );
  };

  const tabs = [
    { id: "basic", name: "Basic Info", icon: "👤" },
    { id: "contact", name: "Contact", icon: "📞" },
    { id: "learning", name: "Learning", icon: "🎵" },
    { id: "account", name: "Account", icon: "⚙️" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      variant="default"
      size="large"
      className="border-gray-600 bg-gray-900"
    >
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            Edit Student Profile
          </h3>
          <div
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              formData.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {formData.isActive ? "Active" : "Archived"}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex space-x-1 rounded-lg bg-gray-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="John"
                    variant="solid"
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Doe"
                    variant="solid"
                    className="w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="student@example.com"
                  variant="solid"
                  className="w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleInputChange("level", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                    required
                  >
                    <option value="">Select Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Elementary">Elementary</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Studying Year *
                  </label>
                  <select
                    value={formData.studyingYear}
                    onChange={(e) =>
                      handleInputChange("studyingYear", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                    <option value="6th Year">6th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  variant="solid"
                  className="w-full"
                  placeholder="When did this student start studying with you?"
                />
                <p className="mt-1 text-xs text-gray-500">
                  When did this student start studying with you?
                </p>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Student Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  placeholder="+1 (555) 123-4567"
                  variant="solid"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Parent/Guardian Email
                  </label>
                  <Input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) =>
                      handleInputChange("parentEmail", e.target.value)
                    }
                    placeholder="parent@example.com"
                    variant="solid"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Parent/Guardian Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) =>
                      handleInputChange("parentPhone", e.target.value)
                    }
                    placeholder="+1 (555) 987-6543"
                    variant="solid"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Learning Tab */}
          {activeTab === "learning" && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Primary Instrument
                </label>
                <select
                  value={formData.instrument}
                  onChange={(e) =>
                    handleInputChange("instrument", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                >
                  <option value="">Select Instrument</option>
                  <option value="Piano">Piano</option>
                  <option value="Guitar">Guitar</option>
                  <option value="Violin">Violin</option>
                  <option value="Drums">Drums</option>
                  <option value="Voice">Voice</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Learning Goals
                </label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => handleInputChange("goals", e.target.value)}
                  placeholder="What does this student want to achieve?"
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Teacher Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Private notes about this student's progress, challenges, preferences..."
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Account Status
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="accountStatus"
                      checked={formData.isActive === true}
                      onChange={() => handleInputChange("isActive", true)}
                      className="mr-2"
                    />
                    <span className="text-gray-700">
                      Active - Student can access the platform
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="accountStatus"
                      checked={formData.isActive === false}
                      onChange={() => handleInputChange("isActive", false)}
                      className="mr-2"
                    />
                    <span className="text-gray-700">
                      Archived - Student account is suspended
                    </span>
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-2 font-medium text-blue-900">
                  Account Actions
                </h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• Archiving a student will prevent them from logging in</p>
                  <p>• Their practice data and progress will be preserved</p>
                  <p>• You can reactivate the account at any time</p>
                  <p>
                    • Archived students won't appear in active student lists
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid() || isLoading}>
              {isLoading ? "Updating..." : "Update Student"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// Dedicated modal component for delete confirmation
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  studentsToDelete,
  onConfirmDelete,
  isLoading,
}) => {
  const isMultiple = studentsToDelete && studentsToDelete.length > 1;
  const studentNames = studentsToDelete?.map((s) => s.student_name).join(", ");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="default"
      size="default"
      className="border-gray-600 bg-gray-900"
    >
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {isMultiple ? "Delete Students" : "Delete Student"}
            </h3>
            <p className="text-sm font-medium text-gray-600">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-base leading-relaxed text-gray-100">
            {isMultiple
              ? `Are you sure you want to remove ${studentsToDelete.length} students from your class?`
              : `Are you sure you want to remove ${studentNames} from your class?`}
          </p>
          {isMultiple && (
            <div className="custom-scrollbar mt-4 max-h-32 overflow-y-auto">
              <p className="mb-2 text-sm font-medium text-gray-200">
                Students to be removed:
              </p>
              <ul className="space-y-1 text-sm text-gray-100">
                {studentsToDelete.map((student) => (
                  <li
                    key={student.student_id}
                    className="flex items-center gap-2"
                  >
                    <div className="h-2 w-2 rounded-full bg-red-400"></div>
                    {student.student_name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={onConfirmDelete}
            disabled={isLoading}
          >
            {isLoading
              ? "Removing..."
              : `Remove ${isMultiple ? "Students" : "Student"}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Dedicated modal component for sending messages
const SendMessageModal = ({
  isOpen,
  onClose,
  student,
  onSendMessage,
  isLoading,
}) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(student.student_id, message.trim());
    }
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      variant="default"
      size="default"
      className="border-gray-600 bg-gray-900"
    >
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Send Message to {student?.student_name}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Great job on your practice today!"
              className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!message.trim() || isLoading}>
              {isLoading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const StudentDetailModal = ({
  isOpen,
  onClose,
  student,
  calculateAttendanceRate,
  getRecentActivitySummary,
  getPerformanceLevel,
}) => {
  const studentId = student?.student_id ?? null;

  // Game history source of truth: students_score (grouped by game_type).
  // Note: teacher visibility depends on Supabase RLS policies allowing teachers to read connected students’ rows.
  const {
    data: studentScores = [],
    isLoading: isStudentScoresLoading,
    error: studentScoresError,
  } = useQuery({
    queryKey: ["teacher-student-scores", studentId ?? "none"],
    queryFn: () => getStudentScores(studentId),
    enabled: Boolean(isOpen && studentId),
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const gameplayPoints = useMemo(() => {
    return calculateGameplayPoints(studentScores);
  }, [studentScores]);

  const {
    data: studentAchievementPoints = 0,
    isLoading: isStudentAchievementPointsLoading,
    error: studentAchievementPointsError,
  } = useQuery({
    queryKey: ["teacher-student-achievement-points", studentId ?? "none"],
    queryFn: () => getAchievementPointsTotal(studentId),
    enabled: Boolean(isOpen && studentId),
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const achievementPoints =
    studentAchievementPointsError && typeof student?.total_points === "number"
      ? Math.max((student.total_points || 0) - gameplayPoints, 0)
      : studentAchievementPoints || 0;

  const normalizeGameTypeKey = useCallback((value) => {
    const raw = String(value || "").trim();
    if (!raw) return "unknown";
    return raw.toLowerCase().replace(/[-\s]+/g, "_");
  }, []);

  const prettyGameType = useMemo(() => {
    return (value) => {
      const raw = String(value || "").trim();
      if (!raw) return "Unknown";
      const normalized = normalizeGameTypeKey(raw);
      const special = {
        note_recognition: "Note Recognition",
        notes_recognition: "Note Recognition",
        sight_reading: "Sight Reading",
        notes_master: "Notes Master",
        notes_reading: "Notes Master",
        rhythm_master: "Rhythm Master",
        rhythm_games: "Rhythm Games",
      };
      if (special[normalized]) return special[normalized];
      return normalized
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    };
  }, [normalizeGameTypeKey]);

  const scoresByGameType = useMemo(() => {
    const grouped = {};
    (studentScores || []).forEach((row) => {
      const rawType = row?.game_type || row?.game?.type || row?.game?.name;
      const gameTypeKey = normalizeGameTypeKey(rawType);
      if (!grouped[gameTypeKey]) {
        grouped[gameTypeKey] = {
          gameType: gameTypeKey,
          label: prettyGameType(rawType),
          entries: [],
        };
      }
      grouped[gameTypeKey].entries.push(row);
      // Prefer a specific game name if present (joined `game:games(*)`)
      const name = row?.game?.name;
      if (typeof name === "string" && name.trim()) {
        grouped[gameTypeKey].label = name.trim();
      }
    });

    // Ensure entries are sorted newest-first
    Object.values(grouped).forEach((group) => {
      group.entries.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    });

    return grouped;
  }, [studentScores, prettyGameType, normalizeGameTypeKey]);

  const gameTypeGroups = useMemo(() => {
    const groups = Object.values(scoresByGameType);
    groups.sort((a, b) => (b.entries?.length || 0) - (a.entries?.length || 0));
    return groups;
  }, [scoresByGameType]);

  // Extract first gameType for stable dependency
  const firstGameType = useMemo(() => {
    return gameTypeGroups.length > 0 ? gameTypeGroups[0]?.gameType : null;
  }, [gameTypeGroups]);

  const [openGameType, setOpenGameType] = useState(null);

  // Reset openGameType when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOpenGameType(null);
    }
  }, [isOpen]);

  // Set default game type when modal opens and data is available
  useEffect(() => {
    if (!isOpen || openGameType || !firstGameType) return;
    // When modal opens or data loads, default to the first available game type.
    setOpenGameType(firstGameType);
  }, [isOpen, openGameType, firstGameType]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Keep hook call order stable; only gate rendering after hooks.
  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${student.student_name} - Detailed View`}
      size="large"
    >
      <div className="custom-scrollbar max-h-[80vh] space-y-6 overflow-y-auto">
        {/* Header Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Total Points
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {(student.total_points || 0).toLocaleString()}
            </p>
            <p className="text-xs text-blue-800/80">
              (
              {isStudentAchievementPointsLoading
                ? "…"
                : achievementPoints.toLocaleString()}{" "}
              achievements / {gameplayPoints.toLocaleString()} games)
            </p>
          </div>

          <div className="rounded-lg bg-orange-50 p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">
                Current Streak
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {student.current_streak || 0} days
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Avg. Accuracy
              </span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {student.average_accuracy || 0}%
            </p>
          </div>

          <div className="rounded-lg bg-purple-50 p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                Practice Time
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {formatDuration(student.total_practice_minutes || 0)}
            </p>
          </div>
        </div>

        {/* Student Information */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Student Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-900">{student.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Level</label>
              <p className="text-gray-900">{student.level || "Beginner"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Studying Year
              </label>
              <p className="text-gray-900">{student.studying_year || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Started
              </label>
              <p className="text-gray-900">{student.member_since}</p>
            </div>
          </div>
        </Card>

        {/* Performance Overview */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Performance Overview
          </h3>

          <div className="space-y-4">
            {/* Performance Level */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Performance Level
              </span>
              <div
                className={`rounded-full px-3 py-1 text-sm font-medium ${getPerformanceLevel(student).bgColor} ${getPerformanceLevel(student).color}`}
              >
                {getPerformanceLevel(student).level}
              </div>
            </div>

            {/* Attendance Rate */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Attendance Rate (30 days)
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {calculateAttendanceRate(student)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    calculateAttendanceRate(student) >= 80
                      ? "bg-green-500"
                      : calculateAttendanceRate(student) >= 60
                        ? "bg-blue-500"
                        : calculateAttendanceRate(student) >= 40
                          ? "bg-yellow-500"
                          : "bg-red-500"
                  }`}
                  style={{ width: `${calculateAttendanceRate(student)}%` }}
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Recent Activity
              </span>
              <span
                className={`text-sm font-medium ${getRecentActivitySummary(student).color}`}
              >
                {getRecentActivitySummary(student).text}
              </span>
            </div>
          </div>
        </Card>

        {/* Games Played */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Games Played
          </h3>

          {isStudentScoresLoading ? (
            <div className="py-6 text-center text-gray-500">
              Loading scores…
            </div>
          ) : studentScoresError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Couldn&apos;t load game history for this student.
            </div>
          ) : gameTypeGroups.length === 0 ? (
            <div className="py-8 text-center">
              <Gamepad2 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">No game scores recorded yet</p>
            </div>
          ) : (
            <>
              {/* Game type toggles */}
              <div className="mb-4 flex flex-wrap gap-2">
                {gameTypeGroups.map((group) => {
                  const isActive = openGameType === group.gameType;
                  return (
                    <button
                      key={group.gameType}
                      type="button"
                      onClick={() =>
                        setOpenGameType((prev) =>
                          prev === group.gameType ? null : group.gameType
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                        isActive
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                      title={group.label}
                    >
                      {group.label}{" "}
                      <span className="text-gray-500">
                        ({group.entries?.length || 0})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active game type history */}
              {openGameType ? (
                <div className="custom-scrollbar max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                  {(scoresByGameType[openGameType]?.entries || []).map(
                    (row) => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {formatDate(row.created_at)}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {row?.game?.name?.trim?.()
                              ? row.game.name.trim()
                              : prettyGameType(row.game_type)}
                          </p>
                        </div>
                        <div className="ml-3 flex flex-shrink-0 items-baseline gap-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {Math.round(row.score || 0)}
                          </span>
                          <span className="text-xs text-gray-500">pts</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Select a game type to view the student&apos;s plays.
                </div>
              )}
            </>
          )}
        </Card>

        {/* Recording History (teacher review timeline) */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Recent Recordings (for review)
          </h3>

          {student.recent_recordings && student.recent_recordings.length > 0 ? (
            <div className="space-y-3">
              {student.recent_recordings.map((practice, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(practice.submitted_at)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDuration(practice.duration || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">No recordings submitted yet</p>
            </div>
          )}
        </Card>
      </div>
    </Modal>
  );
};

const TeacherDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [studentForDetail, setStudentForDetail] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentsToDelete, setStudentsToDelete] = useState([]);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { newRecordingsCount } = useTeacherRecordingNotifications(user?.id);

  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleChange = () => setIsMobileView(mediaQuery.matches);

    handleChange();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Determine active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/analytics")) return "analytics";
    if (path.includes("/recordings")) return "recordings";
    if (path.includes("/assignments")) return "assignments";
    if (path.includes("/notifications")) return "notifications";
    return "students"; // default tab
  };

  const activeTab = getActiveTab();

  // Filtering and sorting state
  const [filters, setFilters] = useState({
    performanceLevel: "all",
    activityStatus: "all",
    attendanceRange: "all",
    streakRange: "all",
    pointsRange: "all",
    level: "all",
  });
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const queryClient = useQueryClient();

  // Fetch teacher's students with real-time updates
  const {
    data: students = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["teacher-students"],
    queryFn: getTeacherStudents,
    refetchInterval: 120000, // Poll every 2 minutes (reduced from 30 seconds)
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  // Note: Real-time subscriptions removed due to RLS policy issues
  // The dashboard uses polling (refetchInterval: 30000) for updates instead

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: addStudentToTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries(["teacher-students"]);
      toast.success("Student added successfully!");
      setShowAddStudentModal(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add student");
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ studentId, message }) =>
      sendStudentMessage(studentId, message),
    onSuccess: () => {
      toast.success("Message sent!");
      setShowSendMessageModal(false);
      setSelectedStudent(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: removeStudentFromTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries(["teacher-students"]);
      toast.success("Student removed successfully!");
      setShowDeleteModal(false);
      setStudentsToDelete([]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove student");
    },
  });

  // Delete multiple students mutation
  const deleteMultipleStudentsMutation = useMutation({
    mutationFn: removeMultipleStudentsFromTeacher,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["teacher-students"]);
      toast.success(data.message);
      setShowDeleteModal(false);
      setStudentsToDelete([]);
      setSelectedStudents([]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove students");
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: ({ studentId, updates }) =>
      updateStudentDetails(studentId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["teacher-students"]);
      toast.success(data.message);
      setShowEditModal(false);
      setStudentToEdit(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update student");
    },
  });

  // Helper function to calculate attendance rate
  const calculateAttendanceRate = React.useCallback((student) => {
    if (!student.recent_practices || student.recent_practices.length === 0) {
      return 0;
    }

    // Calculate attendance based on practice frequency over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPractices = student.recent_practices.filter(
      (practice) => new Date(practice.submitted_at) >= thirtyDaysAgo
    );

    // Expected practices = 4 per week for 4+ weeks = ~16 sessions in 30 days
    const expectedPractices = 16;
    const actualPractices = recentPractices.length;

    return Math.min(
      Math.round((actualPractices / expectedPractices) * 100),
      100
    );
  }, []);

  // Helper function to get recent activity summary
  const getRecentActivitySummary = React.useCallback((student) => {
    if (!student.recent_practices || student.recent_practices.length === 0) {
      return { text: "No recent activity", color: "text-gray-400" };
    }

    const latestPractice = student.recent_practices[0];
    const daysSinceLastPractice = Math.floor(
      (new Date() - new Date(latestPractice.submitted_at)) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastPractice === 0) {
      return { text: "Practiced today", color: "text-green-400" };
    } else if (daysSinceLastPractice === 1) {
      return { text: "Practiced yesterday", color: "text-green-300" };
    } else if (daysSinceLastPractice <= 3) {
      return {
        text: `Practiced ${daysSinceLastPractice} days ago`,
        color: "text-yellow-400",
      };
    } else if (daysSinceLastPractice <= 7) {
      return {
        text: `Practiced ${daysSinceLastPractice} days ago`,
        color: "text-orange-400",
      };
    } else {
      return {
        text: `Last practice: ${daysSinceLastPractice} days ago`,
        color: "text-red-400",
      };
    }
  }, []);

  // Helper function to get performance level
  const getPerformanceLevel = React.useCallback(
    (student) => {
      const attendance = calculateAttendanceRate(student);
      const accuracy = student.average_accuracy || 0;
      const streak = student.current_streak || 0;

      // Simple scoring algorithm
      const score =
        attendance * 0.4 + accuracy * 0.4 + Math.min(streak, 30) * 0.2 * 3.33;

      if (score >= 80)
        return {
          level: "Excellent",
          color: "text-green-400",
          bgColor: "bg-green-500/20",
        };
      if (score >= 60)
        return {
          level: "Good",
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
        };
      if (score >= 40)
        return {
          level: "Fair",
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
        };
      return {
        level: "Needs Help",
        color: "text-red-400",
        bgColor: "bg-red-500/20",
      };
    },
    [calculateAttendanceRate]
  );

  // Filter and sort students based on search and filters
  const filteredAndSortedStudents = React.useMemo(() => {
    let filtered = students.filter((student) => {
      // Search filter
      const matchesSearch =
        student.student_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Performance level filter
      if (filters.performanceLevel !== "all") {
        const perfLevel = getPerformanceLevel(student).level.toLowerCase();
        if (perfLevel !== filters.performanceLevel) return false;
      }

      // Activity status filter
      if (filters.activityStatus !== "all") {
        const daysSinceLastPractice =
          student.recent_practices?.length > 0
            ? Math.floor(
                (new Date() -
                  new Date(student.recent_practices[0].submitted_at)) /
                  (1000 * 60 * 60 * 24)
              )
            : 999;

        switch (filters.activityStatus) {
          case "today":
            if (daysSinceLastPractice > 0) return false;
            break;
          case "week":
            if (daysSinceLastPractice > 7) return false;
            break;
          case "inactive":
            if (daysSinceLastPractice <= 7) return false;
            break;
        }
      }

      // Attendance range filter
      if (filters.attendanceRange !== "all") {
        const attendance = calculateAttendanceRate(student);
        switch (filters.attendanceRange) {
          case "high":
            if (attendance < 80) return false;
            break;
          case "medium":
            if (attendance < 60 || attendance >= 80) return false;
            break;
          case "low":
            if (attendance >= 60) return false;
            break;
        }
      }

      // Streak range filter
      if (filters.streakRange !== "all") {
        const streak = student.current_streak || 0;
        switch (filters.streakRange) {
          case "high":
            if (streak < 10) return false;
            break;
          case "medium":
            if (streak < 5 || streak >= 10) return false;
            break;
          case "low":
            if (streak >= 5) return false;
            break;
        }
      }

      // Points range filter
      if (filters.pointsRange !== "all") {
        const points = student.total_points || 0;
        switch (filters.pointsRange) {
          case "high":
            if (points < 1000) return false;
            break;
          case "medium":
            if (points < 500 || points >= 1000) return false;
            break;
          case "low":
            if (points >= 500) return false;
            break;
        }
      }

      // Level filter
      if (filters.level !== "all") {
        if (student.level?.toLowerCase() !== filters.level) return false;
      }

      return true;
    });

    // Sort students
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.student_name?.toLowerCase() || "";
          bValue = b.student_name?.toLowerCase() || "";
          break;
        case "points":
          aValue = a.total_points || 0;
          bValue = b.total_points || 0;
          break;
        case "streak":
          aValue = a.current_streak || 0;
          bValue = b.current_streak || 0;
          break;
        case "attendance":
          aValue = calculateAttendanceRate(a);
          bValue = calculateAttendanceRate(b);
          break;
        case "lastPractice":
          aValue =
            a.recent_practices?.length > 0
              ? new Date(a.recent_practices[0].submitted_at)
              : new Date(0);
          bValue =
            b.recent_practices?.length > 0
              ? new Date(b.recent_practices[0].submitted_at)
              : new Date(0);
          break;
        case "accuracy":
          aValue = a.average_accuracy || 0;
          bValue = b.average_accuracy || 0;
          break;
        default:
          aValue = a.student_name?.toLowerCase() || "";
          bValue = b.student_name?.toLowerCase() || "";
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    students,
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    calculateAttendanceRate,
    getPerformanceLevel,
  ]);

  // For backward compatibility
  const filteredStudents = filteredAndSortedStudents;

  // Calculate summary statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(
    (s) => s.total_practice_minutes > 0
  ).length;
  const averageAccuracy =
    students.length > 0
      ? Math.round(
          students.reduce((sum, s) => sum + (s.average_accuracy || 0), 0) /
            students.length
        )
      : 0;
  const totalPracticeMins = students.reduce(
    (sum, s) => sum + (s.total_practice_minutes || 0),
    0
  );

  const handleAddStudent = () => {
    setShowAddStudentModal(true);
  };

  const handleSendMessage = (student) => {
    setSelectedStudent(student);
    setShowSendMessageModal(true);
  };

  const handleAddStudentSubmit = (formData) => {
    addStudentMutation.mutate(formData);
  };

  const handleSendMessageSubmit = (studentId, message) => {
    sendMessageMutation.mutate({ studentId, message });
  };

  // Selection handlers
  const handleStudentSelect = (student, isSelected) => {
    if (isSelected) {
      setSelectedStudents((prev) => [...prev, student]);
    } else {
      setSelectedStudents((prev) =>
        prev.filter((s) => s.student_id !== student.student_id)
      );
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedStudents(filteredStudents);
    } else {
      setSelectedStudents([]);
    }
  };

  const isStudentSelected = (student) => {
    return selectedStudents.some((s) => s.student_id === student.student_id);
  };

  const isAllSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) => isStudentSelected(student));
  const isPartiallySelected = selectedStudents.length > 0 && !isAllSelected;

  // Delete handlers
  const handleDeleteStudent = (student) => {
    setStudentsToDelete([student]);
    setShowDeleteModal(true);
  };

  const handleDeleteSelectedStudents = () => {
    if (selectedStudents.length === 0) return;
    setStudentsToDelete(selectedStudents);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (studentsToDelete.length === 1) {
      deleteStudentMutation.mutate(studentsToDelete[0].student_id);
    } else {
      const studentIds = studentsToDelete.map((s) => s.student_id);
      deleteMultipleStudentsMutation.mutate(studentIds);
    }
  };

  // Edit handlers
  const handleEditStudent = (student) => {
    setStudentToEdit(student);
    setShowEditModal(true);
  };

  const handleUpdateStudent = (studentId, updates) => {
    updateStudentMutation.mutate({ studentId, updates });
  };

  const handleViewStudent = (student) => {
    setStudentForDetail(student);
    setShowDetailModal(true);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  const clearAllFilters = () => {
    setFilters({
      performanceLevel: "all",
      activityStatus: "all",
      attendanceRange: "all",
      streakRange: "all",
      pointsRange: "all",
      level: "all",
    });
    setSearchTerm("");
  };

  const hasActiveFilters =
    Object.values(filters).some((value) => value !== "all") ||
    searchTerm !== "";

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-red-600">
            Error loading teacher dashboard: {error.message}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: "students", label: "Students", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "recordings", label: "Recordings", icon: Headphones },
    { id: "assignments", label: "Assignments", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-white">Teacher Dashboard</h1>
          {selectedStudents.length > 0 && activeTab === "students" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">
                {selectedStudents.length} selected
              </span>
              <Button
                variant="error"
                size="small"
                onClick={handleDeleteSelectedStudents}
                icon={Trash2}
              >
                Delete Selected
              </Button>
            </div>
          )}
        </div>
        {activeTab === "students" && (
          <Button
            onClick={handleAddStudent}
            icon={UserPlus}
            className="whitespace-nowrap"
          >
            Add Student
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="overflow-x-auto border-b border-gray-700">
        <nav className="flex min-w-max gap-6 py-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(`/teacher/${tab.id}`)}
              className={`relative flex items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-all duration-300 ease-in-out ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-200 hover:border-gray-600 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "recordings" && newRecordingsCount > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {newRecordingsCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <Routes>
        <Route path="/" element={<Navigate to="/teacher/students" replace />} />
        <Route
          path="/students"
          element={
            <div>
              <p className="text-xl text-white">Students Tab Content</p>
              <p className="text-gray-300">
                This is the students route working! The students content will be
                moved here.
              </p>
            </div>
          }
        />
        <Route
          path="/analytics"
          element={
            <AnalyticsDashboard students={students} loading={isLoading} />
          }
        />
        <Route path="/recordings" element={<RecordingsReview />} />
        <Route path="/assignments" element={<AssignmentManagement />} />
        <Route
          path="/notifications"
          element={<NotificationCenter students={students} />}
        />
      </Routes>

      {/* Students Tab Content (temporary until we extract it) */}
      {activeTab === "students" && (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Total Students
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {totalStudents}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Active Students
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {activeStudents}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Avg. Accuracy
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {averageAccuracy}%
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Total Practice
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {Math.round(totalPracticeMins)}m
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Students Section */}
          <Card className="p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <h2 className="text-xl font-semibold text-white">
                  My Students
                </h2>
                {filteredStudents.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectAll(!isAllSelected)}
                      className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-white"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-500" />
                      ) : isPartiallySelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-500 opacity-50" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      Select All
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                {/* Search */}
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:w-64"
                  />
                </div>

                {/* Sort */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] =
                        e.target.value.split("-");
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                    className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="points-desc">Points High-Low</option>
                    <option value="points-asc">Points Low-High</option>
                    <option value="streak-desc">Streak High-Low</option>
                    <option value="streak-asc">Streak Low-High</option>
                    <option value="attendance-desc">Attendance High-Low</option>
                    <option value="attendance-asc">Attendance Low-High</option>
                    <option value="lastPractice-desc">Recent Practice</option>
                    <option value="accuracy-desc">Accuracy High-Low</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 transition-colors sm:w-auto ${
                    showFilters || hasActiveFilters
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filter
                  {hasActiveFilters && (
                    <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-xs text-white">
                      {Object.values(filters).filter((v) => v !== "all")
                        .length + (searchTerm ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mb-6 space-y-4 rounded-lg bg-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Filters</h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      <X className="h-3 w-3" />
                      Clear All
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
                  {/* Performance Level */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Performance
                    </label>
                    <select
                      value={filters.performanceLevel}
                      onChange={(e) =>
                        handleFilterChange("performanceLevel", e.target.value)
                      }
                      className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="needs help">Needs Help</option>
                    </select>
                  </div>

                  {/* Activity Status */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Activity
                    </label>
                    <select
                      value={filters.activityStatus}
                      onChange={(e) =>
                        handleFilterChange("activityStatus", e.target.value)
                      }
                      className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Students</option>
                      <option value="today">Active Today</option>
                      <option value="week">Active This Week</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Attendance Range */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Attendance
                    </label>
                    <select
                      value={filters.attendanceRange}
                      onChange={(e) =>
                        handleFilterChange("attendanceRange", e.target.value)
                      }
                      className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Ranges</option>
                      <option value="high">High (80%+)</option>
                      <option value="medium">Medium (60-79%)</option>
                      <option value="low">Low (&lt;60%)</option>
                    </select>
                  </div>

                  {/* Streak Range */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Streak
                    </label>
                    <select
                      value={filters.streakRange}
                      onChange={(e) =>
                        handleFilterChange("streakRange", e.target.value)
                      }
                      className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Streaks</option>
                      <option value="high">High (10+ days)</option>
                      <option value="medium">Medium (5-9 days)</option>
                      <option value="low">Low (&lt;5 days)</option>
                    </select>
                  </div>

                  {/* Points Range */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Points
                    </label>
                    <select
                      value={filters.pointsRange}
                      onChange={(e) =>
                        handleFilterChange("pointsRange", e.target.value)
                      }
                      className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Points</option>
                      <option value="high">High (1000+)</option>
                      <option value="medium">Medium (500-999)</option>
                      <option value="low">Low (&lt;500)</option>
                    </select>
                  </div>

                  {/* Level */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Level
                    </label>
                    <select
                      value={filters.level}
                      onChange={(e) =>
                        handleFilterChange("level", e.target.value)
                      }
                      className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {filteredStudents.length === 0 ? (
              <div className="py-12 text-center">
                <UserPlus className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-white">
                  {students.length === 0
                    ? "No students yet"
                    : "No students found"}
                </h3>
                <p className="mb-4 text-gray-300">
                  {students.length === 0
                    ? "Add your first student to start tracking their progress"
                    : "Try adjusting your search terms"}
                </p>
                {students.length === 0 && (
                  <Button onClick={handleAddStudent}>
                    Add Your First Student
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredStudents.map((student) => {
                  const isSelected = isStudentSelected(student);
                  return (
                    <Card
                      key={student.student_id}
                      className={`p-4 transition-all hover:shadow-md ${
                        isSelected ? "bg-blue-500/10 ring-2 ring-blue-500" : ""
                      } ${isMobileView ? "cursor-pointer" : ""}`}
                      onClick={() => {
                        if (isMobileView) {
                          handleViewStudent(student);
                        }
                      }}
                      role={isMobileView ? "button" : undefined}
                      tabIndex={isMobileView ? 0 : undefined}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStudentSelect(student, !isSelected);
                          }}
                          className="mt-1 flex-shrink-0 text-gray-400 transition-colors hover:text-blue-400"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <h3 className="break-words font-semibold text-white">
                                  {student.student_name}
                                </h3>
                                <p className="break-words text-sm text-gray-300">
                                  {student.email}
                                </p>
                              </div>
                              <div
                                className={`ml-2 flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                                  student.is_active !== false
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-red-500/20 text-red-300"
                                }`}
                              >
                                {student.is_active !== false
                                  ? "Active"
                                  : "Archived"}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewStudent(student);
                                  }}
                                  className="min-w-0 rounded-lg p-1.5 text-purple-400 transition-colors hover:bg-purple-500/20 hover:text-purple-300"
                                  title="View Details"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendMessage(student);
                                  }}
                                  className="min-w-0 rounded-lg p-1.5 text-green-400 transition-colors hover:bg-green-500/20 hover:text-green-300"
                                  title="Send Message"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditStudent(student);
                                  }}
                                  className="min-w-0 rounded-lg p-1.5 text-blue-400 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
                                  title="Edit Student"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStudent(student);
                                }}
                                className="min-w-0 rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                                title="Delete Student"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`space-y-3 ${
                          isMobileView ? "hidden md:block" : ""
                        }`}
                      >
                        {/* Top Performance Indicator */}
                        <div className="flex items-center justify-between">
                          <div
                            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getPerformanceLevel(student).bgColor} ${getPerformanceLevel(student).color}`}
                          >
                            <Target className="h-3 w-3" />
                            {getPerformanceLevel(student).level}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-white">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span className="font-medium">
                              {student.total_points || 0}
                            </span>
                            <span className="text-gray-400">pts</span>
                          </div>
                        </div>

                        {/* Core Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Level:</span>
                              <span className="font-medium text-white">
                                {student.level || "Beginner"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Year:</span>
                              <span className="font-medium text-white">
                                {student.studying_year || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Practice:</span>
                              <span className="font-medium text-white">
                                {Math.floor(
                                  (student.total_practice_minutes || 0) / 60
                                )}
                                h {(student.total_practice_minutes || 0) % 60}m
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Streak:</span>
                              <span className="flex items-center gap-1 font-medium text-white">
                                <Zap className="h-3 w-3 text-orange-400" />
                                {student.current_streak || 0} days
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Accuracy:</span>
                              <span className="font-medium text-white">
                                {student.average_accuracy || 0}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Started:</span>
                              <span className="text-xs font-medium text-white">
                                {student.member_since || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Attendance Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm text-gray-300">
                              <Calendar className="h-3 w-3" />
                              Attendance (30d)
                            </div>
                            <span className="text-sm font-medium text-white">
                              {calculateAttendanceRate(student)}%
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-700">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                calculateAttendanceRate(student) >= 80
                                  ? "bg-green-500"
                                  : calculateAttendanceRate(student) >= 60
                                    ? "bg-blue-500"
                                    : calculateAttendanceRate(student) >= 40
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                              }`}
                              style={{
                                width: `${calculateAttendanceRate(student)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-sm text-gray-300">
                            <Zap className="h-3 w-3" />
                            Recent Activity
                          </div>
                          <div className="space-y-1">
                            <p
                              className={`text-xs font-medium ${getRecentActivitySummary(student).color}`}
                            >
                              {getRecentActivitySummary(student).text}
                            </p>
                            {student.recent_practices &&
                              student.recent_practices.length > 0 && (
                                <div className="text-xs text-gray-400">
                                  Last session:{" "}
                                  {Math.round(
                                    student.recent_practices[0].duration || 0
                                  )}
                                  min
                                  {student.recent_practices[0]
                                    .analysis_score && (
                                    <span>
                                      {" "}
                                      •{" "}
                                      {Math.round(
                                        student.recent_practices[0]
                                          .analysis_score
                                      )}
                                      % accuracy
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Modals */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onAddStudent={handleAddStudentSubmit}
        isLoading={addStudentMutation.isPending}
      />

      <SendMessageModal
        isOpen={showSendMessageModal}
        onClose={() => setShowSendMessageModal(false)}
        student={selectedStudent}
        onSendMessage={handleSendMessageSubmit}
        isLoading={sendMessageMutation.isPending}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        studentsToDelete={studentsToDelete}
        onConfirmDelete={handleConfirmDelete}
        isLoading={
          deleteStudentMutation.isPending ||
          deleteMultipleStudentsMutation.isPending
        }
      />

      <EditStudentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        student={studentToEdit}
        onUpdateStudent={handleUpdateStudent}
        isLoading={updateStudentMutation.isPending}
      />

      <StudentDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        student={studentForDetail}
        calculateAttendanceRate={calculateAttendanceRate}
        getRecentActivitySummary={getRecentActivitySummary}
        getPerformanceLevel={getPerformanceLevel}
      />
    </div>
  );
};

export default TeacherDashboard;
