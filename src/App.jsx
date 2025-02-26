import React, { useRef, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { AppLayout } from "./components/homepage/AppLayout";
import { Dashboard } from "./components/homepage/Dashboard";
import { NoteRecognitionMode } from "./components/games/NoteRecognitionMode";
import { RhythmMasterMode } from "./components/games/RhythmMasterMode";
import { Achievements } from "./pages/Achievements";
import PracticeModes from "./pages/PracticeModes";
import AppSettings from "./pages/AppSettings";
import Avatars from "./components/Avatars";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Login from "./pages/LoginForm";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./ui/ProtectedRoute";
import { MemoryGame } from "./components/games/note-recognition-games/MemoryGame";
import { NoteRecognitionGame } from "./components/games/note-recognition-games/NoteRecognitionGame";
import { ListenAndRepeat } from "./components/games/rhythm-games/ListenAndRepeat";
import { RhythmProvider } from "./reducers/rhythmReducer";
import { YourGroove } from "./components/games/rhythm-games/YourGroove";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
    },
  },
});

function App() {
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const practiceModesSectionRef = useRef(null);

  const scrollToPracticeModes = () => {
    practiceModesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
  };

  const handleGameModeSelect = (mode) => {
    setCurrentGame(mode.type);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <Toaster />
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
              <PracticeModes
                practiceModesSectionRef={practiceModesSectionRef}
                // onSelect={handleGameModeSelect}
              />
            }
          />
          <Route path="/note-recognition-mode" element={<NoteRecognitionMode />} />
          <Route
            path="/note-recognition-mode/memory-game"
            element={<MemoryGame />}
          />
          <Route
            path="/note-recognition-mode/note-recognition-game"
            element={<NoteRecognitionGame />}
          />

          <Route />
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
    </QueryClientProvider>
  );
}

export default App;
