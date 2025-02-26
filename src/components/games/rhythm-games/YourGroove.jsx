import React, { useState } from "react";
import { ArrowLeft, Settings, Plus, Minus, X } from "lucide-react";
import BackButton from "../../ui/BackButton";
const rhythmOptions = {
  basic: [
    { id: 1, symbol: "♩", name: "Quarter Note", duration: 1 },
    { id: 2, symbol: "♪♪", name: "Eighth Notes", duration: 1 },
    { id: 3, symbol: "𝅗𝅥", name: "Half Note", duration: 2 },
    { id: 4, symbol: "𝅝", name: "Whole Note", duration: 4 },
  ],
  advanced: [
    { id: 5, symbol: "♪♪♪", name: "Triplet", duration: 1 },
    { id: 6, symbol: "𝅘𝅥𝅮", name: "Dotted Quarter", duration: 1.5 },
    { id: 7, symbol: "𝅘𝅥𝅯𝅘𝅥𝅯", name: "Sixteenth Notes", duration: 0.5 },
  ],
};

const timeSignatures = ["4/4", "3/4", "2/4", "6/8"];

export function YourGroove({ onBack }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRhythms, setSelectedRhythms] = useState(["basic"]);
  const [timeSignature, setTimeSignature] = useState("4/4");
  const [numberOfBars, setNumberOfBars] = useState(4);
  const [composition, setComposition] = useState(Array(numberOfBars).fill([]));

  const handleRhythmSelect = (rhythm) => {
    const newBar = [...composition[0], rhythm];
    setComposition([newBar, ...composition.slice(1)]);
  };

  const handleBarChange = (newCount) => {
    if (newCount < composition.length) {
      setComposition(composition.slice(0, newCount));
    } else {
      setComposition([
        ...composition,
        ...Array(newCount - composition.length).fill([]),
      ]);
    }
    setNumberOfBars(newCount);
  };

  const removeNoteFromBar = (barIndex, noteIndex) => {
    const newComposition = [...composition];
    newComposition[barIndex] = [
      ...composition[barIndex].slice(0, noteIndex),
      ...composition[barIndex].slice(noteIndex + 1),
    ];
    setComposition(newComposition);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <BackButton
          to="/rhythm-mode"
          name="Rhythm Games"
          className="text-white/80 hover:text-white transition-colors"
        />

        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Your Groove</h1>
          <p className="text-gray-300">Create your own rhythm patterns</p>
        </div>

        {/* Main Content */}
        <div className="flex gap-4 lg:gap-8">
          <div className="flex-1">
            {/* Rhythm Options */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 lg:p-6 mb-4 lg:mb-8">
              <h2 className="text-xl font-bold text-white mb-4">
                Available Rhythms
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(rhythmOptions)
                  .filter(([category]) => selectedRhythms.includes(category))
                  .map(([_, rhythms]) =>
                    rhythms.map((rhythm) => (
                      <button
                        key={rhythm.id}
                        onClick={() => handleRhythmSelect(rhythm)}
                        className="p-4 text-2xl bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-white"
                      >
                        {rhythm.symbol}
                      </button>
                    ))
                  )}
              </div>
            </div>

            {/* Composition Area */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 lg:p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Your Composition
              </h2>
              <div className="space-y-4">
                {composition.map((bar, barIndex) => (
                  <div
                    key={barIndex}
                    className="border border-white/20 rounded-lg p-4 min-h-[80px] flex items-center bg-white/5"
                  >
                    <span className="text-gray-300 mr-4">
                      Bar {barIndex + 1}
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {bar.map((note, noteIndex) => (
                        <div key={noteIndex} className="relative group">
                          <span className="text-2xl text-white">
                            {note.symbol}
                          </span>
                          <button
                            onClick={() =>
                              removeNoteFromBar(barIndex, noteIndex)
                            }
                            className="absolute -top-2 -right-2 hidden group-hover:flex bg-red-500 text-white rounded-full p-1 w-5 h-5 items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Sidebar */}
          <div
            className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? "translate-x-0" : "translate-x-full"
            } z-50`}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-gray-800">Settings</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Rhythm Types */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Rhythm Types
                </h3>
                <div className="space-y-2">
                  {Object.keys(rhythmOptions).map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedRhythms.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRhythms([...selectedRhythms, type]);
                          } else {
                            setSelectedRhythms(
                              selectedRhythms.filter((t) => t !== type)
                            );
                          }
                        }}
                        className="mr-2"
                      />
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Time Signature */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Time Signature
                </h3>
                <select
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  {timeSignatures.map((sig) => (
                    <option key={sig} value={sig}>
                      {sig}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Bars */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Number of Bars
                </h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() =>
                      handleBarChange(Math.max(1, numberOfBars - 1))
                    }
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-xl font-semibold">{numberOfBars}</span>
                  <button
                    onClick={() => handleBarChange(numberOfBars + 1)}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
