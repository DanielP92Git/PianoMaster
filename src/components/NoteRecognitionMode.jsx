import React, { useState } from "react";
import doImage from "../assets/noteImages/do.jpg";
import reImage from "../assets/noteImages/re.jpg";
import miImage from "../assets/noteImages/mi.jpg";
import faImage from "../assets/noteImages/fa.jpg";
import solImage from "../assets/noteImages/sol.jpg";
import laImage from "../assets/noteImages/la.jpg";
import siImage from "../assets/noteImages/si.jpg";
import BackButton from "./BackButton";
import { updateStudentScore, getStudentScores } from "../services/apiScores";
import { useScores } from "../features/userData/useScores";

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

export function NoteRecognitionMode({ onBack }) {
  const [currentNote, setCurrentNote] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [wrongAnswer, setWrongAnswer] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
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

      // Check if the game is finished
      if (newTotalAttempts === notes.length * 2) {
        setGameFinished(true);
        updateScore({ score, gameType: "note-recognition" });
      }

      return newTotalAttempts;
    });

    // Check the answer
    // if the answer is wrong:
    if (answer !== notes[currentNote].note) {
      setWrongAnswer(true);
    } else { // if the answer is correct:
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
    setCurrentNote(getRandomNoteIndex(currentNote));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton to={"/practice-modes"} name={"Practice Modes"} />

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              Note Recognition
            </h1>
            <div className="flex items-center space-x-6">
              <div className="text-lg">
                <span className="text-gray-600">Score: </span>
                <span className="font-semibold text-indigo-600">{score}</span>
                {totalAttempts > 0 && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({Math.round((score / totalAttempts) * 100)}%)
                  </span>
                )}
              </div>
              <div className="text-lg">
                <span className="text-gray-600">Question: </span>
                <span className="font-semibold text-indigo-600">
                  {totalAttempts}/{notes.length * 2}
                </span>
              </div>
            </div>
          </div>

          {gameFinished ? (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-green-600">Finished!</h2>
              <p className="text-lg text-gray-700">
                You have completed the game.
              </p>
              <p className="text-lg text-gray-700">
                Your final score is {score} out of {notes.length * 2}.
              </p>
              <button
                className="mt-8 py-3 px-5 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={() => handleReset()}
              >
                Try Again
              </button>
            </div>
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
