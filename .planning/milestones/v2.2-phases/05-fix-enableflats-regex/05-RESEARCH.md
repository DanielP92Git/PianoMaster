# Phase 05: Fix enableFlats Regex False-Positive — Research

**Researched:** 2026-03-17
**Domain:** JavaScript string/regex matching, React navigation state, note pool detection
**Confidence:** HIGH

## Summary

This phase closes two audit gaps (`INTG-FLATS-FALSE-POSITIVE` and `FLOW-FLATS-DISTRACTOR`) from the v2.2 milestone audit. The audit identified that `notePool.some(n => n.includes('b'))` in `TrailNodeModal.jsx` and `/[#b]/.test(pitch)` in `filterAutoGrowCandidates` are imprecise regexes that could produce false positives for notes containing the natural note `B`.

**Critical finding from code verification:** JavaScript `String.prototype.includes` is case-sensitive. `'B3'.includes('b')` returns `false`. The current `FULL_SHARP_POOL` (used by `bass_4_6`, `bass_4_7`, `boss_bass_4`) contains `'B3'` with a capital `B`, so no active false positive exists today. However, the code's intent is ambiguous: the regex `includes('b')` was written to detect flat accidentals (like `'Bb3'`), but its correctness depends on the implicit assumption that natural `B` notes are always uppercase. This is a fragile, undocumented constraint.

The fix replaces two imprecise checks with anchored regex patterns that explicitly encode the intent: detect flat-form note names (e.g., `Bb3`, `Eb3`) vs sharp-form names (e.g., `F#3`). This makes the code self-documenting and robust against any future lowercase note representations.

**Primary recommendation:** Apply the exact fix documented in the v2.2 audit: `/^[A-G]b\d/.test(n)` in TrailNodeModal and `/[A-G]b/.test(pitch)` in filterAutoGrowCandidates. Add a regression test for the B3 false-positive scenario.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FIX-01 | Trail auto-start passes correct `enableSharps`/`enableFlats` flags derived from node's notePool | The regex fix directly addresses how flags are derived from the pool in TrailNodeModal. The filterAutoGrowCandidates fix ensures auto-grow does not misclassify B3 as an accidental session. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | (project-installed) | Unit testing | Already used for `NotesRecognitionGame.autogrow.test.js` |
| React Router (location.state) | v7 | Navigation state transport | Already in use; no changes needed |

No new libraries needed. This phase is pure logic fix + test.

**Installation:** None required.

## Architecture Patterns

### Affected Files

```
src/components/trail/TrailNodeModal.jsx         # Fix: line 172 enableFlats detection
src/components/games/notes-master-games/
  NotesRecognitionGame.jsx                       # Fix: line 396 filterAutoGrowCandidates regex
  NotesRecognitionGame.autogrow.test.js          # Extend: add B3 regression tests
```

### Pattern 1: Flat Note Detection in TrailNodeModal

**What:** Line 172 derives `enableFlats` by scanning `notePool` for any note with flat accidental.
**Current code (fragile):**
```javascript
const enableFlats = notePool.some(n => n.includes('b'));
```
**Problem:** `includes('b')` is case-sensitive and returns `false` for `'B3'` (capital B). But the intent is only visible through implicit convention — the code works by accident of convention, not by design.
**Fixed code (explicit intent):**
```javascript
const enableFlats = notePool.some(n => /^[A-G]b\d/.test(n));
```
**Regex explained:** `^[A-G]` anchors to start, requires a valid note letter (A-G uppercase); `b` is the flat symbol; `\d` ensures a digit octave follows. This matches `Bb3`, `Eb4`, `Ab3`, `Db3` and does NOT match `B3`, `B4`, `Cb4` (enharmonic — would need separate handling if ever used).

### Pattern 2: filterAutoGrowCandidates in NotesRecognitionGame

**What:** Line 396 strips accidental notes from auto-grow candidates when session is natural-only.
**Current code:**
```javascript
return candidatePool.filter(pitch => !/[#b]/.test(pitch));
```
**Problem:** `/[#b]/` matches any lowercase `b` anywhere in the string. For `'B3'` (capital B) it returns `false` (correct), but the intent is invisible. For sharp detection, `[#]` is unambiguous, but `[b]` looks like it's matching the letter b in any position.
**Fixed code:**
```javascript
return candidatePool.filter(pitch => !/[#]/.test(pitch) && !/[A-G]b/.test(pitch));
```
Or equivalently as a single regex:
```javascript
return candidatePool.filter(pitch => !/[#]|[A-G]b/.test(pitch));
```
**Alternative from audit:** Keep as `/[#b]/` with a comment, since it works correctly. But the more expressive version better documents intent.

**Note:** The audit's proposed fix for filterAutoGrowCandidates is `/[A-G]b/.test(pitch)` for flat detection. Combined with `[#]` for sharp detection, the full filter becomes: exclude pitch if it has `#` OR if it matches `[A-G]b`.

### Pattern 3: currentPoolHasAccidentals in NotesRecognitionGame

Line 901-903 also derives the accidentals flag:
```javascript
const currentPoolHasAccidentals =
  trailEnableSharps || trailEnableFlats ||
  (currentNode.noteConfig?.notePool || []).some(p => /[#b]/.test(p));
```
The fallback `.some(p => /[#b]/.test(p))` has the same ambiguity. Since `trailEnableSharps`/`trailEnableFlats` from `location.state` are already computed by TrailNodeModal (which will be fixed), the fallback matters only for non-standard launches. Consider fixing this too for consistency.

### Anti-Patterns to Avoid

- **Patching only one site:** Both `TrailNodeModal.jsx` and `NotesRecognitionGame.jsx` have the same pattern — fix both atomically.
- **Using case-insensitive regex:** `/b/i` would match capital B, which is NOT the goal. Keep case-sensitive; just be explicit with `[A-G]b`.
- **Overengineering:** Do NOT refactor the entire flag derivation into a shared utility. Two targeted one-line fixes are the correct scope.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Flat note detection | A lookup table of all flat note names | Regex `/^[A-G]b\d/` | The pattern is systematic and covers all 12 flat names |
| Sharp note detection | String parsing function | `n.includes('#')` or `/[#]/` | The `#` character is unambiguous in note names |

## Common Pitfalls

### Pitfall 1: Testing Only the Happy Path
**What goes wrong:** Writing tests only for flat notes (`Bb3` → true) without testing the false-positive case (`B3` → false).
**Why it happens:** The bug is a false positive, so the normal test would pass before the fix too.
**How to avoid:** Explicitly add test cases for `'B3'` and `'B4'` asserting they return `false` for `enableFlats` detection.
**Warning signs:** Test suite passes before and after fix — if so, the new tests are missing the regression cases.

### Pitfall 2: Missing the filterAutoGrowCandidates Site
**What goes wrong:** Fixing TrailNodeModal but not NotesRecognitionGame.jsx line 396.
**Why it happens:** The two sites use different code patterns (`includes` vs regex), easy to miss one.
**How to avoid:** The audit explicitly names both sites. Fix both in the same plan/commit.

### Pitfall 3: Breaking the currentPoolHasAccidentals Fallback
**What goes wrong:** Fixing filterAutoGrowCandidates changes the internal regex but the `currentPoolHasAccidentals` fallback at line 901-903 still uses the old pattern.
**How to avoid:** Either fix the fallback too (ideal) or verify it's always superseded by `trailEnableSharps || trailEnableFlats` for trail sessions.

### Pitfall 4: Assuming the Bug is Active
**What goes wrong:** Planning extensive remediation because the audit says there's a false positive, when verification shows no active bug with current data.
**Why it happens:** The audit description was written incorrectly (claimed `'B3'.includes('b')` is true when it is false).
**How to avoid:** The fix is still correct and warranted as defensive code. Plan it as a code quality fix, not a critical bug fix. Severity is LOW.

## Code Examples

Verified patterns (all behavior confirmed via Node.js execution):

### Current vs Fixed: enableFlats Detection
```javascript
// Source: TrailNodeModal.jsx line 172 (current — fragile)
const enableFlats = notePool.some(n => n.includes('b'));

// Fixed (explicit intent — from audit recommendation)
const enableFlats = notePool.some(n => /^[A-G]b\d/.test(n));

// Verification:
// 'Bb3' → current: true,  fixed: true  (correct)
// 'Eb4' → current: true,  fixed: true  (correct)
// 'B3'  → current: false, fixed: false (no change needed; both correct)
// 'B4'  → current: false, fixed: false (no change needed; both correct)
```

### Current vs Fixed: filterAutoGrowCandidates
```javascript
// Source: NotesRecognitionGame.jsx line 396 (current — ambiguous)
export function filterAutoGrowCandidates(candidatePool, currentPoolHasAccidentals) {
  if (currentPoolHasAccidentals) return candidatePool;
  return candidatePool.filter(pitch => !/[#b]/.test(pitch));
}

// Fixed (explicit intent):
export function filterAutoGrowCandidates(candidatePool, currentPoolHasAccidentals) {
  if (currentPoolHasAccidentals) return candidatePool;
  return candidatePool.filter(pitch => !/[#]|[A-G]b/.test(pitch));
}
```

### Regression Test Cases to Add
```javascript
// Source: NotesRecognitionGame.autogrow.test.js (extend existing describe block)

// B3 should pass through natural filter — natural note, not a flat
it('keeps B3 in natural session — not a flat despite containing letter b', () => {
  const result = filterAutoGrowCandidates(['B3', 'C4'], false);
  expect(result).toEqual(['B3', 'C4']);
});

// B4 same behavior
it('keeps B4 in natural session — not a flat', () => {
  const result = filterAutoGrowCandidates(['B4', 'D4'], false);
  expect(result).toEqual(['B4', 'D4']);
});
```

### TrailNodeModal enableFlats Test
A new test file for TrailNodeModal's flag derivation is appropriate (or a focused unit test for the helper logic):

```javascript
// Pure logic test (no React needed):
const deriveEnableFlats = (notePool) => notePool.some(n => /^[A-G]b\d/.test(n));

it('FULL_SHARP_POOL with B3 does not enable flats', () => {
  const FULL_SHARP_POOL = ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'F#3', 'C#3', 'G#3'];
  expect(deriveEnableFlats(FULL_SHARP_POOL)).toBe(false);
});

it('flat pool with Bb3 enables flats', () => {
  expect(deriveEnableFlats(['Bb3', 'Eb3', 'C3'])).toBe(true);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `n.includes('b')` | `/^[A-G]b\d/.test(n)` | Phase 05 | Explicit intent; robust to future lowercase B edge cases |
| `/[#b]/` | `/[#]\|[A-G]b/` | Phase 05 | Separates sharp vs flat detection; documents meaning |

## Open Questions

1. **Should the `currentPoolHasAccidentals` fallback (line 901-903) also be fixed?**
   - What we know: The fallback is only reached for non-standard launches (not via TrailNodeModal). For all trail launches, `trailEnableSharps || trailEnableFlats` takes precedence.
   - What's unclear: Are there any legitimate non-trail launches that would pass `B3`-containing pools and would hit the fallback path?
   - Recommendation: Fix the fallback too for consistency — same one-line change, minimal risk.

2. **Should a helper function be extracted for note pool flag derivation?**
   - What we know: TrailNodeModal and NotesRecognitionGame both derive these flags. Currently two separate code sites.
   - What's unclear: Whether the extraction complexity is worth it for two simple one-liners.
   - Recommendation: No extraction. The phase constraint is targeted fixes only. Two one-line changes in two files is the right scope.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project-installed) |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FIX-01 | `filterAutoGrowCandidates` keeps `'B3'` in natural session | unit | `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` | ❌ Wave 0 (add to existing file) |
| FIX-01 | `filterAutoGrowCandidates` keeps `'B4'` in natural session | unit | `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` | ❌ Wave 0 (add to existing file) |
| FIX-01 | enableFlats derivation: FULL_SHARP_POOL yields `false` | unit | `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` | ❌ Wave 0 (new test or extend file) |
| FIX-01 | enableFlats derivation: flat pool yields `true` | unit | `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` | ✅ (implicitly covered by existing Bb4 test) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Add `'B3'` and `'B4'` regression test cases to `src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js`
- [ ] Consider adding enableFlats derivation tests — can be pure-JS logic tests in the same file or a TrailNodeModal-specific test file

## Sources

### Primary (HIGH confidence)

- Direct code reading — `TrailNodeModal.jsx` line 172
- Direct code reading — `NotesRecognitionGame.jsx` lines 394-397, 901-903
- Direct code reading — `bassUnit4Redesigned.js` `FULL_SHARP_POOL` definition
- Node.js execution — verified JavaScript `String.prototype.includes` is case-sensitive
- `.planning/v2.2-MILESTONE-AUDIT.md` — audit document with proposed fix (line 132)

### Secondary (MEDIUM confidence)

- `NotesRecognitionGame.autogrow.test.js` — existing test patterns to follow for new regression tests

### Tertiary (LOW confidence)

- None

## Metadata

**Confidence breakdown:**
- Bug location: HIGH — exact file and line numbers confirmed by code reading
- Bug severity: HIGH — audit classified low-medium; code verification shows no active false positive with current pool format (capital B), but the fix is still correct and warranted
- Fix correctness: HIGH — Node.js execution confirmed regex behavior; audit proposes exact fix
- Test strategy: HIGH — existing test file and patterns confirmed

**Research date:** 2026-03-17
**Valid until:** Stable — this is pure JavaScript string matching, no version-dependent behavior
