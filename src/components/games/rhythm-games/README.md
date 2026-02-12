# Rhythm Games - Refactored Architecture

This folder contains a clean, modular rhythm training system with improved pattern generation and reusable UI components.

## 🏗️ Architecture

### Core Components

#### 1. `RhythmPatternGenerator.js` - Enhanced Pattern Generation

- **Constants for precise durations** - Avoids floating-point errors
- **Global subdivision definitions** - Per time signature (4/4, 3/4, 2/4, 6/8)
- **Rule-based variation** - Instead of random flipping
- **Musical safeguards** - Ensures pedagogical coherence
- **Adaptive difficulty** - Adjusts based on user performance

#### 2. Ready for New Game Implementation

The main game components have been removed to allow for a fresh start with the improved architecture.

### 🎨 UI Components (`/components/`)

#### `MetronomeDisplay.jsx`

- **Visual metronome** with beat indicators
- **Time signature display** with strong/weak beat emphasis
- **Configurable** title and instructions

#### `TapArea.jsx`

- **Interactive tap area** with visual feedback
- **Timing accuracy display** (Perfect/Good/Fair/Miss)
- **Customizable** title and subtitle

#### `RhythmGameSettings.jsx`

- **Settings modal** for game configuration
- **Difficulty selection** with descriptions
- **Time signature** and tempo controls
- **Adaptive difficulty** toggle

#### `PatternDisplay.jsx`

- **Pattern visualization** with beat indicators
- **Progress tracking** with visual progress bar
- **Flexible sizing** (sm/md/lg) for different contexts

#### `GameControls.jsx`

- **Play/pause/reset** controls
- **Settings button** integration
- **Floating settings** button variant

#### `RhythmGameSetup.jsx`

- **Full-screen settings** interface for game setup
- **Difficulty and time signature** selection
- **Tempo control** with visual slider
- **Adaptive difficulty** toggle

## 🎵 Enhanced Pattern Generation Features

### Rule-Based Generation

- **Strong/Medium/Weak Beat Logic** - Musically appropriate sound placement
- **Difficulty-Specific Rules** - Different complexity levels with appropriate constraints
- **Syncopation Control** - Allowed for intermediate/advanced, blocked for beginners
- **Musical Safeguards** - Prevents excessive rests, ensures pedagogical coherence

### Precise Duration System

```javascript
export const DURATION_CONSTANTS = {
  WHOLE: 16, // Whole note = 16 sixteenth notes
  HALF: 8, // Half note = 8 sixteenth notes
  QUARTER: 4, // Quarter note = 4 sixteenth notes
  EIGHTH: 2, // Eighth note = 2 sixteenth notes
  SIXTEENTH: 1, // Sixteenth note = 1 sixteenth note
  // ... dotted notes and triplets
};
```

### Time Signature Definitions

```javascript
export const TIME_SIGNATURES = {
  FOUR_FOUR: {
    name: "4/4",
    beats: 4,
    subdivision: 16, // 16th note subdivision
    strongBeats: [0], // Beat 1 is strongest
    mediumBeats: [2], // Beat 3 is medium strong
    weakBeats: [1, 3], // Beats 2 and 4 are weak
  },
  // ... other time signatures
};
```

## 🚀 Ready for Fresh Start

The rhythm game system has been cleaned up and is ready for rebuilding with:

### 🎯 **Available Components**

- ✅ **Enhanced Pattern Generator** - Rule-based, musical logic
- ✅ **Modular UI Components** - Metronome, tap area, settings, pattern display
- ✅ **Pre-game Settings Screen** - Full-screen configuration interface
- ✅ **Clean Architecture** - No legacy code or duplicate logic

### 📁 **Current Structure**

```
src/components/games/rhythm-games/
├── components/              # 🎨 Ready-to-use UI components
│   ├── MetronomeDisplay.jsx # Visual metronome
│   ├── TapArea.jsx         # Interactive tap area
│   ├── RhythmGameSettings.jsx # Settings modal
│   ├── PatternDisplay.jsx  # Pattern visualization
│   ├── GameControls.jsx    # Control buttons
│   ├── RhythmGameSetup.jsx # Full-screen setup
│   └── index.js           # Clean exports
├── RhythmPatternGenerator.js # 🎵 Enhanced pattern logic
└── README.md              # 📚 Documentation
```

### 🎮 Usage Examples

#### Basic Pattern Generation

```javascript
import {
  createPatternGenerator,
  DIFFICULTY_LEVELS,
  TIME_SIGNATURES,
} from "./RhythmPatternGenerator";

const generator = createPatternGenerator();
const pattern = await generator.generatePattern(
  DIFFICULTY_LEVELS.INTERMEDIATE,
  TIME_SIGNATURES.FOUR_FOUR
);
```

#### Using UI Components

```javascript
import {
  MetronomeDisplay,
  TapArea,
  RhythmGameSettings,
  PatternDisplay,
  RhythmGameSetup
} from './components';

// Pre-game setup screen
<RhythmGameSetup
  settings={gameSettings}
  onUpdateSettings={setGameSettings}
  onStart={startGame}
/>

// Metronome display
<MetronomeDisplay
  currentBeat={currentBeat}
  timeSignature={timeSignature}
  isActive={isPlaying}
/>

// Interactive tap area
<TapArea
  onTap={handleTap}
  feedback={feedback}
  isActive={gamePhase === 'user-performance'}
/>
```

## Audio System Integration

### Audio Engine (useAudioEngine)

```javascript
// Initialize audio engine
const audioEngine = useAudioEngine(120); // 120 BPM

// Play piano sound immediately
audioEngine.playPianoSound(0.6, 1.0); // volume, pitch

// Create scheduled piano sound
audioEngine.createPianoSound(time, 0.6, 1.0);
```

### Sounds Hook (useSounds)

```javascript
// For simpler audio needs
const { playPianoSound } = useSounds();

// Play piano sound
playPianoSound(0.7); // volume level
```

## Features

- **Authentic Piano Sound**: Uses actual F4 piano recording
- **Precise Timing**: Web Audio API for accurate rhythm timing
- **Fallback System**: Synthetic sounds if piano file fails to load
- **Volume Control**: Adjustable volume levels for different contexts
- **Pitch Control**: Playback rate adjustment for pitch variation

## File Locations

- Piano Sound: `/src/assets/sounds/piano/F4.mp3`
- Audio Engine: `/src/hooks/useAudioEngine.js`
- Sounds Hook: `/src/features/games/hooks/useSounds.js`

## Usage Examples

### Basic User Tap Feedback

```javascript
const handleTap = () => {
  // Play piano sound on tap
  if (audioEngine.playPianoSound) {
    audioEngine.playPianoSound(0.4, 1.0);
  }
};
```

### Rhythm Pattern Playback

```javascript
const playPattern = () => {
  const pattern = [1, 0, 1, 0]; // Rhythm pattern
  const beatDuration = 500; // 500ms per beat

  pattern.forEach((beat, index) => {
    if (beat === 1) {
      setTimeout(() => {
        audioEngine.playPianoSound(0.6, 1.0);
      }, index * beatDuration);
    }
  });
};
```

### Composition Playback

```javascript
const playComposition = () => {
  let totalDelay = 0;
  composition.forEach((bar) => {
    bar.forEach((rhythm) => {
      setTimeout(() => {
        playPianoSound(0.6);
      }, totalDelay);
      totalDelay += beatDuration * rhythm.duration;
    });
  });
};
```

## Benefits

1. **Authentic Sound**: Real piano sound instead of synthetic beeps
2. **Consistent Experience**: Same sound across all rhythm games
3. **Better Learning**: More musical and engaging feedback
4. **Professional Quality**: High-quality F4 piano recording
5. **Performance**: Optimized loading and playback system
