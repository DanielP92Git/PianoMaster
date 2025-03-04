import React, { useState, useEffect } from "react";
import doImage from "../../../assets/noteImages/do.jpg";
import reImage from "../../../assets/noteImages/re.jpg";
import miImage from "../../../assets/noteImages/mi.jpg";
import faImage from "../../../assets/noteImages/fa.jpg";
import solImage from "../../../assets/noteImages/sol.jpg";
import laImage from "../../../assets/noteImages/la.jpg";
import siImage from "../../../assets/noteImages/si.jpg";
import BackButton from "../../ui/BackButton";
import { useScores } from "../../../features/userData/useScores";
import { Firework } from "../../animations/Firework";
import VictoryScreen from "../VictoryScreen";

const notes = [
  { note: "דו", image: doImage },
  { note: "רה", image: reImage },
  { note: "מי", image: miImage },
  { note: "פה", image: faImage },
  { note: "סול", image: solImage },
  { note: "לה", image: laImage },
  { note: "סי", image: siImage },
];

const options = ["דו", "רה", "מי", "פה", "סול", "לה", "סי"];

export function NoteRecognitionGame() {
  const [currentNote, setCurrentNote] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [wrongAnswer, setWrongAnswer] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const { updateScore } = useScores();

  // Add screen orientation logic
  // useEffect(() => {
  //   const lockOrientation = async () => {
  //     try {
  //       if (screen.orientation && screen.orientation.lock) {
  //         await screen.orientation.lock("landscape");
  //       }
  //     } catch (error) {
  //       console.log("Orientation lock failed:", error);
  //     }
  //   };

  //   lockOrientation();

  //   return () => {
  //     if (screen.orientation && screen.orientation.unlock) {
  //       screen.orientation.unlock();
  //     }
  //   };
  // }, []);

  const getRandomNoteIndex = (currentIndex) => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * notes.length);
    } while (newIndex === currentIndex);
    return newIndex;
  };

  const handleAnswer = (answer) => {
    setTotalAttempts((prevTotalAttempts) => {
      const newTotalAttempts = prevTotalAttempts + 1;

      if (newTotalAttempts === notes.length * 2) {
        setGameFinished(true);
        updateScore({ score, gameType: "note-recognition" });

        const finalScore =
          ((score + (answer === notes[currentNote].note ? 1 : 0)) /
            (notes.length * 2)) *
          100;
        if (finalScore >= 80) {
          setShowFireworks(true);
          setTimeout(() => setShowFireworks(false), 2000);
        }
      }

      return newTotalAttempts;
    });

    if (answer !== notes[currentNote].note) {
      setWrongAnswer(true);
    } else {
      setScore((prevScore) => prevScore + 1);
      setWrongAnswer(false);
      setCurrentNote(getRandomNoteIndex(currentNote));
    }
  };

  const handleReset = () => {
    setScore(0);
    setTotalAttempts(0);
    setWrongAnswer(false);
    setGameFinished(false);
    setShowFireworks(false);
    setCurrentNote(getRandomNoteIndex(currentNote));
  };

  const scorePercentage =
    totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-purple-600 to-purple-900">
      {showFireworks && <Firework />}
      <div className="h-full w-full p-2 sm:p-4">
        <div className="h-full bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-2 sm:p-4">
          <div className="h-full flex flex-col">
            {/* Header section */}
            <div className="flex justify-between items-center mb-2 sm:mb-4">
              <BackButton
                to={"/note-recognition-mode"}
                name={"Note Recognition"}
              />
              <div className="flex items-center space-x-2 sm:space-x-4 text-sm">
                <div>
                  <span className="text-white">Score: </span>
                  <span className="font-semibold text-indigo-200">{score}</span>
                  {totalAttempts > 0 && (
                    <span className="text-sm text-gray-300 ml-2">
                      ({scorePercentage}%)
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-white">Question: </span>
                  <span className="font-semibold text-indigo-200">
                    {totalAttempts}/{notes.length * 2}
                  </span>
                </div>
              </div>
            </div>

            {/* Main content section */}
            {gameFinished ? (
              <VictoryScreen
                score={score}
                totalPossibleScore={notes.length * 2}
                onReset={handleReset}
              />
            ) : (
              <div className="flex-1 flex items-center gap-2 sm:gap-4">
                {/* Note display section */}
                <div className="w-1/2 h-full flex items-center justify-center bg-white rounded-lg p-2 sm:p-4">
                  <div className="flex flex-col items-center w-full h-full max-h-[400px]">
                    <div className="flex-1 w-full flex items-center justify-center min-h-0">
                      <div className="relative w-full h-full max-h-[250px] flex items-center justify-center">
                        <img
                          src={notes[currentNote].image}
                          alt="Musical Note"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                    {totalAttempts > 0 && (
                      <div
                        className={`${
                          wrongAnswer
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        } p-2 rounded-lg mt-2 text-xs sm:text-sm font-semibold text-center w-full`}
                      >
                        {wrongAnswer ? "Wrong Answer" : "Correct Answer"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Options section */}
                <div className="w-1/2 h-full flex items-center">
                  <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        className="w-full py-2 px-3 text-sm sm:text-base font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rotation reminder */}
      <div className="md:hidden fixed inset-0 bg-purple-900 text-white flex items-center justify-center transform rotate-90 z-50 portrait:flex landscape:hidden">
        <p className="text-xl font-bold">
          Please rotate your device to landscape mode
        </p>
      </div>
    </div>
  );
}
