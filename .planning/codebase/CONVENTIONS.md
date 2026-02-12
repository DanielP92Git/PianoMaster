# Coding Conventions

**Analysis Date:** 2026-01-31

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `VictoryScreen.jsx`, `NotesRecognitionGame.jsx`, `TrailNodeModal.jsx`)
- Hooks: camelCase with `use` prefix (e.g., `usePitchDetection.js`, `useGlobalAudioSettings.js`, `useStreakWithAchievements.js`)
- Services: camelCase with service descriptor suffix (e.g., `skillProgressService.js`, `dailyGoalsService.js`, `authService.js`)
- Utilities: camelCase descriptive names (e.g., `xpSystem.js`, `progressMigration.js`, `accessoryUnlocks.js`)
- Context providers: PascalCase with Context suffix (e.g., `SettingsContext.jsx`, `AccessibilityContext.jsx`)
- Test files: Matching source filename with `.test.js` or `.spec.js` suffix (e.g., `patternBuilder.test.js`, `usePitchDetection.test.js`)

**Functions:**
- camelCase for all function names
- Prefixed with action verb: `get`, `fetch`, `update`, `delete`, `calculate`, `award`, `render`, etc.
- Examples: `getStudentProgress()`, `updateNodeProgress()`, `calculateStarsFromPercentage()`, `awardXP()`, `generatePatternData()`
- Factory/generator functions: `generate*` or `create*` (e.g., `generateRhythmEvents()`, `generatePatternData()`)
- Hook functions always begin with `use` (e.g., `useGameSettings()`, `useTotalPoints()`)

**Variables:**
- camelCase for all variables and constants
- Component state: descriptive names reflecting the state (e.g., `isListening`, `detectedNote`, `audioLevel`)
- Database fields use snake_case (e.g., `student_id`, `total_xp`, `best_score`, `last_practiced`)
- Constants at module level: UPPER_SNAKE_CASE (e.g., `RELEASE_THRESHOLD`, `DEFAULT_PREFERENCES`, `XP_LEVELS`)
- Refs: descriptive camelCase with `Ref` suffix (e.g., `saveTimeoutRef`, `hasAutoStartedRef`, `pendingChangesRef`)

**Types:**
- No formal TypeScript in use, but JSDoc comments document parameter and return types
- Object shape comments use `@param {Object}` with inline field descriptions
- Arrays documented as `@returns {Promise<Array>}` or `@returns {Array<Object>}`

**Database/API:**
- Table names: lowercase snake_case (e.g., `student_skill_progress`, `students_score`, `students`)
- Column names: lowercase snake_case (e.g., `student_id`, `node_id`, `best_score`, `exercises_completed`)
- JSON data within columns: preserve JavaScript naming (e.g., `goals: { goalId, goalType, ... }`)

## Code Style

**Formatting:**
- Tool: Prettier v3.6.0
- Print width: 80 characters
- Tab width: 2 spaces
- Single quote: false (use double quotes)
- Trailing comma: es5 (not in function parameters, only in objects/arrays)
- Semi-colons: true
- Bracket spacing: true (spaces inside object literals: `{ foo: 'bar' }`)
- Arrow function parentheses: always (e.g., `(param) => ...` not `param => ...`)
- Line endings: LF (Unix)

**Config file:** `.prettierrc` - applies Tailwind CSS class sorting plugin

**Linting:**
- Tool: ESLint v9.9.1
- Parser: Built-in ES2020 with JSX support
- Key plugins: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Key rules disabled/warnings:
  - `react/react-in-jsx-scope`: off (React 18 JSX transform)
  - `react/prop-types`: off (no prop-types library)
  - `react/jsx-uses-vars`: warn
  - `no-unused-vars`: warn
  - `no-undef`: warn
  - `react-refresh/only-export-components`: warn (allows const exports in development)

**Config file:** `eslint.config.js` - flat config format

## Import Organization

**Order:**
1. React and core libraries (`react`, `react-dom`, hooks like `useEffect`)
2. React Router imports (`react-router-dom`)
3. Third-party UI libraries (`framer-motion`, `lucide-react`, `react-icons`)
4. State management (`@tanstack/react-query`, context imports)
5. Feature-specific imports (from `features/`)
6. Service imports (from `services/`)
7. Context providers (from `contexts/`)
8. Component imports (from `components/`)
9. Utility imports (from `utils/`, `hooks/`)
10. Data imports (from `data/`)
11. Asset imports (images, sounds, styles)

**Examples:**
- From `src/components/games/VictoryScreen.jsx`:
  ```javascript
  import { useEffect, useMemo, useState, useRef, useCallback } from "react";
  import { useNavigate } from "react-router-dom";
  import { useQueryClient } from "@tanstack/react-query";
  import { useStreakWithAchievements } from "../../hooks/useStreakWithAchievements";
  import { updateNodeProgress, getNodeProgress } from "../../services/skillProgressService";
  import { awardXP, calculateSessionXP } from "../../utils/xpSystem";
  import { getNodeById, EXERCISE_TYPES } from "../../data/skillTrail";
  ```

**Path aliases:**
- Absolute imports from `src/` root are standard; no alias shortcuts observed
- All imports use relative paths (e.g., `../../services/`, `../contexts/`)

## Error Handling

**Patterns:**
- Try-catch wrapping for async operations in services
- Errors logged to console with descriptive message: `console.error('Error context:', error)`
- Errors re-thrown to propagate to caller for component-level handling
- Toast notifications for user-facing errors (via `react-hot-toast`)
- No custom error classes; Error objects caught and logged with context

**Service example** (`src/services/skillProgressService.js`):
```javascript
export const getStudentProgress = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('student_skill_progress')
      .select('*')
      .eq('student_id', studentId)
      .order('last_practiced', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching student progress:', error);
    throw error;
  }
};
```

**Supabase response pattern:**
- Always destructure `{ data, error }` from Supabase calls
- Check `if (error)` and throw immediately
- Return data with null/empty fallback (e.g., `data || []`, `data || null`)

**Component-level error handling:**
- Wrapped in try-catch blocks for async state updates
- Errors passed to toast notifications: `toast.error('Error message')`
- Error state tracked in component: `const [error, setError] = useState(null)`

## Logging

**Framework:** `console` (native browser console)

**Patterns:**
- `console.error()` for exceptions in catch blocks
- `console.log()` for debug information (sparse, mostly removed in production)
- Always include context prefix in error messages: `console.error('Context: what failed', error)`
- No log levels or formatting library; raw console methods

**Examples:**
- `console.error('Error fetching student progress:', error);`
- `console.error('Error awarding XP:', error);`
- `console.error('Authorization failed: user mismatch');` (in services with authorization checks)

## Comments

**When to Comment:**
- Function purpose: JSDoc-style block comment before every exported function
- Complex logic: Inline comments explaining "why" not "what" (code is self-documenting)
- Workarounds: Mark with `// NOTE:` or `// HACK:` for non-obvious solutions
- Security-related code: Always comment security implications (e.g., COPPA compliance comments in `xpSystem.js`)
- Props documentation: JSDoc `@param` blocks for component props

**JSDoc/TSDoc:**
- Standard format: `/** description */` before functions
- Parameters: `@param {type} name - description`
- Returns: `@returns {type} description`
- Typed returns: `@returns {Promise<Array>}`, `@returns {Object|null}`

**Example** (from `src/utils/xpSystem.js`):
```javascript
/**
 * Calculate current level based on total XP
 * @param {number} totalXp - Student's total XP
 * @returns {Object} Level object with level, title, and icon
 */
export const calculateLevel = (totalXp) => {
  ...
};
```

## Function Design

**Size:** 20-40 lines typical for service functions, 50+ lines for game components (due to game logic complexity)
- Large functions broken into helper functions within same file or extracted to utils
- Custom hooks extracted when logic is reused across components

**Parameters:**
- Positional parameters for essential data (e.g., `(studentId, nodeId, stars, score)`)
- Configuration objects for optional/complex parameters (e.g., `{ allowRests, allowedNoteDurations, rhythmComplexity }`)
- Destructuring for object parameters in function signature

**Return Values:**
- Single return value (not tuple destructuring)
- Async functions return Promise with unwrapped data (e.g., `Promise<Array>` not `Promise<{ data, error }>`)
- Handle Supabase response pattern internally and throw on error
- Null/undefined for missing results (e.g., `null` not empty string)
- Objects for multiple related return values (e.g., `{ newTotalXP, newLevel, leveledUp, xpAwarded }`)

**Example** (from `src/utils/xpSystem.js`):
```javascript
export const getLevelProgress = (totalXp) => {
  const currentLevelData = calculateLevel(totalXp);
  const currentLevel = currentLevelData.level;

  if (currentLevel >= 15) {
    return {
      currentLevel: currentLevelData,
      nextLevelXP: 0,
      xpInCurrentLevel: 0,
      xpNeededForNext: 0,
      progressPercentage: 100
    };
  }

  // ... calculation logic
};
```

## Module Design

**Exports:**
- Named exports for all public functions (no default exports from services/utils)
- Default export at end of service files with object containing all exports (for convenience)

**Barrel Files:**
- Not used; imports are direct from source files
- Example: `import { getNodeById, EXERCISE_TYPES } from '../data/skillTrail'` not barrel re-export

**Module structure** (typical service):
1. JSDoc block describing module purpose
2. Imports
3. Constants and configuration
4. Helper functions (not exported)
5. Public functions (exported with JSDoc)
6. Default export object (optional, at end)

**Example** (`src/utils/xpSystem.js`):
```javascript
/**
 * XP and Leveling System
 * Manages student XP progression, level calculations, and XP rewards
 */

import supabase from '../services/supabase';

export const XP_LEVELS = [ ... ];

export const calculateLevel = (totalXp) => { ... };

export default {
  XP_LEVELS,
  calculateLevel,
  // ... other exports
};
```

## Special Patterns

**Supabase Integration:**
- All database access through `src/services/` files (not directly in components)
- Single supabase instance: `import supabase from './supabase'`
- RPC calls for complex operations: `supabase.rpc('function_name', { params })`
- Row-level security (RLS) enforced at database level; client checks auth before API calls

**React Context:**
- Context files in `src/contexts/` directory
- Provider component exports the provider and custom hook
- Hook name: `use{ContextName}()` (e.g., `useSettings()`, `useAccessibility()`)
- Default values always provided to Context.createContext()

**Custom Hooks:**
- File location: `src/hooks/` directory
- Always start with `use` prefix
- Can use contexts and other hooks internally
- Return object with state and methods (e.g., `{ isListening, startListening, stopListening }`)

**Game Components:**
- Follow predictable structure: setup → settings → gameplay → results
- Props document trail integration: `nodeId`, `exerciseIndex`, `totalExercises`, `exerciseType`
- Auto-start pattern when trail props provided via `useRef` to prevent double-initialization

---

*Convention analysis: 2026-01-31*
