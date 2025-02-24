import React from 'react';

export function GameModeCard({ mode, onSelect }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <h3 className="text-xl font-bold text-gray-800 mb-2">{mode.name}</h3>
      <p className="text-gray-600 mb-4">{mode.description}</p>
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-sm ${
          mode.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
          mode.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {mode.difficulty}
        </span>
        <button 
          onClick={() => onSelect(mode)}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Start Practice →
        </button>
      </div>
    </div>
  );
}