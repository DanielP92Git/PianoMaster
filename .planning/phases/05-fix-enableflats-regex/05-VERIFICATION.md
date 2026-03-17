---
phase: 05-fix-enableflats-regex
verified: 2026-03-17T09:50:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 05: Fix enableFlats Regex False-Positive — Verification Report

**Phase Goal:** Sharp-only nodes containing natural note 'B' no longer falsely trigger flat mode in games
**Verified:** 2026-03-17T09:50:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Sharp-only node bass_4_6 (pool includes B3) derives enableFlats=false | VERIFIED | `FULL_SHARP_POOL = ['C4','B3','A3','G3','F3','E3','D3','C3','F#3','C#3','G#3']`. Fixed regex `/^[A-G]b\d/` does not match 'B3' (starts with uppercase B, not a note-letter followed by lowercase 'b'). No flat notes in pool. enableFlats=false is guaranteed. |
| 2 | Flat node with pool including Bb3 still correctly derives enableFlats=true | VERIFIED | Fixed regex `/^[A-G]b\d/` matches 'Bb3' (B=note letter, b=flat symbol, 3=octave digit). Pool `['A3','Bb3','B3']` in bassUnit5 yields enableFlats=true. Confirmed by enableFlats derivation test suite (15/15 tests pass). Note: PLAN cited bass_3_1 as the exemplar but that node contains no flats; actual flat nodes are in bassUnit5Redesigned.js. The regex behavior is correct regardless. |
| 3 | filterAutoGrowCandidates keeps B3 and B4 in natural sessions | VERIFIED | `NotesRecognitionGame.jsx` line 396: `!/[#]\|[A-G]b/.test(pitch)`. Pattern `[A-G]b` requires a note-letter before lowercase 'b'; 'B3' has uppercase B which does not satisfy `[A-G]` match for the 'b' that follows. Test: `filterAutoGrowCandidates(['B3','C4'], false)` returns `['B3','C4']`. 2 regression tests pass. |
| 4 | filterAutoGrowCandidates still filters Bb4, Eb3, F#4 from natural sessions | VERIFIED | Pattern `[#]` catches F#4; pattern `[A-G]b` catches Bb4, Eb3. Pre-existing tests confirm: 'F#4' filtered, 'Bb4' filtered, both together filtered. All 15 autogrow tests green. |
| 5 | currentPoolHasAccidentals fallback regex does not false-positive on B3 | VERIFIED | `NotesRecognitionGame.jsx` line 903: `(currentNode.noteConfig?.notePool \|\| []).some(p => /[#]\|[A-G]b/.test(p))`. Same anchored pattern as filterAutoGrowCandidates. 'B3' does not match. No `[#b]` pattern remains in file (grep confirms zero hits). |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` | Regression tests for B3/B4 false-positive scenarios; contains 'B3' | VERIFIED | File exists. Contains `filterAutoGrowCandidates(['B3','C4'], false)` and `filterAutoGrowCandidates(['B4','D4'], false)` regression tests. Second describe block `enableFlats derivation — anchored flat detection` with `deriveEnableFlats` helper and 4 cases including FULL_SHARP_POOL. 15 tests total, all pass. |
| `src/components/trail/TrailNodeModal.jsx` | Anchored enableFlats regex; contains `/^[A-G]b\d/` | VERIFIED | Line 172: `const enableFlats = notePool.some(n => /^[A-G]b\d/.test(n));`. Old `n.includes('b')` confirmed removed (grep: zero matches). |
| `src/components/games/notes-master-games/NotesRecognitionGame.jsx` | Fixed filterAutoGrowCandidates and currentPoolHasAccidentals regexes; contains `[A-G]b` | VERIFIED | Line 396: `!/[#]\|[A-G]b/.test(pitch)`. Line 903: `some(p => /[#]\|[A-G]b/.test(p))`. Old `/[#b]/` confirmed removed (grep: zero matches). |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/trail/TrailNodeModal.jsx` | `location.state.enableFlats` | `navigate()` with navState | WIRED | `navState` object at line 175 includes `enableFlats` key. All 5 `navigate()` switch cases pass the full `navState`. `NotesRecognitionGame.jsx` line 421: `const trailEnableFlats = location.state?.enableFlats ?? false`. Line 545: `enableFlats: trailEnableFlats` propagated into game settings. |
| `src/components/games/notes-master-games/NotesRecognitionGame.jsx` | `filterAutoGrowCandidates` | Exported function called during auto-grow | WIRED | `filterAutoGrowCandidates` is exported at line 394. Called at line 923: `const eligibleCandidates = filterAutoGrowCandidates(newCandidates, currentPoolHasAccidentals)`. Test file imports it directly: `import { filterAutoGrowCandidates } from './NotesRecognitionGame.jsx'`. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FIX-01 | 05-01-PLAN.md | Trail auto-start passes correct `enableSharps`/`enableFlats` flags derived from node's notePool | SATISFIED | Three regex fix sites patched. TrailNodeModal derives `enableFlats` using anchored `/^[A-G]b\d/`. NotesRecognitionGame consumes flag from `location.state.enableFlats`. filterAutoGrowCandidates and currentPoolHasAccidentals both use `/[#]\|[A-G]b/`. All 15 tests pass. No fragile patterns remain. |

Note: REQUIREMENTS.md Traceability table maps FIX-01 to "Phase 01, Phase 05". Phase 01 addressed the initial flag derivation and propagation. Phase 05 closes the remaining regex hardening gap. No orphaned requirements found — FIX-01 is the only requirement declared in the plan and it appears in REQUIREMENTS.md with Phase 05 listed.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

No TODOs, FIXMEs, placeholder returns, or empty implementations found in the three modified files. No console.log-only handlers. No instances of the previously fragile patterns (`includes('b')` in TrailNodeModal, `/[#b]/` in NotesRecognitionGame).

---

### Human Verification Required

The following behaviors are correct by code inspection but can only be fully confirmed with a running game session:

**1. bass_4_6 launches with enableFlats=false in a live session**

Test: Navigate to bass unit 4 on the trail. Open node `bass_4_6` (Sharp Memory). Start a note recognition session. Observe that no flat note options (Bb, Eb, Ab, Db) appear in the answer choices.
Expected: Only natural and sharp notes appear. Flat note buttons are absent or disabled.
Why human: The flag propagation from TrailNodeModal through navigation state to game settings initialization happens at runtime. Code inspection confirms correct wiring but UI rendering of answer choices requires a live run.

**2. Auto-grow at combo milestone on bass_4_6 does not inject flat notes**

Test: Play bass_4_6 in a note recognition session. Reach a combo milestone (10-note combo) that triggers auto-grow. Observe what new notes are added to the pool.
Expected: Only notes from the next node in the bass clef category are added. No flats (Bb, Eb, Ab, Db) appear in the expanded pool.
Why human: Auto-grow depends on `getNextNodeInCategory()` returning a specific node and the pool filtering occurring at combo time. This requires sustained in-game play to trigger.

---

### Gaps Summary

No gaps. All five observable truths are verified, all three artifacts pass existence/substantive/wiring checks, both key links are fully wired, and the sole declared requirement (FIX-01) is satisfied.

Minor documentation discrepancy: PLAN truth #2 references `bass_3_1` as "the flat node with Bb3" but `bass_3_1`'s actual pool is `['C4','B3','A3','G3','F3']` (all naturals). The nodes with Bb3 are in `bassUnit5Redesigned.js`. This is a factual error in the PLAN description, not in the implementation — the regex correctly handles pools containing Bb3 as confirmed by tests.

---

## Commit Verification

| Commit | Hash | Contents |
|--------|------|----------|
| test(05-01): add B3/B4 regression tests | `d6310ce` | Extended autogrow test file with 2 B3/B4 regression cases + 4 enableFlats derivation cases (+37 lines) |
| fix(05-01): replace ambiguous flat-detection regexes | `0ab0e3f` | TrailNodeModal.jsx line 172 + NotesRecognitionGame.jsx lines 396 and 903 (3 insertions, 3 deletions) |

Both commits confirmed present in `git log` on `main` branch.

---

_Verified: 2026-03-17T09:50:00Z_
_Verifier: Claude (gsd-verifier)_
