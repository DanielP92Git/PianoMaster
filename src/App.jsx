import React, { useRef } from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./components/layout/Dashboard";
import { NoteRecognitionMode } from "./components/games/NoteRecognitionMode";
import { RhythmMasterMode } from "./components/games/RhythmMasterMode";
import { Achievements } from "./pages/Achievements";
import PracticeModes from "./pages/PracticeModes";
import PracticeSessions from "./pages/PracticeSessions";
import StudentAssignments from "./pages/StudentAssignments";
import AppSettings from "./pages/AppSettings";
import Avatars from "./components/Avatars";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Login from "./components/auth/LoginForm";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./ui/ProtectedRoute";
import { MemoryGame } from "./components/games/note-recognition-games/MemoryGame";
import { NoteRecognitionGame } from "./components/games/note-recognition-games/NoteRecognitionGame";
import MetronomeTrainer from "./components/games/rhythm-games/MetronomeTrainer";
import { RhythmProvider } from "./reducers/rhythmReducer";

import { useUser } from "./features/authentication/useUser";
import { Loader2 } from "lucide-react";
import { ModalProvider } from "./contexts/ModalContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import TeacherDashboard from "./components/layout/TeacherDashboard";
import { RoleSelection } from "./components/auth/RoleSelection";
import PWAInstallPrompt from "./components/pwa/PWAInstallPrompt";
import PWAUpdateNotification from "./components/pwa/PWAUpdateNotification";
import NetworkStatus from "./components/pwa/NetworkStatus";

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

  // If user is authenticated but doesn't have a profile, show role selection
  if (user && !isLoading && !profile && !userRole) {
    return <RoleSelection user={user} />;
  }

  return children;
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
          <Route index element={<Dashboard />} />
          <Route path="/practice-modes" element={<PracticeModes />} />
          <Route path="practice-sessions" element={<PracticeSessions />} />
          <Route path="/assignments" element={<StudentAssignments />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/settings" element={<AppSettings />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/teacher/*" element={<TeacherDashboard />} />
          <Route
            path="/note-recognition-mode"
            element={<NoteRecognitionMode />}
          />
          <Route
            path="/note-recognition-mode/memory-game"
            element={<MemoryGame />}
          />
          <Route
            path="/note-recognition-mode/note-recognition-game"
            element={<NoteRecognitionGame />}
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
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <ModalProvider>
          <RhythmProvider>
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
              <Toaster position="top-center" />
              <AppRoutes />

              {/* PWA Components */}
              <PWAInstallPrompt />
              <PWAUpdateNotification />
              <NetworkStatus />
            </div>
          </RhythmProvider>
        </ModalProvider>
      </AccessibilityProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;
