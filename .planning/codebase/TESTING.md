# Testing Patterns

**Analysis Date:** 2026-03-23

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: `vitest.config.js`
- Environment: jsdom
- Globals: enabled (`describe`, `it`, `test`, `expect`, `vi` available without import)
- Setup file: `src/test/setupTests.js`

**Assertion Library:**
- Vitest built-in `expect` (Jest-compatible)
- `@testing-library/jest-dom` (DOM matchers like `toBeInTheDocument()`, imported in setup file)

**React Testing:**
- `@testing-library/react` 16.3.0 (`render`, `screen`, `act`, `fireEvent`, `waitFor`, `renderHook`)

**Run Commands:**
```bash
npm run test              # Vitest in watch mode
npm run test:run          # Single run (CI-friendly)
npx vitest run src/path/to/file.test.js  # Single file
```

## Test Configuration

**`vitest.config.js`:**
```javascript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setupTests.js"],
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
  },
});
```

**`src/test/setupTests.js`:**
```javascript
import "@testing-library/jest-dom/vitest";

// Polyfill requestAnimationFrame for fake timers
if (typeof globalThis.requestAnimationFrame !== "function") {
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
}
if (typeof globalThis.cancelAnimationFrame !== "function") {
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}
```

Note: The setup file polyfills `requestAnimationFrame` for jsdom since many game components use RAF-based timing loops (metronome, timeline playback, count-up animations).

## Test File Organization

**Location:** Mixed -- both co-located and `__tests__/` directories:
- Co-located: `src/utils/xpSystem.test.js` alongside `src/utils/xpSystem.js`
- Co-located: `src/components/games/sight-reading-game/utils/patternBuilder.test.js`
- Co-located: `src/data/units/rhythmUnit7Redesigned.test.js`
- `__tests__/` dir: `src/hooks/__tests__/usePitchDetection.test.js`
- `__tests__/` dir: `src/services/__tests__/subscriptionService.test.js`
- `__tests__/` dir: `src/components/games/sight-reading-game/__tests__/enharmonicMatching.test.js`

**Naming:** `{module}.test.{js,jsx}` -- matches the source file name. For specific scenarios: `SightReadingGame.micRestart.test.jsx`, `NotesRecognitionGame.autogrow.test.js`.

**All test files (14 total):**
```
src/
├── utils/
│   └── xpSystem.test.js                                         # XP/level calculations, prestige tiers
├── hooks/
│   └── __tests__/
│       └── usePitchDetection.test.js                             # Hook smoke tests (init, config, API shape)
├── services/
│   └── __tests__/
│       ├── subscriptionService.test.js                           # Subscription status logic (grace periods, trials)
│       └── webhookLogic.test.js                                  # Webhook payload extraction, HMAC verification, routing
├── data/
│   └── units/
│       ├── rhythmUnit7Redesigned.test.js                         # Unit 7 node structure, prereqs, config validation
│       └── rhythmUnit8Redesigned.test.js                         # Unit 8 node structure, syncopation config
├── components/
│   ├── settings/
│   │   └── FeedbackForm.test.jsx                                 # Component state machine, form validation, submission
│   └── games/
│       ├── notes-master-games/
│       │   └── NotesRecognitionGame.autogrow.test.js             # Auto-grow boundary guard (accidental filtering)
│       └── sight-reading-game/
│           ├── SightReadingGame.micRestart.test.jsx              # Mic lifecycle (start/stop/restart)
│           ├── __tests__/
│           │   └── enharmonicMatching.test.js                    # MIDI enharmonic equivalence (C#4 === Db4)
│           └── utils/
│               ├── beamGroupUtils.test.js                        # VexFlow beam group calculation for compound meters
│               ├── patternBuilder.test.js                        # Music pattern generation, noBeam tagging, multi-bar
│               ├── keySignatureUtils.test.js                     # Key signature note filtering and mapping
│               └── rhythmGenerator.test.js                       # Rhythm event generation, duration constraints
```

## Test Structure

**Suite Organization (pure utility tests):**
```javascript
import { describe, it, expect } from 'vitest';
import { XP_LEVELS, calculateLevel, getLevelProgress } from './xpSystem';

describe('XP_LEVELS array', () => {
  it('has exactly 30 entries', () => {
    expect(XP_LEVELS).toHaveLength(30);
  });

  it('has strictly increasing XP thresholds', () => {
    for (let i = 1; i < XP_LEVELS.length; i++) {
      expect(XP_LEVELS[i].xpRequired).toBeGreaterThan(XP_LEVELS[i - 1].xpRequired);
    }
  });
});
```

**Suite Organization (service tests with mocks):**
```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted() + vi.mock() pattern (see Mocking section)

describe("fetchSubscriptionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-wire mock chain after clearAllMocks
    mockEq.mockImplementation(() => ({ maybeSingle: mockMaybeSingle }));
    mockSelect.mockImplementation(() => ({ eq: mockEq }));
    mockFrom.mockImplementation(() => ({ select: mockSelect }));
  });

  it("returns isPremium: false for null studentId", async () => {
    const result = await fetchSubscriptionStatus(null);
    expect(result).toEqual({ isPremium: false });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
```

**Suite Organization (component tests):**
```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock dependencies first
vi.mock("../../services/supabase", () => ({ default: { functions: { invoke: mockInvoke } } }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key, i18n: { dir: () => "ltr" } }) }));

describe("FeedbackForm", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    vi.useRealTimers();
  });

  it("FORM-01: idle state renders trigger button", () => {
    render(<FeedbackForm />);
    expect(screen.getByText("pages.settings.feedback.sendFeedback")).toBeInTheDocument();
  });
});
```

**Suite Organization (trail unit data validation):**
```javascript
import { describe, it, expect } from 'vitest';
import { rhythmUnit7Nodes } from './rhythmUnit7Redesigned.js';
import { NODE_TYPES } from '../nodeTypes.js';

describe('Rhythm Unit 7 - 6/8 Compound Meter', () => {
  it('exports exactly 7 nodes', () => {
    expect(rhythmUnit7Nodes).toHaveLength(7);
  });

  it('prerequisite chain is valid', () => {
    expect(rhythmUnit7Nodes[0].prerequisites).toEqual(['boss_rhythm_6']);
    for (let i = 1; i < rhythmUnit7Nodes.length; i++) {
      expect(rhythmUnit7Nodes[i].prerequisites).toEqual([rhythmUnit7Nodes[i - 1].id]);
    }
  });

  it('all nodes use 6/8 time signature', () => {
    rhythmUnit7Nodes.forEach(node => {
      expect(node.rhythmConfig.timeSignature).toBe('6/8');
    });
  });
});
```

**Import convention note:** Some test files import `{ describe, it, expect }` from `vitest` explicitly, others rely on globals. Both work since `globals: true` is configured. When `vi.hoisted()` or `vi.mock()` is needed, always import `vi` from `vitest`.

**Setup/Teardown:**
- `beforeEach` with `vi.clearAllMocks()` for service tests with mocks
- `afterEach` with `vi.restoreAllMocks()` for tests that spy on globals (e.g., `Math.random`)
- `vi.useRealTimers()` in `beforeEach` when tests use fake timers

## Mocking

**Framework:** Vitest's built-in `vi.mock()` and `vi.fn()`

**Supabase mock pattern (service tests):**
```javascript
// Use vi.hoisted() so mock variables are available in vi.mock() factory
const { mockMaybeSingle, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn();
  const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockMaybeSingle, mockEq, mockSelect, mockFrom };
});

vi.mock("../supabase", () => ({
  default: { from: mockFrom },
}));

// Import module under test AFTER mock setup
import { fetchSubscriptionStatus } from "../subscriptionService";
```

Key detail: `vi.hoisted()` is required because `vi.mock()` is hoisted to the top of the file by Vitest's transform -- without it, mock variables would not exist when the factory runs.

**i18n mock pattern:**
```javascript
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (opts?.count !== undefined) return `${opts.count} / 1000`;
      if (opts?.time) return `Wait ${opts.time}`;
      return key;
    },
    i18n: { dir: () => "ltr" },
  }),
}));
```

**Component mock pattern (stub child components):**
```javascript
// Stub to null (invisible)
vi.mock("../../ui/BackButton", () => ({ default: () => null }));

// Stub with minimal interactive JSX (for parent gate, overlays)
vi.mock("./ParentGateMath", () => ({
  ParentGateMath: ({ onConsent, onCancel }) => (
    <div data-testid="parent-gate">
      <button data-testid="gate-consent" onClick={onConsent}>Consent</button>
      <button data-testid="gate-cancel" onClick={onCancel}>Cancel</button>
    </div>
  ),
}));
```

**Hook mock pattern:**
```javascript
vi.mock("../../../features/authentication/useUser", () => ({
  useUser: () => ({ user: null, isStudent: false }),
}));

vi.mock("../../../contexts/AudioContextProvider", () => ({
  useAudioContext: () => ({
    audioContextRef: { current: { state: "running", resume: vi.fn(async () => {}) } },
    analyserRef: { current: null },
    streamRef: { current: null },
    isReady: true,
    isInterrupted: false,
    micPermission: "granted",
    requestMic: vi.fn(async () => ({ analyser: null, audioContext: { state: "running", sampleRate: 44100 } })),
    releaseMic: vi.fn(),
    suspendAudio: vi.fn(async () => {}),
    resumeAudio: vi.fn(async () => {}),
    handleTapToResume: vi.fn(),
    getOrCreateAudioContext: vi.fn(() => ({ state: "running" })),
  }),
}));
```

**Router mock with partial actual:**
```javascript
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null, pathname: "/" }),
  };
});
```

**Math.random deterministic testing:**
```javascript
// Fixed value
vi.spyOn(Math, "random").mockReturnValue(0.1);

// Seeded pseudo-random (fuzz-style)
vi.spyOn(Math, "random").mockImplementation(() => {
  callCount++;
  return ((seed * 13 + callCount * 7) % 100) / 100;
});
```

**What to Mock:**
- Supabase client (`../supabase`) -- always mock in unit tests
- Router hooks (`useNavigate`, `useLocation`) -- mock in component tests
- React Query hooks (`useQueryClient`) -- mock in component tests
- i18n (`react-i18next`) -- mock with `t: (key) => key` pattern
- Child components not under test -- stub with `() => null` or simple JSX
- Audio/media APIs (`AudioContext`, `getUserMedia`) -- mock as needed
- External service calls -- mock at the module boundary

**What NOT to Mock:**
- The module under test itself
- Pure utility functions (test them directly)
- Data/constants (`skillTrail.js`, `xpSystem.js`, `nodeTypes.js`)
- VexFlow (for beam/notation utility tests)

## Test Data & Fixtures

**Mock payload builders:**
```javascript
function buildMockPayload(overrides = {}) {
  return {
    meta: {
      event_name: "subscription_created",
      custom_data: { student_id: "abc123-student-uuid" },
      ...overrides.meta,
    },
    data: {
      type: "subscriptions",
      id: "sub_12345",
      attributes: { status: "active", customer_id: 98765, ...overrides.attributes },
      ...overrides.data,
    },
  };
}
```

**Helper functions for assertions:**
```javascript
// Open form through parent gate (component test helper)
async function openForm() {
  render(<FeedbackForm />);
  fireEvent.click(screen.getByText("pages.settings.feedback.sendFeedback"));
  fireEvent.click(screen.getByTestId("gate-consent"));
}

// Rhythm event validation helpers
function checkNoOverlaps(events) { /* ... */ }
function groupEventsByBeat(events, unitsPerBeat = 4) { /* ... */ }
```

**Location:** Helpers are defined inline in test files. No shared test fixtures directory exists.

## Coverage

**Requirements:** None enforced. No coverage thresholds configured.

**View Coverage:**
```bash
npx vitest run --coverage
```

## Test Types

**Unit Tests (primary):**
- Pure function tests: `xpSystem.test.js`, `patternBuilder.test.js`, `rhythmGenerator.test.js`, `beamGroupUtils.test.js`, `keySignatureUtils.test.js`, `enharmonicMatching.test.js`
- Service logic tests: `subscriptionService.test.js`, `webhookLogic.test.js`
- Data validation tests: `rhythmUnit7Redesigned.test.js`, `rhythmUnit8Redesigned.test.js`
- Game utility tests: `NotesRecognitionGame.autogrow.test.js`
- Hook smoke tests: `usePitchDetection.test.js`

**Component Tests (limited):**
- `FeedbackForm.test.jsx` -- state machine transitions, form validation, submission, rate limiting
- `SightReadingGame.micRestart.test.jsx` -- mic lifecycle with fake timers and mocked dependencies

**Integration Tests:** None

**E2E Tests:** None (no Playwright/Cypress setup)

## Common Patterns

**Async Testing:**
```javascript
it("returns isPremium: true for status 'active'", async () => {
  mockMaybeSingle.mockResolvedValue({
    data: { status: "active", current_period_end: null },
    error: null,
  });
  const result = await fetchSubscriptionStatus("student-uuid-123");
  expect(result).toEqual({ isPremium: true });
});
```

**Error/Edge Case Testing:**
```javascript
it("handles null/undefined body gracefully without throwing", () => {
  expect(() => extractPayload({})).not.toThrow();
  expect(() => extractPayload({ meta: null, data: null })).not.toThrow();
});

it("returns empty array unchanged when input is empty", () => {
  expect(filterAutoGrowCandidates([], false)).toEqual([]);
  expect(filterAutoGrowCandidates([], true)).toEqual([]);
});
```

**Parameterized Tests (it.each):**
```javascript
it.each([4, 8])(
  "preserves barIndex on notes when measuresPerPattern=%s",
  async (bars) => {
    // ...test body using `bars` parameter
  }
);
```

**Fuzz-style iteration (seeded random):**
```javascript
for (let seed = 0; seed < 30; seed++) {
  let callCount = 0;
  vi.spyOn(Math, "random").mockImplementation(() => {
    callCount++;
    return ((seed * 13 + callCount * 7) % 100) / 100;
  });
  const events = generateRhythmEvents({ /* ... */ });
  const totalUnits = events.reduce((sum, e) => sum + e.sixteenthUnits, 0);
  expect(totalUnits).toBe(16);
  vi.restoreAllMocks();
}
```

**Fake timers for game components:**
```javascript
vi.useFakeTimers();
vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

// Advance through count-in and performance
await act(async () => {
  await vi.advanceTimersByTimeAsync(6000);
});
```

**Hook testing with renderHook:**
```javascript
import { renderHook } from "@testing-library/react";

test("hook initializes with default values", () => {
  const { result } = renderHook(() => usePitchDetection());
  expect(result.current.detectedNote).toBeNull();
  expect(result.current.isListening).toBe(false);
  expect(typeof result.current.startListening).toBe("function");
});
```

**Requirement ID annotations in component tests:**
```javascript
// ---------- FORM-01: State machine transitions ----------
it("FORM-01: idle state renders trigger button", () => { /* ... */ });
it("FORM-01: click trigger shows parent gate", () => { /* ... */ });

// ---------- FORM-02: Type dropdown ----------
it("FORM-02: type dropdown has 3 options", async () => { /* ... */ });
```

**Node-compatible re-implementations for Deno Edge Function code:**
```javascript
// The real implementation uses deno.land/std which doesn't resolve in Node
// This validates the HMAC-SHA256 algorithm is correct
async function verifySignatureNode(rawBody, receivedHex, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret),
    { name: 'HMAC', hash: { name: 'SHA-256' } }, false, ['sign']);
  // ... compute and compare
}
```

**Duplicated local code for testing non-exported functions:**
```javascript
// Verbatim copy from SightReadingGame.jsx lines 94-102
// (noteToMidi and SEMITONE_MAP are local, not exported)
const SEMITONE_MAP = { C: 0, "C#": 1, Db: 1, D: 2, /* ... */ };
function noteToMidi(note) { /* ... */ }
```

## Validation Scripts (Non-Vitest)

**Trail validator:** `scripts/validateTrail.mjs`
- Run: `npm run verify:trail`
- Also runs as **pre-build hook** (`prebuild` script in `package.json`) -- build fails on errors
- Validates: prerequisite chains (DFS cycle detection), node types (against `NODE_TYPES` enum), duplicate IDs, XP economy balance
- Exit code 1 on errors, 0 on pass (with optional warnings for >10% XP variance between paths)

**Pattern verifier:** `scripts/patternVerifier.mjs`
- Run: `npm run verify:patterns`
- Generates sight-reading patterns across all difficulty/time-signature combos
- Reports average notes, unique pitches, rest ratios, duration ranges
- Configurable: `npm run verify:patterns -- 20 Bass` (iterations + clef)

**Teacher points verifier:** `scripts/verify-teacher-points.mjs`
- Validates teacher-related point calculations

## Writing New Tests

**For a pure utility/service function:**
1. Create `{name}.test.js` co-located with the source file
2. Import from `vitest` if you need `vi` for mocking; otherwise use globals
3. Mock Supabase using `vi.hoisted()` + `vi.mock()` pattern shown above
4. Test happy path, error cases, edge cases, null/undefined inputs

**For a React component:**
1. Create `{ComponentName}.test.jsx` co-located with the source file
2. Mock all external dependencies (router, query, services, contexts, child components, i18n)
3. Use `render(<Component />)` -- wrap with `<MemoryRouter>` if component uses routing
4. Use `screen.getByRole()` / `screen.getByText()` / `screen.getByTestId()` for assertions
5. Use `fireEvent` for interactions, `act()` for state updates
6. Use `vi.useFakeTimers()` for time-dependent behavior

**For a custom hook:**
1. Create in `__tests__/{hookName}.test.js` next to the hooks directory
2. Use `renderHook()` from `@testing-library/react`
3. Test initial state, configuration acceptance, exposed API shape
4. Mock browser APIs (AudioContext, MediaStream) as needed

**For trail unit data files:**
1. Create `{unitFile}.test.js` co-located with the unit file in `src/data/units/`
2. Import the nodes array and relevant type constants
3. Validate: node count, unique IDs, ID naming convention, sequential orders, prerequisite chain, config consistency
4. Pattern: follow `rhythmUnit7Redesigned.test.js` as template

## Test Coverage Gaps

**Well-tested areas:**
- XP system calculations (`src/utils/xpSystem.js`)
- Subscription status logic (`src/services/subscriptionService.js`)
- Webhook payload handling (`supabase/functions/lemon-squeezy-webhook/lib/extractPayload`)
- Sight-reading music generation utilities (pattern builder, rhythm generator, beam groups, key signatures)
- Note recognition auto-grow logic
- Enharmonic MIDI matching
- New rhythm unit data validation (units 7, 8)

**Untested areas (ordered by risk):**
- **Most React components:** Dashboard, TrailMap, TrailNode, TrailNodeModal, all settings components, all chart components, auth forms -- no component tests
- **Context providers:** AccessibilityContext, AudioContextProvider, SettingsContext, SessionTimeoutContext, SightReadingSessionContext -- no tests
- **Most hooks:** useAudioEngine, useMicNoteInput, useStreakWithAchievements, useVictoryState, useOnboarding, useLandscapeLock -- only usePitchDetection has smoke tests
- **Service layer:** streakService, skillProgressService, dailyGoalsService, achievementService, dailyChallengeService, consentService -- no tests
- **Game flow integration:** Full game session from setup to VictoryScreen/GameOverScreen, trail node navigation, exercise progression
- **i18n behavior:** No tests for Hebrew translations, RTL rendering, node name translation
- **Accessibility features:** No tests for high contrast, reduced motion, screen reader modes
- **PWA functionality:** Service worker, offline behavior, push notifications
- **Older trail unit data:** Units 1-6 for treble, bass, and rhythm have no data validation tests (only units 7-8 do)

---

*Testing analysis: 2026-03-23*
