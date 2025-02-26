import React, { useState } from "react";
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
  { note: "Do", image: doImage },
  { note: "Re", image: reImage },
  { note: "Mi", image: miImage },
  { note: "Fa", image: faImage },
  { note: "Sol", image: solImage },
  { note: "La", image: laImage },
  { note: "Si", image: siImage },
];

const options = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];

export function NoteRecognitionGame() {
  const [currentNote, setCurrentNote] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [wrongAnswer, setWrongAnswer] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const { updateScore } = useScores();

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
    <div className="min-h-screen ">
      {showFireworks && <Firework />}
      <div className="max-w-4xl mx-auto">
        

        <div className="bg-white/20 backdrop-blur-md  rounded-xl shadow-lg p-8">
        <BackButton to={"/note-recognition-mode"} name={"Note Recognition"} />
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-white">
              Note Recognition
            </h1>
            <div className="flex items-center space-x-6">
              <div className="text-lg">
                <span className="text-white">Score: </span>
                <span className="font-semibold text-indigo-200">{score}</span>
                {totalAttempts > 0 && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({scorePercentage}%)
                  </span>
                )}
              </div>
              <div className="text-lg">
                <span className="text-white">Question: </span>
                <span className="font-semibold text-indigo-200">
                  {totalAttempts}/{notes.length * 2}
                </span>
              </div>
            </div>
          </div>

          {gameFinished ? (
            <VictoryScreen
              score={score}
              totalPossibleScore={notes.length * 2}
              onReset={handleReset}
            />
          ) : (
            <div className="flex flex-col items-center gap-8">
              <div className="flex justify-center items-center bg-gray-50 rounded-lg p-8">
                <div className="w-48">
                  <img
                    src={notes[currentNote].image}
                    alt="Musical Note"
                    className="max-w-full h-auto"
                  />
                  {!totalAttempts ? (
                    ""
                  ) : (
                    <div
                      className={`${
                        wrongAnswer
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      } p-4 rounded-lg mt-4 text-lg font-semibold text-center`}
                    >
                      {wrongAnswer ? "Wrong Answer" : "Correct Answer"}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-row gap-4">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="w-full py-4 px-6 text-lg font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
