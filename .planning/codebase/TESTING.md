# Testing Patterns

**Analysis Date:** 2026-03-08

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
- `@testing-library/react` 16.3.0 (`render`, `screen`, `act`, `fireEvent`, `renderHook`)

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

Note: The setup file polyfills `requestAnimationFrame` for jsdom since many game components use RAF-based timing loops.

## Test File Organization

**Location:** Mixed -- both co-located and `__tests__/` directories:
- Co-located: `src/utils/xpSystem.test.js` alongside `src/utils/xpSystem.js`
- Co-located: `src/components/games/sight-reading-game/utils/patternBuilder.test.js`
- `__tests__/` dir: `src/hooks/__tests__/usePitchDetection.test.js`
- `__tests__/` dir: `src/services/__tests__/subscriptionService.test.js`

**Naming:** `{module}.test.{js,jsx}` -- matches the source file name. For specific scenarios: `SightReadingGame.micRestart.test.jsx`.

**Existing test files (7 total):**
```
src/
├── utils/xpSystem.test.js                                    # XP/level calculations (27 tests)
├── hooks/__tests__/usePitchDetection.test.js                  # Hook smoke tests (5 tests, fails*)
├── services/__tests__/subscriptionService.test.js             # Subscription status logic (8 tests)
├── services/__tests__/webhookLogic.test.js                    # Webhook payload/signature (25 tests)
├── components/games/sight-reading-game/
│   ├── utils/patternBuilder.test.js                           # Music pattern generation (3 tests)
│   ├── utils/rhythmGenerator.test.js                          # Rhythm event generation (~15 suites)
│   └── SightReadingGame.micRestart.test.jsx                   # Component mic lifecycle (1 test, fails*)
```

*`usePitchDetection.test.js` and `SightReadingGame.micRestart.test.jsx` fail because they explicitly import `describe`/`test` from `vitest` but the config has `globals: true`. Some test files use explicit imports, others rely on globals -- the inconsistency causes failures when the vitest globals config changed.

## Test Structure

**Suite Organization:**
```javascript
// Pure utility tests -- use globals (no import needed)
describe("XP_LEVELS array", () => {
  it("has exactly 30 entries", () => {
    expect(XP_LEVELS).toHaveLength(30);
  });

  it("has strictly increasing XP thresholds", () => {
    for (let i = 1; i < XP_LEVELS.length; i++) {
      expect(XP_LEVELS[i].xpRequired).toBeGreaterThan(XP_LEVELS[i - 1].xpRequired);
    }
  });
});
```

```javascript
// Service tests with mocks -- explicit imports
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("fetchSubscriptionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-wire mock chain after clearAllMocks
  });

  it("returns isPremium: false for null studentId", async () => {
    const result = await fetchSubscriptionStatus(null);
    expect(result).toEqual({ isPremium: false });
  });
});
```

**Preferred pattern for new tests:** Use globals (no explicit vitest imports) since `globals: true` is configured. Only import from `vitest` if you specifically need `vi.hoisted()`.

**Setup/Teardown:**
- `beforeEach` with `vi.clearAllMocks()` for service tests with mocks
- `afterEach` with `vi.restoreAllMocks()` for tests that spy on globals (e.g., `Math.random`)

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

**Component mock pattern (React component tests):**
```javascript
// Mock child components to stubs
vi.mock("../../ui/BackButton", () => ({
  default: () => null,
}));

// Mock hooks
vi.mock("../../../features/authentication/useUser", () => ({
  useUser: () => ({ user: null, isStudent: false }),
}));

// Mock with partial actual
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
vi.spyOn(Math, "random").mockReturnValue(0.1);
// or for varied deterministic output:
vi.spyOn(Math, "random").mockImplementation(() => {
  callCount++;
  return ((seed * 13 + callCount * 7) % 100) / 100;
});
```

**What to Mock:**
- Supabase client (`../supabase`) -- always mock in unit tests
- Router hooks (`useNavigate`, `useLocation`) -- mock in component tests
- React Query hooks (`useQueryClient`) -- mock in component tests
- Child components not under test -- stub with `() => null` or simple JSX
- Browser APIs (`localStorage`, `requestAnimationFrame`) -- mock as needed
- External service calls -- mock at the module boundary

**What NOT to Mock:**
- The module under test itself
- Pure utility functions (test them directly)
- Data/constants (`skillTrail.js`, `xpSystem.js`)

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
      attributes: {
        status: "active",
        customer_id: 98765,
        ...overrides.attributes,
      },
      ...overrides.data,
    },
  };
}
```

**Helper functions within test files:**
```javascript
function checkNoOverlaps(events) { /* ... */ }
function groupEventsByBeat(events, unitsPerBeat = 4) { /* ... */ }
function containsSyncopatedMotif(events) { /* ... */ }
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
- Pure function tests: `xpSystem.test.js` (calculations), `patternBuilder.test.js`, `rhythmGenerator.test.js`
- Service logic tests: `subscriptionService.test.js`, `webhookLogic.test.js`
- Hook smoke tests: `usePitchDetection.test.js`

**Component Tests (limited):**
- `SightReadingGame.micRestart.test.jsx` -- tests mic lifecycle with fake timers and mocked dependencies
- Pattern: Render with `MemoryRouter`, interact with `fireEvent`, assert with `screen` queries

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
});
```

**Node-compatible re-implementations for Deno code testing:**
```javascript
// The real implementation uses deno.land/std which doesn't resolve in Node
// This validates the HMAC-SHA256 logic is correct
async function verifySignatureNode(rawBody, receivedHex, secret) {
  const key = await crypto.subtle.importKey(/*...*/);
  // ...
}
```

## Validation Scripts (Non-Vitest)

**Pattern verifier:** `npm run verify:patterns` -- runs `scripts/patternVerifier.mjs`, validates music pattern definitions

**Trail validator:** `npm run verify:trail` -- runs `scripts/validateTrail.mjs`, validates trail node data integrity. Also runs as pre-build hook (`prebuild` script in `package.json`).

## Writing New Tests

**For a pure utility/service function:**
1. Create `{name}.test.js` co-located with the source file
2. Use globals (`describe`, `it`, `expect`) -- no vitest import needed
3. Mock Supabase using `vi.hoisted()` + `vi.mock()` pattern shown above
4. Test happy path, error cases, edge cases, null/undefined inputs

**For a React component:**
1. Create `{ComponentName}.test.jsx` co-located or in `__tests__/`
2. Mock all external dependencies (router, query, services, child components)
3. Render with `<MemoryRouter>` wrapper
4. Use `screen.getByRole()` / `screen.getByText()` for assertions
5. Use `act()` + `fireEvent` for interactions
6. Use `vi.useFakeTimers()` for time-dependent behavior

**For a custom hook:**
1. Create in `__tests__/{hookName}.test.js`
2. Use `renderHook()` from `@testing-library/react`
3. Test initial state, configuration acceptance, exposed API shape
4. Mock browser APIs (AudioContext, MediaStream) as needed

## Known Issues

1. **Failing tests:** `usePitchDetection.test.js` and `SightReadingGame.micRestart.test.jsx` fail because they have explicit `describe`/`test` imports that conflict with the `globals: true` config in `vitest.config.js`. The usePitchDetection test imports from `@testing-library/react` but not from vitest (it uses `describe`/`test` as globals), while the SightReadingGame test uses `vi.mock()` as a global but `describe`/`test` are not defined because the test file relies on implicit globals that may not be available.

2. **Low coverage:** Only 7 test files covering utilities, services, and one component. No tests for:
   - Most React components (Dashboard, TrailMap, settings, etc.)
   - Context providers
   - Most hooks
   - Game flow integration
   - i18n behavior
   - Accessibility features

3. **No coverage enforcement:** No coverage thresholds in config. No CI pipeline enforcing test passage.

---

*Testing analysis: 2026-03-08*
