# usePitchDetection Hook

A reusable React hook for real-time pitch detection using the Web Audio API and autocorrelation algorithm.

## Features

- **Real-time pitch detection** using microphone input
- **Autocorrelation algorithm** for accurate frequency detection
- **Flexible note frequency mappings** (Hebrew and English notes)
- **Audio level monitoring** for visual feedback
- **Automatic activation** via `isActive` prop or manual control
- **Proper cleanup** to prevent memory leaks
- **TypeScript-friendly** with comprehensive JSDoc documentation

## Installation

The hook is already part of the project. Simply import it:

```javascript
import { usePitchDetection } from "@/hooks/usePitchDetection";
```

## Basic Usage

### Automatic Activation

```javascript
import { usePitchDetection } from "@/hooks/usePitchDetection";

function MyComponent() {
  const { detectedNote, isListening } = usePitchDetection({
    isActive: true, // Automatically starts listening
    onPitchDetected: (note, frequency) => {
      console.log(`Detected: ${note} at ${frequency.toFixed(2)} Hz`);
    },
  });

  return (
    <div>
      <p>Listening: {isListening ? "Yes" : "No"}</p>
      <p>Note: {detectedNote || "None"}</p>
    </div>
  );
}
```

### Manual Control

```javascript
function MyComponent() {
  const {
    detectedNote,
    detectedFrequency,
    audioLevel,
    isListening,
    startListening,
    stopListening,
  } = usePitchDetection();

  const handleToggle = async () => {
    if (isListening) {
      stopListening();
    } else {
      try {
        await startListening();
      } catch (error) {
        alert("Microphone access denied");
      }
    }
  };

  return (
    <div>
      <button onClick={handleToggle}>{isListening ? "Stop" : "Start"}</button>
      <p>Note: {detectedNote || "—"}</p>
      <p>
        Frequency:{" "}
        {detectedFrequency > 0 ? `${detectedFrequency.toFixed(2)} Hz` : "—"}
      </p>
      <div
        style={{
          width: `${audioLevel * 1000}%`,
          height: 20,
          background: "green",
        }}
      />
    </div>
  );
}
```

## API Reference

### Parameters

```typescript
usePitchDetection({
  isActive?: boolean,              // Default: false
  onPitchDetected?: Function,      // Callback: (note, frequency) => void
  onLevelChange?: Function,        // Callback: (level) => void
  noteFrequencies?: Object,        // Custom frequency mappings
  rmsThreshold?: number,           // Default: 0.01
  tolerance?: number               // Default: 0.05 (5%)
})
```

#### `isActive` (optional)

- Type: `boolean`
- Default: `false`
- Description: When `true`, automatically starts microphone listening on mount/activation

#### `onPitchDetected` (optional)

- Type: `(note: string, frequency: number) => void`
- Description: Callback fired when a note is detected
- Parameters:
  - `note`: Detected note name (e.g., 'C4', 'דו')
  - `frequency`: Detected frequency in Hz

#### `onLevelChange` (optional)

- Type: `(level: number) => void`
- Description: Callback fired on audio level changes
- Parameters:
  - `level`: Audio level (0-1)

#### `noteFrequencies` (optional)

- Type: `Object`
- Default: `DEFAULT_NOTE_FREQUENCIES` (includes Hebrew and English notes)
- Description: Custom note-to-frequency mappings
- Format:
  ```javascript
  {
    'C4': 261.63,               // Single frequency
    'דו': [261.63, 523.25, ...]  // Multiple octaves (array)
  }
  ```

#### `rmsThreshold` (optional)

- Type: `number`
- Default: `0.01`
- Description: Minimum signal strength required for pitch detection (0-1)

#### `tolerance` (optional)

- Type: `number`
- Default: `0.05` (5%)
- Description: Tolerance for note matching as a percentage (0-1)

### Return Values

```typescript
{
  detectedNote: string | null,
  detectedFrequency: number,
  audioLevel: number,
  isListening: boolean,
  startListening: () => Promise<void>,
  stopListening: () => void,
  audioContext: AudioContext | null,
  analyser: AnalyserNode | null,
  detectPitch: (buffer, sampleRate) => number,
  frequencyToNote: (frequency) => string | null
}
```

#### `detectedNote`

- Type: `string | null`
- Description: Currently detected note name, or `null` if no note detected

#### `detectedFrequency`

- Type: `number`
- Description: Detected frequency in Hz, or `-1` if no pitch detected

#### `audioLevel`

- Type: `number`
- Description: Current audio input level (0-1)

#### `isListening`

- Type: `boolean`
- Description: Whether microphone is currently active

#### `startListening()`

- Type: `async () => Promise<void>`
- Description: Starts microphone and begins pitch detection
- Throws: Error if microphone permission denied

#### `stopListening()`

- Type: `() => void`
- Description: Stops microphone and cleans up resources

#### `audioContext`, `analyser` (Advanced)

- Type: `AudioContext | null`, `AnalyserNode | null`
- Description: Direct access to Web Audio API nodes for advanced usage

#### `detectPitch()`, `frequencyToNote()` (Advanced)

- Type: Functions
- Description: Manual pitch detection and frequency conversion functions

## Examples

### Sight Reading Game Integration

```javascript
import { usePitchDetection } from "@/hooks/usePitchDetection";

function SightReadingGame() {
  const [expectedNote, setExpectedNote] = useState("C4");

  const { detectedNote, isListening, startListening } = usePitchDetection({
    isActive: false,
    noteFrequencies: {
      C4: 261.63,
      D4: 293.66,
      E4: 329.63,
      F4: 349.23,
      G4: 392.0,
      A4: 440.0,
      B4: 493.88,
      C5: 523.25,
    },
    onPitchDetected: (note, freq) => {
      if (note === expectedNote) {
        console.log("Correct note played!");
        // Move to next note...
      }
    },
    rmsThreshold: 0.015, // Slightly higher for accuracy
    tolerance: 0.03, // Tighter tolerance (3%)
  });

  return (
    <div>
      <button onClick={startListening}>Start Game</button>
      <p>Play: {expectedNote}</p>
      <p>Detected: {detectedNote || "—"}</p>
    </div>
  );
}
```

### Note Recognition Game Integration

```javascript
function NotesRecognitionGame() {
  const [currentQuestion, setCurrentQuestion] = useState("דו");

  const { detectedNote } = usePitchDetection({
    isActive: true, // Auto-start
    onPitchDetected: (note) => {
      if (note === currentQuestion) {
        console.log("Correct!");
        // Next question...
      }
    },
  });

  return (
    <div>
      <p>Which note is this? {currentQuestion}</p>
      <p>You played: {detectedNote || "—"}</p>
    </div>
  );
}
```

### Audio Level Visualization

```javascript
function AudioLevelMeter() {
  const { audioLevel, isListening, startListening, stopListening } =
    usePitchDetection({
      onLevelChange: (level) => {
        console.log(`Audio level: ${(level * 100).toFixed(1)}%`);
      },
    });

  return (
    <div>
      <button onClick={isListening ? stopListening : startListening}>
        Toggle
      </button>

      {/* Visual meter */}
      <div
        style={{
          width: "100%",
          height: 30,
          background: "#ddd",
          borderRadius: 5,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(audioLevel * 1000, 100)}%`,
            height: "100%",
            background: audioLevel > 0.05 ? "green" : "gray",
            transition: "width 0.1s",
          }}
        />
      </div>
    </div>
  );
}
```

## Technical Details

### Autocorrelation Algorithm

The hook uses the autocorrelation method to detect pitch:

1. **RMS Calculation**: Measures signal strength to filter out silence
2. **Autocorrelation Loop**: Finds the fundamental frequency by comparing the signal with time-shifted versions of itself
3. **Peak Detection**: Identifies the best correlation offset
4. **Frequency Calculation**: Converts offset to Hz using sample rate

### Note Frequency Mappings

The hook includes default frequencies for:

- **Hebrew notes**: דו, רה, מי, פה, סול, לה, סי (multiple octaves)
- **English notes**: C3-F5 range (single octave values)

### Browser Compatibility

Requires:

- `navigator.mediaDevices.getUserMedia()` - Microphone access
- `AudioContext` or `webkitAudioContext` - Web Audio API
- `requestAnimationFrame()` - Smooth detection loop

### Performance

- FFT Size: 2048 (good balance between accuracy and performance)
- Detection Rate: ~60 FPS (via requestAnimationFrame)
- Latency: ~20-50ms typical

## Troubleshooting

### Microphone Permission Denied

```javascript
try {
  await startListening();
} catch (error) {
  console.error("Microphone access error:", error);
  alert("Please allow microphone access in your browser settings");
}
```

### No Notes Detected

- Check `audioLevel` - is it registering input?
- Try lowering `rmsThreshold` (e.g., 0.005)
- Increase `tolerance` (e.g., 0.08 for 8%)
- Ensure your instrument/voice is loud enough

### Wrong Notes Detected

- Tighten `tolerance` (e.g., 0.03 for 3%)
- Increase `rmsThreshold` to filter noise
- Verify `noteFrequencies` mappings are correct
- Check for background noise interference

## Migration from Existing Code

To migrate from inline pitch detection in `NotesRecognitionGame.jsx`:

```javascript
// Before (inline)
const detectPitch = useCallback((buffer, sampleRate) => { ... }, []);
const frequencyToNote = useCallback((frequency) => { ... }, []);
// ... complex setup code ...

// After (with hook)
const { detectedNote, startListening, stopListening } = usePitchDetection({
  isActive: true,
  onPitchDetected: (note, freq) => {
    // Handle detection
  }
});
```

## License

Part of the PianoApp2 project.
