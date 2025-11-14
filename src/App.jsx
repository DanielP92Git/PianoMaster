import React, { useRef, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./components/layout/Dashboard";
import { NotesMasterMode } from "./components/games/NotesMasterMode";
import { RhythmMasterMode } from "./components/games/RhythmMasterMode";
import { Achievements } from "./pages/Achievements";
import PracticeModes from "./pages/PracticeModes";
import PracticeSessions from "./pages/PracticeSessions";
import StudentAssignments from "./pages/StudentAssignments";
import AppSettings from "./pages/AppSettings";
import Legal from "./pages/Legal";
import Avatars from "./components/Avatars";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Login from "./components/auth/LoginForm";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./ui/ProtectedRoute";
import { MemoryGame } from "./components/games/notes-master-games/MemoryGame";
import { NotesRecognitionGame } from "./components/games/notes-master-games/NotesRecognitionGame";
import MetronomeTrainer from "./components/games/rhythm-games/MetronomeTrainer";
import { RhythmProvider } from "./reducers/rhythmReducer";
import { reminderService } from "./services/reminderService";
import { dashboardReminderService } from "./services/dashboardReminderService";

import { useUser } from "./features/authentication/useUser";
import { Loader2 } from "lucide-react";
import { ModalProvider } from "./contexts/ModalContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import TeacherDashboard from "./components/layout/TeacherDashboard";
import { RoleSelection } from "./components/auth/RoleSelection";
import PWAInstallPrompt from "./components/pwa/PWAInstallPrompt";
import PWAUpdateNotification from "./components/pwa/PWAUpdateNotification";
import NetworkStatus from "./components/pwa/NetworkStatus";
import AlarmModal from "./components/ui/AlarmModal";
import { useUserProfile } from "./hooks/useUserProfile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection time
      refetchOnWindowFocus: false, // Disable refetch on window focus
      refetchOnReconnect: true, // Still refetch when reconnecting to network
      retry: 1, // Only retry once on failure
    },
  },
});

// Component to handle role selection for authenticated users without profiles
function AuthenticatedWrapper({ children }) {
  const { user, isLoading, userRole, profile } = useUser();
  const { data: profileData } = useUserProfile();

  // Preload avatar image for instant display
  useEffect(() => {
    if (profileData?.avatars?.image_url || profileData?.avatar_url) {
      const avatarUrl =
        profileData.avatars?.image_url || profileData.avatar_url;
      const img = new Image();
      img.src = avatarUrl;
    }
  }, [profileData]);

  // If user is authenticated but doesn't have a profile, show role selection
  if (user && !isLoading && !profile && !userRole) {
    return <RoleSelection user={user} />;
  }

  return children;
}

// Component to redirect teachers to their dashboard
function TeacherRedirect() {
  const { isTeacher } = useUser();
  
  if (isTeacher) {
    return <Navigate to="/teacher" replace />;
  }
  
  return <Dashboard />;
}

function AppRoutes() {
  const { isLoading } = useUser();
  const practiceModesSectionRef = useRef(null);

  const scrollToPracticeModes = () => {
    practiceModesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <AuthenticatedWrapper>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout onPracticeModesClick={scrollToPracticeModes} />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherRedirect />} />
          <Route path="/practice-modes" element={<PracticeModes />} />
          <Route path="practice-sessions" element={<PracticeSessions />} />
          <Route path="/assignments" element={<StudentAssignments />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/settings" element={<AppSettings />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/teacher/*" element={<TeacherDashboard />} />
          <Route path="/notes-master-mode" element={<NotesMasterMode />} />
          <Route
            path="/notes-master-mode/memory-game"
            element={<MemoryGame />}
          />
          <Route
            path="/notes-master-mode/notes-recognition-game"
            element={<NotesRecognitionGame />}
          />
          <Route path="/rhythm-mode" element={<RhythmMasterMode />} />
          <Route
            path="/rhythm-mode/metronome-trainer"
            element={<MetronomeTrainer />}
          />
          {/* TODO: Add new rhythm game routes here */}
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </AuthenticatedWrapper>
  );
}

function App() {
  // Initialize dashboard reminder service
  useEffect(() => {
    dashboardReminderService.initialize();
  }, []);

  // Listen for service worker messages (e.g., snooze from notification action)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const handleMessage = (event) => {
        if (event.data && event.data.type === "SNOOZE_REMINDER") {
          reminderService.snooze(event.data.minutes || 15);
        }
        if (event.data && event.data.type === "SNOOZE_DASHBOARD_REMINDER") {
          dashboardReminderService.snooze(event.data.minutes || 15);
        }
        if (event.data && event.data.type === "STOP_ALARM") {
          dashboardReminderService.stopAlarm();
        }
      };

      navigator.serviceWorker.addEventListener("message", handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <SettingsProvider>
          <ModalProvider>
            <RhythmProvider>
              <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
                <Toaster position="top-center" />
                <AppRoutes />

                {/* PWA Components */}
                <PWAInstallPrompt />
                <PWAUpdateNotification />
                <NetworkStatus />

                {/* Alarm Modal */}
                <AlarmModal />
              </div>
            </RhythmProvider>
          </ModalProvider>
        </SettingsProvider>
      </AccessibilityProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;
