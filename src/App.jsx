import React, { useRef, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./components/layout/Dashboard";
import { useTranslation } from "react-i18next";
import { NotesMasterMode } from "./components/games/NotesMasterMode";
import { RhythmMasterMode } from "./components/games/RhythmMasterMode";
import Achievements from "./pages/Achievements";
import PracticeModes from "./pages/PracticeModes";
import TrailMapPage from "./pages/TrailMapPage";
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
import ConsentVerifyPage from "./pages/ConsentVerifyPage";
import ParentalConsentPending from "./components/auth/ParentalConsentPending";
import { useAccountStatus } from "./hooks/useAccountStatus";
import { MemoryGame } from "./components/games/notes-master-games/MemoryGame";
import { NotesRecognitionGame } from "./components/games/notes-master-games/NotesRecognitionGame";
import { SightReadingGame } from "./components/games/sight-reading-game/SightReadingGame";
import { SightReadingLayoutHarness } from "./components/games/sight-reading-game/components/SightReadingLayoutHarness";
import MetronomeTrainer from "./components/games/rhythm-games/MetronomeTrainer";
import { RhythmProvider } from "./reducers/rhythmReducer";
import { reminderService } from "./services/reminderService";
import { dashboardReminderService } from "./services/dashboardReminderService";

import { useUser } from "./features/authentication/useUser";
import { Loader2 } from "lucide-react";
import { ModalProvider } from "./contexts/ModalContext";
import {
  AccessibilityProvider,
  useAccessibility,
} from "./contexts/AccessibilityContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { SessionTimeoutProvider } from "./contexts/SessionTimeoutContext";
import TeacherDashboard from "./components/layout/TeacherDashboard";
import { RoleSelection } from "./components/auth/RoleSelection";
import PWAInstallPrompt from "./components/pwa/PWAInstallPrompt";
import IOSInstallPrompt from "./components/pwa/IOSInstallPrompt";
import PWAUpdateNotification from "./components/pwa/PWAUpdateNotification";
import NetworkStatus from "./components/pwa/NetworkStatus";
import AlarmModal from "./components/ui/AlarmModal";
import { useUserProfile } from "./hooks/useUserProfile";
import { SightReadingSessionProvider } from "./contexts/SightReadingSessionContext";
import { lockOrientation } from "./utils/pwa";
import { resolveProfileAvatarSource } from "./utils/avatarAssets";
import { isIOSDevice, isInStandaloneMode } from "./utils/pwaDetection";
import IOSLandscapeTipModal from "./components/pwa/IOSLandscapeTipModal";
import supabase from "./services/supabase";
import { useGlobalFullscreenOnFirstTap } from "./hooks/useGlobalFullscreenOnFirstTap";
import { useDocumentTitle } from "./hooks/useDocumentTitle";

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

// Component to handle role selection and account status for authenticated users
function AuthenticatedWrapper({ children }) {
  const { user, isLoading, userRole, profile, isStudent } = useUser();
  const { data: profileData } = useUserProfile();

  // Check account status for students (suspended for consent/deletion)
  const {
    isSuspended,
    suspensionReason,
    parentEmail,
    loading: statusLoading,
    refetch: refetchStatus
  } = useAccountStatus(user?.id);

  // Preload avatar image for instant display
  useEffect(() => {
    const avatarSrc = resolveProfileAvatarSource(profileData);
    if (avatarSrc) {
      const img = new Image();
      img.src = avatarSrc;
    }
  }, [profileData]);

  // If user is authenticated but doesn't have a profile, show role selection
  if (user && !isLoading && !profile && !userRole) {
    return <RoleSelection user={user} />;
  }

  // Wait for status check to complete for students
  if (user && isStudent && statusLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // If student account is suspended pending parental consent, show waiting UI
  if (user && isStudent && isSuspended && suspensionReason === 'consent') {
    return (
      <ParentalConsentPending
        parentEmail={parentEmail}
        studentId={user.id}
        onRefresh={refetchStatus}
      />
    );
  }

  // If account is suspended for deletion, also show a message (could be a different component)
  // For now, we reuse the consent pending with a different message
  if (user && isStudent && isSuspended && suspensionReason === 'deletion') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-md p-6 md:p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Account Suspended</h1>
          <p className="text-white/90 mb-6">
            Your account has been scheduled for deletion. If you believe this is an error,
            please contact support.
          </p>
        </div>
      </div>
    );
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

function OrientationController() {
  const {
    user,
    isLoading,
    userRole: derivedRole,
    isStudent: derivedIsStudent,
  } = useUser();
  const location = useLocation();
  const lastRoleRef = useRef(null);
  const lastPathRef = useRef(null);
  const [showTip, setShowTip] = React.useState(false);
  const [dismissedKey, setDismissedKey] = React.useState(null);
  const dismissedKeyRef = useRef(null);

  const LANDSCAPE_ROUTES = [
    "/notes-master-mode/notes-recognition-game",
    "/notes-master-mode/memory-game",
    "/notes-master-mode/sight-reading-game",
    "/rhythm-mode/metronome-trainer",
  ];

  const isLandscapeRoute = LANDSCAPE_ROUTES.includes(location.pathname);

  useEffect(() => {
    if (isLoading) return;

    const role =
      derivedRole ||
      user?.userRole ||
      user?.user_metadata?.role ||
      user?.app_metadata?.role ||
      user?.role ||
      null;

    const normalizedRole = typeof role === "string" ? role.toLowerCase() : null;

    const isStudent = normalizedRole === "student" || Boolean(derivedIsStudent);

    const shouldReapply =
      lastRoleRef.current !== role || lastPathRef.current !== location.pathname;

    if (shouldReapply) {
      // Treat derived student flag as authoritative even if role metadata is missing.
      if (isStudent && isLandscapeRoute) {
        lockOrientation("landscape-primary");
      } else {
        lockOrientation("portrait-primary");
      }

      lastRoleRef.current = role;
      lastPathRef.current = location.pathname;
    }

    const inStandalone = isInStandaloneMode();

    const key = inStandalone
      ? "ios-landscape-tip-dismissed-app"
      : "ios-landscape-tip-dismissed-browser";
    setDismissedKey(key);
    dismissedKeyRef.current = key;

    const tipDimissInfo =
      typeof window !== "undefined" ? window.localStorage.getItem(key) : null;

    const isiOS = isIOSDevice();
    if (!isStudent || !isiOS || !isLandscapeRoute) {
      setShowTip(false);
      return;
    }

    let tipDismissed = false;
    if (tipDimissInfo === "never") {
      tipDismissed = true;
    } else if (tipDimissInfo) {
      const timestamp = Number(tipDimissInfo);
      tipDismissed =
        Number.isFinite(timestamp) &&
        Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000;
    }

    if (!tipDismissed) {
      setShowTip(true);
    } else {
      setShowTip(false);
    }
  }, [isLoading, user, derivedRole, derivedIsStudent, location.pathname, isLandscapeRoute]);

  const handleClose = ({ dontShowAgain } = {}) => {
    setShowTip(false);
    const storageKey = dismissedKeyRef.current || dismissedKey;
    if (typeof window !== "undefined" && storageKey) {
      window.localStorage.setItem(
        storageKey,
        dontShowAgain ? "never" : Date.now().toString()
      );
    }
  };

  return showTip ? <IOSLandscapeTipModal onClose={handleClose} /> : null;
}

function AppRoutes() {
  const { isLoading } = useUser();
  const practiceModesSectionRef = useRef(null);

  // Must be called on every render (even while loading) to preserve hook order.
  useDocumentTitle();

  const scrollToPracticeModes = () => {
    practiceModesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <AuthenticatedWrapper>
      <OrientationController />
      <Routes>
        {import.meta.env.DEV && (
          <Route
            path="/debug/sight-reading-layout"
            element={<SightReadingLayoutHarness />}
          />
        )}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout onPracticeModesClick={scrollToPracticeModes} />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherRedirect />} />
          <Route path="/trail" element={<TrailMapPage />} />
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
          <Route
            path="/notes-master-mode/sight-reading-game"
            element={<SightReadingGame />}
          />
          <Route path="/rhythm-mode" element={<RhythmMasterMode />} />
          <Route
            path="/rhythm-mode/metronome-trainer"
            element={<MetronomeTrainer />}
          />
          {/* TODO: Add new rhythm game routes here */}
        </Route>
        <Route path="/login" element={<Login />} />
        {/* Public route for parental consent verification (no auth required) */}
        <Route path="/consent/verify" element={<ConsentVerifyPage />} />
      </Routes>
    </AuthenticatedWrapper>
  );
}

function App() {
  const { i18n } = useTranslation("common");
  useGlobalFullscreenOnFirstTap();
  const location = useLocation();

  // Ensure <html> lang/dir are set so global RTL font rules apply consistently
  useEffect(() => {
    document.documentElement.lang = i18n.language || "en";
    document.documentElement.dir = i18n.dir();
  }, [i18n.language, i18n]);

  // Keep the Android PWA status bar color aligned with the app's top background.
  // Note: On Android PWAs we can't draw the *image* into the system status bar area,
  // but we can match the color so it feels native (no black bar).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute("content", "#581c87");
  }, [location.pathname]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      // If token refresh fails (common after deployments when a stored refresh token
      // is revoked/expired), clear the local session to prevent repeated 400s/log spam.
      if (event === "TOKEN_REFRESH_FAILED") {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn("Failed to sign out after TOKEN_REFRESH_FAILED:", e);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["user"] });
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

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
          <SessionTimeoutProvider>
            <ModalProvider>
              <RhythmProvider>
                <SightReadingSessionProvider>
                <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 safe-area-app">
                  <AccessibleToaster />
                  <AppRoutes />

                  {/* PWA Components */}
                  <PWAInstallPrompt />
                  <IOSInstallPrompt />
                  <PWAUpdateNotification />
                  <NetworkStatus />

                  {/* Alarm Modal */}
                  <AlarmModal />
                </div>
                </SightReadingSessionProvider>
              </RhythmProvider>
            </ModalProvider>
          </SessionTimeoutProvider>
        </SettingsProvider>
      </AccessibilityProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;

function AccessibleToaster() {
  const { extendedTimeouts } = useAccessibility();
  const duration = extendedTimeouts ? 8000 : 4000;

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration,
        success: { duration },
        error: { duration: extendedTimeouts ? 9000 : 5000 },
      }}
    />
  );
}
