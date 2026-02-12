# Testing Patterns

**Analysis Date:** 2026-01-31

## Test Framework

**Runner:**
- Vitest v3.2.4 - Fast unit test runner built on Vite
- Config: `vitest.config.js`
- Environment: JSDOM (browser simulation)
- Global test APIs enabled (no import of `describe`, `it`, `expect` required)

**Assertion Library:**
- `@testing-library/jest-dom` v6.9.1 - DOM matchers (`.toBeVisible()`, `.toBeInTheDocument()`, etc.)
- Native Vitest `expect()` API compatible with Jest

**Run Commands:**
```bash
npm run test              # Run in watch mode
npm run test:run         # Single run (CI mode)
npx vitest run src/path/to/file.test.js  # Test single file
```

**Setup File:**
- Location: `src/test/setupTests.js`
- Loaded automatically before all tests (via `vitest.config.js` `setupFiles` option)
- Polyfills `requestAnimationFrame` and `cancelAnimationFrame` for timing tests

## Test File Organization

**Location:**
- Co-located with source files, not in separate `__tests__` directory
- Exception: Hook tests in `src/hooks/__tests__/` (organized by type)

**Naming:**
- Extension: `.test.js` (not `.spec.js`)
- Examples:
  - `src/components/games/sight-reading-game/utils/patternBuilder.test.js`
  - `src/components/games/sight-reading-game/utils/rhythmGenerator.test.js`
  - `src/hooks/__tests__/usePitchDetection.test.js`

**Structure:**
```
src/
├── utils/
│   ├── xpSystem.js
│   └── xpSystem.test.js          # (if tested)
├── hooks/
│   ├── usePitchDetection.js
│   └── __tests__/
│       └── usePitchDetection.test.js
├── components/games/sight-reading-game/utils/
│   ├── patternBuilder.js
│   ├── patternBuilder.test.js
│   ├── rhythmGenerator.js
│   └── rhythmGenerator.test.js
```

## Test Structure

**Suite Organization:**
```javascript
describe("Feature or Module Name", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should do something specific", () => {
    // Arrange
    const input = ...;

    // Act
    const result = someFunction(input);

    // Assert
    expect(result).toBe(...);
  });

  it.each([...])("parameterized test %s", (param) => {
    // Test with multiple inputs
  });
});
```

**Patterns from codebase** (`patternBuilder.test.js`):
- Multiple `describe()` blocks per file for different test categories
- `afterEach(() => { vi.restoreAllMocks(); })` to clean up spies
- Descriptive test names: "tags the eighth after dotted-quarter (6+2) with noBeam: true"
- Arrange-Act-Assert structure with clear comments

**Example** (from `rhythmGenerator.test.js`):
```javascript
describe("generateRhythmEvents (rest duration constraints)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not generate 1/16 rests when only "8" rests are allowed (simple mode)', () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const events = generateRhythmEvents({
      timeSignature: "4/4",
      measuresPerPattern: 1,
      allowedNoteDurations: ["q", "8"],
      allowRests: true,
      allowedRestDurations: ["8"],
      rhythmComplexity: "simple",
    });

    const restEvents = events.filter((e) => e.type === "rest");
    expect(restEvents.length).toBeGreaterThan(0);

    restEvents.forEach((e) => {
      expect(e.notation).toBe("eighth");
      expect(e.sixteenthUnits).toBe(2);
    });
  });
});
```

## Mocking

**Framework:** Vitest's built-in `vi` object (compatible with Jest's `jest` API)

**Patterns:**

**Spying on functions:**
```javascript
vi.spyOn(Math, "random").mockReturnValue(0.2);
// Later:
vi.restoreAllMocks(); // In afterEach
```

**Mock implementation:**
```javascript
vi.spyOn(Math, "random").mockImplementation(() => {
  callCount++;
  return ((seed * 13 + callCount * 7) % 100) / 100;
});
```

**Deterministic randomness for testing:**
```javascript
// In test setup
let callCount = 0;
vi.spyOn(Math, "random").mockImplementation(() => {
  callCount++;
  return ((seed * 13 + callCount * 7) % 100) / 100;
});
```

**What to Mock:**
- External randomness (`Math.random()` in tests for deterministic behavior)
- Time-dependent functions (use `vi.useFakeTimers()` if needed)
- Module functions from other files (for unit testing)

**What NOT to Mock:**
- Core business logic functions being tested
- Array methods (`map`, `filter`, `reduce`)
- Math operations
- Helper functions called by the function under test

**Example - parameterized test with mocking** (from `rhythmGenerator.test.js`):
```javascript
it.each([4, 8])(
  "%s bars in 4/4: total units == bars*16 and barIndex ranges without cross-bar multi-beat patterns",
  (bars) => {
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callCount++;
      return (callCount % 10) / 10;
    });

    const events = generateRhythmEvents({
      timeSignature: "4/4",
      measuresPerPattern: bars,
      // ... config
    });

    // Assertions
    expect(totalUnits).toBe(bars * 16);

    vi.restoreAllMocks();
  }
);
```

## Fixtures and Factories

**Test Data:**
- Inline test data within test functions
- No shared fixture files (each test defines its own setup)
- Complex objects built as function parameters

**Example** (from `patternBuilder.test.js`):
```javascript
const result = await generatePatternData({
  difficulty: "beginner",
  timeSignature: "4/4",
  tempo: 80,
  selectedNotes: ["C4", "D4", "E4", "F4"],
  clef: "Treble",
  measuresPerPattern: 1,
  rhythmSettings: {
    allowRests: false,
    allowedNoteDurations: ["q", "8", "16"],
    allowedRestDurations: [],
    enabledComplexPatterns: ["dottedQuarterEighth"],
  },
  rhythmComplexity: "complex",
});
```

**No dedicated fixture location:** Test data lives within test functions for clarity and isolation

## Coverage

**Requirements:** No coverage enforcement in vitest.config.js
- No `coverage` section in configuration
- No threshold enforcement in CI pipeline

**View Coverage:**
```bash
npx vitest run --coverage
```
(Requires @vitest/coverage package installation)

**Current state:**
- Limited test coverage (3 test files identified)
- Focus on core utility functions and hooks
- Game components have integration tests (`SightReadingGame.micRestart.test.jsx`)

## Test Types

**Unit Tests:**
- Scope: Pure utility functions that have deterministic output
- Approach: Test with multiple input variations, mock external randomness
- Examples: `patternBuilder.test.js`, `rhythmGenerator.test.js`
- Characteristics: Fast, no async I/O, focus on algorithm correctness

**Examples:**
- `patternBuilder.test.js` (107 lines) - Tests rhythm pattern generation with complex constraints
- `rhythmGenerator.test.js` (873 lines) - Extensive tests for rhythm event generation across multiple scenarios

**Hook Tests:**
- Scope: Custom React hooks in isolation
- Approach: Use `renderHook` from `@testing-library/react`
- Example: `usePitchDetection.test.js`
- Characteristics: Test hook state and callback availability

**Integration Tests:**
- Scope: Game components with real logic (not full game flow)
- Approach: Mount component with mocked state
- Example: `SightReadingGame.micRestart.test.jsx` (checks microphone restart behavior)
- Characteristics: Slower, test component interaction and state management

**E2E Tests:**
- Framework: Not used (no Cypress, Playwright, etc. configured)
- Rationale: PWA app tested manually or via teacher dashboard; games tested via integration tests

## Common Patterns

**Async Testing:**
- Tests are marked `async` when testing async functions
- Use `await` to resolve promises
- Vitest automatically waits for promise resolution

**Example** (from `patternBuilder.test.js`):
```javascript
it("tags the eighth after dotted-quarter (6+2) with noBeam: true", async () => {
  vi.spyOn(Math, "random").mockReturnValue(0.1);

  const result = await generatePatternData({
    // ... config
  });

  // Assertions on result
  expect(result.measuresPerPattern).toBe(1);
});
```

**Error Testing:**
- No explicit error testing examples in current codebase
- Pattern would use `expect(() => func()).toThrow()`

**Iteration testing with .each():**
- Use for parameterized tests across multiple inputs
- Format: `it.each([values])("test name %s", (param) => { ... })`

**Example** (from `rhythmGenerator.test.js`):
```javascript
it("generates valid patterns in 3/4 time with all options enabled", () => {
  // Run multiple iterations to catch edge cases
  for (let seed = 0; seed < 20; seed++) {
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callCount++;
      return ((seed * 17 + callCount * 11) % 100) / 100;
    });

    const events = generateRhythmEvents({
      timeSignature: "3/4",
      measuresPerPattern: 1,
      allowedNoteDurations: ["w", "h", "q", "8", "16"],
      // ...
    });

    // Assertions that run 20 times with different random values
    const totalUnits = events.reduce((sum, e) => sum + e.sixteenthUnits, 0);
    expect(totalUnits).toBe(12);

    vi.restoreAllMocks();
  }
});
```

**Property-based testing pattern:**
- Multiple random seeds tested in loop (simulated property-based approach)
- Each seed exercises different branches of algorithm
- Used extensively in `rhythmGenerator.test.js` (30-50 iterations per test)

**Helper functions in tests:**
- Utility functions defined within test files for complex validation
- Examples: `checkNoOverlaps()`, `groupEventsByBeat()`, `checkBeatMetadata()` in `rhythmGenerator.test.js`

**Helper function example** (from `rhythmGenerator.test.js`):
```javascript
function checkNoOverlaps(events) {
  let cursor = 0;
  const occupiedSlots = new Set();

  for (const event of events) {
    const startPos = cursor;
    const endPos = cursor + event.sixteenthUnits;

    for (let slot = startPos; slot < endPos; slot++) {
      if (occupiedSlots.has(slot)) {
        return { overlaps: true, slot, event };
      }
      occupiedSlots.add(slot);
    }
    cursor += event.sixteenthUnits;
  }

  return { overlaps: false };
}
```

## Hook Testing

**Pattern:**
- Use `renderHook()` from `@testing-library/react`
- Access state via `result.current` after rendering

**Example** (`usePitchDetection.test.js`):
```javascript
import { renderHook } from "@testing-library/react";
import { usePitchDetection } from "../usePitchDetection";

describe("usePitchDetection", () => {
  test("hook initializes with default values", () => {
    const { result } = renderHook(() => usePitchDetection());

    expect(result.current.detectedNote).toBeNull();
    expect(result.current.detectedFrequency).toBe(-1);
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.isListening).toBe(false);
    expect(typeof result.current.startListening).toBe("function");
  });

  test("hook accepts custom configuration", () => {
    const mockCallback = vi.fn();

    const { result } = renderHook(() =>
      usePitchDetection({
        isActive: false,
        onPitchDetected: mockCallback,
        noteFrequencies: { C4: 261.63 },
      })
    );

    expect(result.current.isListening).toBe(false);
  });
});
```

## Test Configuration Details

**vitest.config.js:**
```javascript
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

**Key settings:**
- `environment: "jsdom"` - Simulate browser DOM
- `globals: true` - No need to import `describe`, `it`, `expect`
- `setupFiles: ["src/test/setupTests.js"]` - Load setup before tests
- `include` pattern - Finds all test files in `src/`

**Setup file** (`src/test/setupTests.js`):
```javascript
import "@testing-library/jest-dom/vitest";

// Polyfill requestAnimationFrame for timing tests
if (typeof globalThis.requestAnimationFrame !== "function") {
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
}

if (typeof globalThis.cancelAnimationFrame !== "function") {
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}
```

**Rationale:**
- RAF polyfill necessary because metronome and timeline tests rely on animation frame timing
- Testing Library DOM matchers available via `@testing-library/jest-dom/vitest`

## Testing Best Practices Observed

1. **Deterministic randomness:** Always mock `Math.random()` to ensure consistent test results across runs
2. **Cleanup:** Always call `vi.restoreAllMocks()` in `afterEach()` to prevent test pollution
3. **Descriptive test names:** Include expected behavior and edge case context in test description
4. **Multiple iterations:** Loop tests 20-50 times with different random seeds to catch edge cases in algorithms
5. **Helper functions:** Extract validation logic into named helper functions for readability
6. **Clear assertions:** Test both happy path and constraint violations (e.g., no overlaps, correct timing)
7. **Smoke tests for hooks:** Test that hooks initialize and accept configuration, not necessarily full functionality (which would require full React environment)

---

*Testing analysis: 2026-01-31*
