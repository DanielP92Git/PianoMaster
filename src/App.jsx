import React, { useRef, useState } from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./components/layout/Dashboard";
import { NoteRecognitionMode } from "./components/games/NoteRecognitionMode";
import { RhythmMasterMode } from "./components/games/RhythmMasterMode";
import { Achievements } from "./pages/Achievements";
import PracticeModes from "./pages/PracticeModes";
import AppSettings from "./pages/AppSettings";
import Avatars from "./components/Avatars";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Login from "./components/auth/LoginForm";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./ui/ProtectedRoute";
import { MemoryGame } from "./components/games/note-recognition-games/MemoryGame";
import { NoteRecognitionGame } from "./components/games/note-recognition-games/NoteRecognitionGame";
import { ListenAndRepeat } from "./components/games/rhythm-games/ListenAndRepeat";
import { RhythmProvider } from "./reducers/rhythmReducer";
import { YourGroove } from "./components/games/rhythm-games/YourGroove";
import { useUser } from "./features/authentication/useUser";
import { Loader2 } from "lucide-react";
import { ModalProvider } from "./contexts/ModalContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
    },
  },
});

function AppRoutes() {
  const { isLoading } = useUser();
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const practiceModesSectionRef = useRef(null);

  const scrollToPracticeModes = () => {
    practiceModesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout
              selectedAvatar={selectedAvatar}
              onPracticeModesClick={scrollToPracticeModes}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route
          path="/practice-modes"
          element={
            <PracticeModes practiceModesSectionRef={practiceModesSectionRef} />
          }
        />
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
          path="/rhythm-mode/listen-and-repeat"
          element={<ListenAndRepeat />}
        />
        <Route
          path="/rhythm-mode/create-own"
          element={
            <RhythmProvider>
              <YourGroove />
            </RhythmProvider>
          }
        />
        <Route path="/settings" element={<AppSettings />} />
        <Route
          path="/avatars"
          element={
            <Avatars
              onSelect={handleAvatarSelect}
              selectedAvatar={selectedAvatar}
            />
          }
        />
      </Route>
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ModalProvider>
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster />
        <AppRoutes />
      </ModalProvider>
    </QueryClientProvider>
  );
}

export default App;
