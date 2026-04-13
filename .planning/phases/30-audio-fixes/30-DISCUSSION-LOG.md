# Phase 30: Audio Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 30-audio-fixes
**Areas discussed:** Audio pre-warming, Dictation first-click, Eighths discovery sequence

---

## Audio Pre-Warming (AUDIO-01)

### Platform Scope

| Option                    | Description                                                                                           | Selected |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| Mainly iOS/Safari         | Safari is stricter about AudioContext suspension -- fix would focus on resume-before-schedule pattern |          |
| All platforms             | General issue with the 0.1s buffer being too short or context not being warmed                        |          |
| Not sure / haven't tested | Claude should investigate and fix for all platforms defensively                                       | Yes      |

**User's choice:** Not sure / haven't tested
**Notes:** Fix defensively across all platforms

### Approach

| Option                       | Description                                                                                                                | Selected |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| Await resume, then schedule  | Ensure ctx.resume() resolves before calling schedulePatternPlayback. Simplest fix -- adds ~50ms latency on first play only | Yes      |
| Silent warm-up on game mount | Play an inaudible oscillator on game component mount. Pre-warms context before first real play                             |          |
| You decide                   | Claude picks the best approach                                                                                             |          |

**User's choice:** Await resume, then schedule (Recommended)
**Notes:** None

---

## Dictation First-Click (AUDIO-02)

| Option              | Description                                               | Selected |
| ------------------- | --------------------------------------------------------- | -------- |
| Full discretion     | Claude investigates the exact race condition and fixes it | Yes      |
| I have more context | User has specific behavior observations to share          |          |

**User's choice:** Full discretion
**Notes:** Claude to investigate and fix the initialization race condition

---

## Eighths Discovery Sequence (AUDIO-03)

| Option             | Description                                                              | Selected |
| ------------------ | ------------------------------------------------------------------------ | -------- |
| 4 pairs with gaps  | Play 8 eighth notes grouped as 4 pairs with short rest between each pair |          |
| 4 pairs continuous | Play 8 consecutive eighth notes without pauses                           |          |
| You decide         | Claude picks what sounds best pedagogically                              |          |

**User's choice:** Other -- "4 pairs continuous but 1st eighths is higher pitch, 2nd lower for distinction"
**Notes:** User wants pitch alternation (high-low) within each pair so the child can distinguish the beamed pair grouping aurally, without needing pauses between pairs.

---

## Claude's Discretion

- Root cause investigation for AUDIO-02
- Pitch values for high/low eighths in discovery demo
- Whether fix is applied at schedulePatternPlayback level or call sites
- Additional defensive guards in audio pipeline

## Deferred Ideas

None
