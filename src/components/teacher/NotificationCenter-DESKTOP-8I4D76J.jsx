import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Star,
  Trophy,
  MessageCircle,
  Clock,
  Filter,
  Search,
  Check,
  Trash2,
  Archive,
  X,
  Eye,
  Send,
  Plus,
  Award,
  TrendingUp,
  Music,
  Target,
  Calendar,
  User,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import { toast } from "react-hot-toast";
import {
  getTeacherNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  archiveNotification,
  sendNotificationToStudent,
} from "../../services/apiTeacher";

// Send Notification Modal
const SendNotificationModal = ({
  isOpen,
  onClose,
  students,
  onSendNotification,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    recipientId: "",
    type: "message",
    title: "",
    message: "",
    priority: "normal",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid()) {
      onSendNotification(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      recipientId: "",
      type: "message",
      title: "",
      message: "",
      priority: "normal",
    });
    onClose();
  };

  const isFormValid = () => {
    return (
      formData.recipientId && formData.title.trim() && formData.message.trim()
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Notification">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 custom-scrollbar-light"
      >
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Send to Student
          </label>
          <select
            value={formData.recipientId}
            onChange={(e) => handleInputChange("recipientId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            required
          >
            <option value="">Select a student...</option>
            {students.map((student) => (
              <option key={student.student_id} value={student.student_id}>
                {student.student_name} ({student.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Notification Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange("type", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="message">Message</option>
            <option value="reminder">Reminder</option>
            <option value="achievement">Achievement</option>
            <option value="assignment">Assignment</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => handleInputChange("priority", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Title
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="Enter notification title..."
            className="w-full"
            variant="solid"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Message
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleInputChange("message", e.target.value)}
            placeholder="Enter your message..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-500"
            required
          />
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
            icon={Send}
          >
            Send Notification
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Notification Detail Modal
const NotificationDetailModal = ({ isOpen, onClose, notification }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case "achievement":
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case "assignment":
        return <Target className="w-5 h-5 text-blue-500" />;
      case "reminder":
        return <Clock className="w-5 h-5 text-orange-500" />;
      case "message":
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!notification) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification Details">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {getNotificationIcon(notification.type)}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {notification.title}
            </h3>
            <p className="text-sm text-gray-600">
              {new Date(notification.created_at).toLocaleString()}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}
          >
            {notification.priority}
          </span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700">{notification.message}</p>
        </div>

        {notification.data && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              Additional Information
            </h4>
            <pre className="text-sm text-blue-800 whitespace-pre-wrap">
              {JSON.stringify(notification.data, null, 2)}
            </pre>
          </div>
        )}

        {notification.student_name && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>From: {notification.student_name}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

const NotificationCenter = ({ students = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["teacherNotifications"],
    queryFn: getTeacherNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherNotifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherNotifications"] });
      toast.success("All notifications marked as read");
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherNotifications"] });
      toast.success("Notification deleted");
    },
  });

  // Archive notification mutation
  const archiveNotificationMutation = useMutation({
    mutationFn: archiveNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherNotifications"] });
      toast.success("Notification archived");
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: sendNotificationToStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherNotifications"] });
      setShowSendModal(false);
      toast.success("Notification sent successfully!");
    },
    onError: (error) => {
      console.error("Send notification error:", error);
      toast.error("Failed to send notification. Please try again.");
    },
  });

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" || notification.type === typeFilter;
    const matchesPriority =
      priorityFilter === "all" || notification.priority === priorityFilter;
    const matchesReadStatus = !showUnreadOnly || !notification.is_read;

    return matchesSearch && matchesType && matchesPriority && matchesReadStatus;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "achievement":
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case "assignment":
        return <Target className="w-5 h-5 text-blue-500" />;
      case "reminder":
        return <Clock className="w-5 h-5 text-orange-500" />;
      case "message":
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  const handleSendNotification = (formData) => {
    sendNotificationMutation.mutate(formData);
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-red-600">
            Error loading notifications: {error.message}
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
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Notification Center</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowSendModal(true)}
            icon={Plus}
            className="whitespace-nowrap"
          >
            Send Notification
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              variant="secondary"
              icon={CheckCircle}
              loading={markAllAsReadMutation.isPending}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="all">All Types</option>
              <option value="achievement">Achievements</option>
              <option value="assignment">Assignments</option>
              <option value="message">Messages</option>
              <option value="reminder">Reminders</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-white">Unread only</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Notifications ({filteredNotifications.length})
        </h3>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-200">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-white">No notifications found</p>
            <p className="text-sm text-gray-300">
              {showUnreadOnly
                ? "All caught up! No unread notifications."
                : "No notifications to display."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 custom-scrollbar">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-white/5 ${
                  !notification.is_read
                    ? "bg-blue-50/10 border-blue-200/20"
                    : "bg-white/5 border-white/10"
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`font-medium ${!notification.is_read ? "text-white" : "text-gray-300"}`}
                      >
                        {notification.title}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}
                      >
                        {notification.priority}
                      </span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                      {notification.student_name && (
                        <span>From: {notification.student_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveNotificationMutation.mutate(notification.id);
                      }}
                      icon={Archive}
                      className="text-gray-400 hover:text-gray-300"
                    />
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotificationMutation.mutate(notification.id);
                      }}
                      icon={Trash2}
                      className="text-red-400 hover:text-red-300"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modals */}
      <SendNotificationModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        students={students}
        onSendNotification={handleSendNotification}
        isLoading={sendNotificationMutation.isPending}
      />

      <NotificationDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        notification={selectedNotification}
      />
    </div>
  );
};

export default NotificationCenter;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 