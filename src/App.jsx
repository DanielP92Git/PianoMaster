import React, { useRef, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { AppLayout } from "./components/homepage/AppLayout";
import { Dashboard } from "./components/homepage/Dashboard";
import { NoteRecognitionMode } from "./components/NoteRecognitionMode";
import { RhythmMasterMode } from "./components/RhythmMasterMode";
import { Achievements } from "./pages/Achievements";
import PracticeModes from "./pages/PracticeModes";
import AppSettings from "./pages/AppSettings";
import Avatars from "./components/Avatars";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Login from "./pages/LoginForm";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./ui/ProtectedRoute";

// const gameModes = [
//   {
//     id: "1",
//     name: "Note Recognition",
//     description:
//       "Train your ear to identify musical notes quickly and accurately",
//     difficulty: "beginner",
//     type: "note-recognition",
//   },
//   {
//     id: "2",
//     name: "Rhythm Master",
//     description: "Match complex rhythms and improve your timing",
//     difficulty: "intermediate",
//     type: "rhythm",
//   },
//   {
//     id: "3",
//     name: "Sight Reading Challenge",
//     description: "Practice reading and playing sheet music in real-time",
//     difficulty: "advanced",
//     type: "sight-reading",
//   },
// ];

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
          <Route path="/note-recognition" element={<NoteRecognitionMode />} />
          <Route path="/rhythm" element={<RhythmMasterMode />} />
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
          <Route
            path="/practice-modes"
            element={
              <PracticeModes
                // gameModes={gameModes}
                practiceModesSectionRef={practiceModesSectionRef}
                onSelect={handleGameModeSelect}
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
