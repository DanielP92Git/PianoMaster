import React, { useState, useEffect } from "react";
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
import { lockOrientation } from "../../utils/pwa";

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
              <label className="block text-sm font-medium mb-2 text-gray-700">
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
              <label className="block text-sm font-medium mb-2 text-gray-700">
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
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Level
              </label>
              <select
                value={formData.level}
                onChange={(e) => handleInputChange("level", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
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
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Studying Year
              </label>
              <select
                value={formData.studyingYear}
                onChange={(e) =>
                  handleInputChange("studyingYear", e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
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
              <label className="block text-sm font-medium mb-2 text-gray-700">
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
              <label className="block text-sm font-medium mb-2 text-gray-700">
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
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
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
      className="bg-gray-900 border-gray-600"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Add New Student - {getStepTitle()}
          </h3>
          <div className="text-sm text-gray-600">Step {step} of 5</div>
        </div>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
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

          <div className="flex gap-3 justify-between">
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
      className="bg-gray-900 border-gray-600"
    >
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Edit Student Profile
          </h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              formData.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {formData.isActive ? "Active" : "Archived"}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
                  <label className="block text-sm font-medium mb-2 text-gray-700">
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
                  <label className="block text-sm font-medium mb-2 text-gray-700">
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
                <label className="block text-sm font-medium mb-2 text-gray-700">
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
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleInputChange("level", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
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
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Studying Year *
                  </label>
                  <select
                    value={formData.studyingYear}
                    onChange={(e) =>
                      handleInputChange("studyingYear", e.target.value)
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
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
                <label className="block text-sm font-medium mb-2 text-gray-700">
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
                <p className="text-xs text-gray-500 mt-1">
                  When did this student start studying with you?
                </p>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
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
                  <label className="block text-sm font-medium mb-2 text-gray-700">
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
                  <label className="block text-sm font-medium mb-2 text-gray-700">
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
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Primary Instrument
                </label>
                <select
                  value={formData.instrument}
                  onChange={(e) =>
                    handleInputChange("instrument", e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
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
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Learning Goals
                </label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => handleInputChange("goals", e.target.value)}
                  placeholder="What does this student want to achieve?"
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none bg-white text-gray-900 placeholder:text-gray-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Teacher Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Private notes about this student's progress, challenges, preferences..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none bg-white text-gray-900 placeholder:text-gray-500"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
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

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
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
      className="bg-gray-900 border-gray-600"
    >
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {isMultiple ? "Delete Students" : "Delete Student"}
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-100 text-base leading-relaxed">
            {isMultiple
              ? `Are you sure you want to remove ${studentsToDelete.length} students from your class?`
              : `Are you sure you want to remove ${studentNames} from your class?`}
          </p>
          {isMultiple && (
            <div className="mt-4 max-h-32 overflow-y-auto custom-scrollbar">
              <p className="text-sm text-gray-200 mb-2 font-medium">
                Students to be removed:
              </p>
              <ul className="text-sm text-gray-100 space-y-1">
                {studentsToDelete.map((student) => (
                  <li
                    key={student.student_id}
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    {student.student_name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
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
      className="bg-gray-900 border-gray-600"
    >
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Send Message to {student?.student_name}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Great job on your practice today!"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none bg-white text-gray-900 placeholder:text-gray-500"
              rows={4}
              required
            />
          </div>
          <div className="flex gap-3 justify-end">
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
  if (!student) return null;

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${student.student_name} - Detailed View`}
      size="large"
    >
                <div className="max-h-[80vh] overflow-y-auto custom-scrollbar space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Total Points
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {student.total_points || 0}
            </p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
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

          <div className="bg-green-50 p-4 rounded-lg">
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

          <div className="bg-purple-50 p-4 rounded-lg">
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Overview
          </h3>

          <div className="space-y-4">
            {/* Performance Level */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Performance Level
              </span>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceLevel(student).bgColor} ${getPerformanceLevel(student).color}`}
              >
                {getPerformanceLevel(student).level}
              </div>
            </div>

            {/* Attendance Rate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Attendance Rate (30 days)
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {calculateAttendanceRate(student)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
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

        {/* Practice History */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Practice Sessions
          </h3>

          {student.recent_practices && student.recent_practices.length > 0 ? (
            <div className="space-y-3">
              {student.recent_practices.map((practice, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(practice.submitted_at)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDuration(practice.duration || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {Math.round(practice.analysis_score || 0)}% accuracy
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No practice sessions recorded yet</p>
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

  useEffect(() => {
    lockOrientation("portrait-primary");
  }, []);

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
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
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
      <div className="border-b border-gray-700 overflow-x-auto">
        <nav className="flex min-w-max gap-6 py-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(`/teacher/${tab.id}`)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ease-in-out relative ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-200 hover:text-white hover:border-gray-600"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "recordings" && newRecordingsCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] text-xs font-bold text-white bg-red-500 rounded-full px-1.5">
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
              <p className="text-white text-xl">Students Tab Content</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
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
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
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
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
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
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Students Section */}
          <Card className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <h2 className="text-xl font-semibold text-white">
                  My Students
                </h2>
                {filteredStudents.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectAll(!isAllSelected)}
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : isPartiallySelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-500 opacity-50" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      Select All
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                {/* Search */}
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
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
                    className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center ${
                    showFilters || hasActiveFilters
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filter
                  {hasActiveFilters && (
                    <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {Object.values(filters).filter((v) => v !== "all")
                        .length + (searchTerm ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mb-6 p-4 bg-gray-800 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Filters</h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Clear All
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Performance Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Performance
                    </label>
                    <select
                      value={filters.performanceLevel}
                      onChange={(e) =>
                        handleFilterChange("performanceLevel", e.target.value)
                      }
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Activity
                    </label>
                    <select
                      value={filters.activityStatus}
                      onChange={(e) =>
                        handleFilterChange("activityStatus", e.target.value)
                      }
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Students</option>
                      <option value="today">Active Today</option>
                      <option value="week">Active This Week</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Attendance Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Attendance
                    </label>
                    <select
                      value={filters.attendanceRange}
                      onChange={(e) =>
                        handleFilterChange("attendanceRange", e.target.value)
                      }
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Ranges</option>
                      <option value="high">High (80%+)</option>
                      <option value="medium">Medium (60-79%)</option>
                      <option value="low">Low (&lt;60%)</option>
                    </select>
                  </div>

                  {/* Streak Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Streak
                    </label>
                    <select
                      value={filters.streakRange}
                      onChange={(e) =>
                        handleFilterChange("streakRange", e.target.value)
                      }
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Streaks</option>
                      <option value="high">High (10+ days)</option>
                      <option value="medium">Medium (5-9 days)</option>
                      <option value="low">Low (&lt;5 days)</option>
                    </select>
                  </div>

                  {/* Points Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Points
                    </label>
                    <select
                      value={filters.pointsRange}
                      onChange={(e) =>
                        handleFilterChange("pointsRange", e.target.value)
                      }
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Points</option>
                      <option value="high">High (1000+)</option>
                      <option value="medium">Medium (500-999)</option>
                      <option value="low">Low (&lt;500)</option>
                    </select>
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Level
                    </label>
                    <select
                      value={filters.level}
                      onChange={(e) =>
                        handleFilterChange("level", e.target.value)
                      }
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="text-center py-12">
                <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  {students.length === 0
                    ? "No students yet"
                    : "No students found"}
                </h3>
                <p className="text-gray-300 mb-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student) => {
                  const isSelected = isStudentSelected(student);
                  return (
                    <Card
                      key={student.student_id}
                      className={`p-4 hover:shadow-md transition-all ${
                        isSelected ? "ring-2 ring-blue-500 bg-blue-500/10" : ""
                      } ${isMobileView ? "cursor-pointer" : ""}`}
                      onClick={() => {
                        if (isMobileView) {
                          handleViewStudent(student);
                        }
                      }}
                      role={isMobileView ? "button" : undefined}
                      tabIndex={isMobileView ? 0 : undefined}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStudentSelect(student, !isSelected);
                          }}
                          className="mt-1 text-gray-400 hover:text-blue-400 transition-colors flex-shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white break-words">
                                  {student.student_name}
                                </h3>
                                <p className="text-sm text-gray-300 break-words">
                                  {student.email}
                                </p>
                              </div>
                              <div
                                className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
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
                                  className="p-1.5 min-w-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendMessage(student);
                                  }}
                                  className="p-1.5 min-w-0 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                                  title="Send Message"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditStudent(student);
                                  }}
                                  className="p-1.5 min-w-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
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
                                className="p-1.5 min-w-0 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
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
                            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPerformanceLevel(student).bgColor} ${getPerformanceLevel(student).color}`}
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
                              <span className="font-medium text-white flex items-center gap-1">
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
                              <span className="font-medium text-white text-xs">
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
                          <div className="w-full bg-gray-700 rounded-full h-2">
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
