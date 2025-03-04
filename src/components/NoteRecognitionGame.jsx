import React, { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import doImage from "../assets/noteImages/do.jpg";
import reImage from "../assets/noteImages/re.jpg";
import miImage from "../assets/noteImages/mi.jpg";
import faImage from "../assets/noteImages/fa.jpg";
import solImage from "../assets/noteImages/sol.jpg";
import laImage from "../assets/noteImages/la.jpg";
import siImage from "../assets/noteImages/si.jpg";

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

export function NoteRecognitionGame({ onBack }) {
  const [currentNote, setCurrentNote] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAnswer = (answer) => {
    if (answer === notes[currentNote].note) {
      setScore(score + 1);
    }
    setTotalAttempts(totalAttempts + 1);
    setCurrentNote((prev) => (prev + 1) % notes.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 sm:mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Note Recognition
            </h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <div className="text-base sm:text-lg">
                <span className="text-gray-600">Score: </span>
                <span className="font-semibold text-indigo-600">{score}</span>
                {totalAttempts > 0 && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({Math.round((score / totalAttempts) * 100)}%)
                  </span>
                )}
              </div>
              <div className="text-base sm:text-lg">
                <span className="text-gray-600">Question: </span>
                <span className="font-semibold text-indigo-600">
                  {currentNote + 1}/{notes.length}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div
              className="flex justify-center items-center bg-gray-50 rounded-lg p-4 sm:p-8 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setIsModalOpen(true)}
            >
              <div className="w-full sm:w-64 md:w-72">
                <img
                  src={notes[currentNote].image}
                  alt="Musical Note"
                  className="max-w-full h-auto"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="w-full py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for expanded view */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <img
              src={notes[currentNote].image}
              alt="Musical Note"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
