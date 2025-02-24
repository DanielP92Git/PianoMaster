import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  ArrowLeft,
  Play,
  Mic,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const rhythmPatterns = [
  {
    id: 1,
    pattern: "♩ ♩ ♩ ♩",
    audio: "/audio/4.mp3",
    difficulty: "easy",
  },
  {
    id: 2,
    pattern: "♩ ♩ ♪ ♪ ♩",
    audio: "/audio/pattern2.mp3",
    difficulty: "medium",
  },
  {
    id: 3,
    pattern: "♪ ♪ ♩ ♪ ♪ ♩",
    audio: "/audio/pattern3.mp3",
    difficulty: "hard",
  },
];

export function ListenAndRepeat({ onBack }) {
  const gameProgress = useSelector((state) => state.rhythm.gameProgress);
  const dispatch = useDispatch();
  const [currentPattern, setCurrentPattern] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [micError, setMicError] = useState(null);
  const audioContext = React.useRef(null);
  const mediaRecorder = React.useRef(null);

  const playPattern = async () => {
    setIsPlaying(true);
    const audio = new Audio(rhythmPatterns[currentPattern].audio);
    audio.play();

    audio.onended = () => {
      setIsPlaying(false);
    };
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return stream;
    } catch (error) {
      if (error.name === "NotAllowedError") {
        setMicError(
          "Microphone access was denied. Please allow microphone access to record your rhythm."
        );
      } else if (error.name === "NotFoundError") {
        setMicError(
          "No microphone found. Please connect a microphone to continue."
        );
      } else {
        setMicError(
          "An error occurred while accessing the microphone. Please try again."
        );
      }
      throw error;
    }
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      const stream = await requestMicrophonePermission();
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (e) => {
        // Here you would analyze the recorded audio
        // For now, we'll simulate the result
        const isCorrect = Math.random() > 0.5;
        setResult(isCorrect);
        if (isCorrect) {
          dispatch({
            type: "UPDATE_GAME_PROGRESS",
            payload: {
              score: 10,
              completedExercises: 1,
            },
          });
        }
        setTimeout(() => {
          setCurrentPattern((prev) => (prev + 1) % rhythmPatterns.length);
          setResult(null);
        }, 1500);
      };

      mediaRecorder.current.start();
      setIsRecording(true);

      setTimeout(() => {
        if (
          mediaRecorder.current &&
          mediaRecorder.current.state === "recording"
        ) {
          mediaRecorder.current.stop();
          setIsRecording(false);
        }
      }, 3000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Rhythm Master
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              Listen and Repeat
            </h1>
            <div className="flex items-center space-x-6">
              <div className="text-lg">
                <span className="text-gray-600">Score: </span>
                <span className="font-semibold text-indigo-600">
                  {gameProgress.score}
                </span>
              </div>
              <div className="text-lg">
                <span className="text-gray-600">Completed: </span>
                <span className="font-semibold text-indigo-600">
                  {gameProgress.completedExercises}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-4xl font-musical mb-4">
                {rhythmPatterns[currentPattern].pattern}
              </div>
              <div className="text-sm text-gray-500 mb-4">
                Difficulty: {rhythmPatterns[currentPattern].difficulty}
              </div>
            </div>

            {micError && (
              <div className="flex items-center p-4 text-amber-700 bg-amber-50 rounded-lg">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <p>{micError}</p>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={playPattern}
                disabled={isPlaying || isRecording}
                className={`flex items-center px-6 py-3 rounded-lg ${
                  isPlaying
                    ? "bg-gray-100 text-gray-400"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                <Play className="h-5 w-5 mr-2" />
                {isPlaying ? "Playing..." : "Play Pattern"}
              </button>

              <button
                onClick={startRecording}
                disabled={isPlaying || isRecording}
                className={`flex items-center px-6 py-3 rounded-lg ${
                  isRecording
                    ? "bg-red-100 text-red-400"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                <Mic className="h-5 w-5 mr-2" />
                {isRecording ? "Recording..." : "Record Your Rhythm"}
              </button>
            </div>

            {result !== null && (
              <div
                className={`flex items-center justify-center p-4 rounded-lg ${
                  result ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {result ? (
                  <div className="flex items-center text-green-700">
                    <CheckCircle className="h-6 w-6 mr-2" />
                    Perfect rhythm! Keep going!
                  </div>
                ) : (
                  <div className="flex items-center text-red-700">
                    <XCircle className="h-6 w-6 mr-2" />
                    Try again! Listen carefully to the pattern.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
