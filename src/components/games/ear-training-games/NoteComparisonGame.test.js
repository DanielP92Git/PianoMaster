import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock all external hooks and dependencies
// ---------------------------------------------------------------------------
// NOTE_FREQS must be exported so earTrainingUtils.js can import it
// Inline the object inside the factory to avoid hoisting issues
vi.mock('../../../hooks/usePianoSampler', () => ({
  usePianoSampler: () => ({ playNote: vi.fn() }),
  NOTE_FREQS: {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56,
    'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00,
    'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
    'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
    'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  },
}));

vi.mock('../../../contexts/AudioContextProvider', () => ({
  useAudioContext: () => ({
    audioContextRef: { current: { currentTime: 0 } },
    isInterrupted: false,
    handleTapToResume: vi.fn(),
    getOrCreateAudioContext: vi.fn(() => ({ currentTime: 0 })),
  }),
}));

vi.mock('../../../features/games/hooks/useSounds', () => ({
  useSounds: () => ({
    playCorrectSound: vi.fn(),
    playWrongSound: vi.fn(),
  }),
}));

vi.mock('../../../contexts/SessionTimeoutContext', () => ({
  useSessionTimeout: () => ({
    pauseTimer: vi.fn(),
    resumeTimer: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useRotatePrompt', () => ({
  useRotatePrompt: () => ({
    shouldShowPrompt: false,
    dismissPrompt: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useLandscapeLock', () => ({
  useLandscapeLock: vi.fn(),
}));

vi.mock('../../../contexts/AccessibilityContext', () => ({
  useAccessibility: () => ({ reducedMotion: false }),
}));

vi.mock('../../../data/skillTrail', () => ({
  getNodeById: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue ?? key,
    i18n: { dir: () => 'ltr', language: 'en' },
  }),
}));

// Mock VictoryScreen — use React.createElement to avoid JSX in .js file
vi.mock('../VictoryScreen', () => ({
  default: function MockVictoryScreen({ score, totalPossibleScore }) {
    return React.createElement(
      'div',
      { 'data-testid': 'victory-screen' },
      `VictoryScreen ${score}/${totalPossibleScore}`
    );
  },
}));

// Mock PianoKeyboardReveal — use React.createElement to avoid JSX in .js file
vi.mock('./components/PianoKeyboardReveal', () => ({
  PianoKeyboardReveal: function MockPianoKeyboardReveal({ visible }) {
    return React.createElement('div', {
      'data-testid': 'piano-keyboard-reveal',
      'data-visible': String(visible),
    });
  },
}));

// ---------------------------------------------------------------------------
// Import component after mocks are set up
// ---------------------------------------------------------------------------
import NoteComparisonGame from './NoteComparisonGame';

// ---------------------------------------------------------------------------
// Test helper: render within MemoryRouter with optional route state
// ---------------------------------------------------------------------------
function renderGame(routeState = null) {
  const initialEntries = routeState
    ? [{ pathname: '/ear-training-mode/note-comparison-game', state: routeState }]
    : [{ pathname: '/ear-training-mode/note-comparison-game' }];
  return render(
    React.createElement(
      MemoryRouter,
      { initialEntries },
      React.createElement(NoteComparisonGame)
    )
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('NoteComparisonGame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders setup screen with start button', () => {
    renderGame();
    const startButton = screen.getByText('Start Game');
    expect(startButton).toBeTruthy();
  });

  it('transitions to LISTENING phase when start is clicked', async () => {
    renderGame();
    const startButton = screen.getByText('Start Game');

    await act(async () => {
      fireEvent.click(startButton);
    });

    // LISTENING phase shows listening text
    expect(screen.getByText('Listen...')).toBeTruthy();
  });

  it('renders HIGHER and LOWER answer buttons after advancing past LISTENING', async () => {
    renderGame();
    const startButton = screen.getByText('Start Game');

    await act(async () => {
      fireEvent.click(startButton);
    });

    // Advance past the note playback timer so CHOOSING phase is reached
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Both answer buttons should be visible
    expect(screen.getByText('HIGHER')).toBeTruthy();
    expect(screen.getByText('LOWER')).toBeTruthy();
  });

  it('HIGHER button has correct aria-label', async () => {
    renderGame();
    const startButton = screen.getByText('Start Game');

    await act(async () => {
      fireEvent.click(startButton);
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    const higherButton = screen.getByLabelText('Higher');
    expect(higherButton).toBeTruthy();
  });

  it('LOWER button has correct aria-label', async () => {
    renderGame();
    const startButton = screen.getByText('Start Game');

    await act(async () => {
      fireEvent.click(startButton);
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    const lowerButton = screen.getByLabelText('Lower');
    expect(lowerButton).toBeTruthy();
  });

  it('disables buttons during LISTENING phase', async () => {
    renderGame();
    const startButton = screen.getByText('Start Game');

    await act(async () => {
      fireEvent.click(startButton);
    });

    // During LISTENING, answer buttons should be disabled
    const buttons = screen.getAllByRole('button');
    const higherButton = buttons.find((b) => b.getAttribute('aria-label') === 'Higher');
    const lowerButton = buttons.find((b) => b.getAttribute('aria-label') === 'Lower');

    expect(higherButton?.disabled).toBe(true);
    expect(lowerButton?.disabled).toBe(true);
  });

  it('renders VictoryScreen after all 10 questions are completed', async () => {
    renderGame();
    const startButton = screen.getByText('Start Game');

    await act(async () => {
      fireEvent.click(startButton);
    });

    // Simulate completing all 10 questions by advancing through timeouts
    for (let i = 0; i < 10; i++) {
      // Advance past note playback (LISTENING -> CHOOSING)
      await act(async () => {
        vi.advanceTimersByTime(2500);
      });

      // Click one of the answer buttons if available
      await act(async () => {
        const buttons = screen.queryAllByRole('button');
        const higherBtn = buttons.find(
          (b) => b.getAttribute('aria-label') === 'Higher' && !b.disabled
        );
        if (higherBtn) {
          fireEvent.click(higherBtn);
        }
      });

      // Advance past feedback timeout (FEEDBACK -> next question)
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
    }

    // After 10 questions, VictoryScreen should render
    const victoryScreen = screen.queryByTestId('victory-screen');
    expect(victoryScreen).toBeTruthy();
  });

  it('shows piano keyboard reveal after answering a question', async () => {
    renderGame();
    const startButton = screen.getByText('Start Game');

    await act(async () => {
      fireEvent.click(startButton);
    });

    // Advance to CHOOSING phase
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    // Click HIGHER or LOWER
    await act(async () => {
      const buttons = screen.queryAllByRole('button');
      const higherBtn = buttons.find(
        (b) => b.getAttribute('aria-label') === 'Higher' && !b.disabled
      );
      if (higherBtn) {
        fireEvent.click(higherBtn);
      }
    });

    // After 100ms, keyboard should be visible
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    const keyboard = screen.queryByTestId('piano-keyboard-reveal');
    expect(keyboard).toBeTruthy();
  });
});
