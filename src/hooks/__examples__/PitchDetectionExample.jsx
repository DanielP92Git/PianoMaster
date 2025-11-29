/**
 * Example component demonstrating usePitchDetection hook usage
 * 
 * This is a reference implementation showing how to integrate the hook
 * into a React component for real-time pitch detection.
 */

import React from 'react';
import { usePitchDetection } from '../usePitchDetection';

export function PitchDetectionExample() {
  const {
    detectedNote,
    detectedFrequency,
    audioLevel,
    isListening,
    startListening,
    stopListening
  } = usePitchDetection({
    // Auto-start disabled - manual control via button
    isActive: false,
    
    // Optional callbacks
    onPitchDetected: (note, freq) => {
      console.log(`Note detected: ${note} at ${freq.toFixed(2)} Hz`);
    },
    onLevelChange: (level) => {
      // Could use this for visual feedback
    },
    
    // Optional custom configuration
    rmsThreshold: 0.01,
    tolerance: 0.05
  });

  const handleToggle = async () => {
    if (isListening) {
      stopListening();
    } else {
      try {
        await startListening();
      } catch (error) {
        alert('Microphone access denied or not available');
      }
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Pitch Detection Demo</h2>
      
      {/* Control Button */}
      <button
        onClick={handleToggle}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {isListening ? '🛑 Stop Listening' : '🎤 Start Listening'}
      </button>

      {/* Status Display */}
      {isListening && (
        <div className="mt-6 space-y-4">
          {/* Audio Level Meter */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Audio Level</label>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(audioLevel * 1000, 100)}%` }}
              />
            </div>
          </div>

          {/* Detected Note */}
          <div className="text-center">
            <label className="text-sm text-gray-600 mb-1 block">Detected Note</label>
            <div className="text-4xl font-bold text-purple-600">
              {detectedNote || '—'}
            </div>
          </div>

          {/* Detected Frequency */}
          <div className="text-center">
            <label className="text-sm text-gray-600 mb-1 block">Frequency</label>
            <div className="text-2xl font-mono text-gray-700">
              {detectedFrequency > 0 ? `${detectedFrequency.toFixed(2)} Hz` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          {isListening
            ? '🎵 Play or sing a note to see it detected in real-time!'
            : '👆 Click "Start Listening" to begin pitch detection'}
        </p>
      </div>
    </div>
  );
}

/**
 * Example with automatic activation (isActive prop)
 */
export function AutoActivePitchDetection() {
  const [active, setActive] = React.useState(false);
  
  const { detectedNote, isListening } = usePitchDetection({
    isActive: active,
    onPitchDetected: (note, freq) => {
      console.log(`Auto-detected: ${note} at ${freq.toFixed(2)} Hz`);
    }
  });

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Auto-Active Example</h2>
      
      <button
        onClick={() => setActive(!active)}
        className={`w-full py-3 px-6 rounded-lg font-semibold ${
          active ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        }`}
      >
        {active ? 'Deactivate' : 'Activate'}
      </button>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">Status: {isListening ? '🎤 Listening' : '🔇 Silent'}</p>
        <p className="text-2xl font-bold mt-2">{detectedNote || '—'}</p>
      </div>
    </div>
  );
}

/**
 * Example with custom note frequencies (sight reading game style)
 */
export function SightReadingPitchDetection() {
  const customFrequencies = {
    'C4': 261.63,
    'D4': 293.66,
    'E4': 329.63,
    'F4': 349.23,
    'G4': 392.00,
    'A4': 440.00,
    'B4': 493.88,
    'C5': 523.25
  };

  const { detectedNote, startListening, stopListening, isListening } = usePitchDetection({
    noteFrequencies: customFrequencies,
    rmsThreshold: 0.015, // Slightly higher threshold
    tolerance: 0.03      // Tighter tolerance for accuracy
  });

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Sight Reading Mode</h2>
      <p className="text-sm text-gray-600 mb-4">Only detects notes C4-C5</p>
      
      <button
        onClick={() => isListening ? stopListening() : startListening()}
        className="w-full py-3 px-6 rounded-lg font-semibold bg-purple-500 text-white"
      >
        {isListening ? 'Stop' : 'Start'}
      </button>

      {isListening && (
        <div className="mt-4 text-center">
          <div className="text-4xl font-bold text-purple-600">
            {detectedNote || 'Play C4-C5'}
          </div>
        </div>
      )}
    </div>
  );
}

