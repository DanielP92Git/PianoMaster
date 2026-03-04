---
phase: 10
slug: performance-profiling-gated
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing) + manual Chrome DevTools profiling |
| **Config file** | vitest.config.js (existing) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds (existing tests only; profiling is manual) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | PERF-01 | manual | Chrome DevTools USB profiling | N/A | ⬜ pending |
| 10-01-02 | 01 | 1 | PERF-01 | manual | Review flame chart + FPS data | N/A | ⬜ pending |
| 10-02-01 | 02 | 2 | PERF-02 | unit | `npx vitest run src/hooks/usePitchDetection.test.js` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 2 | PERF-03 | unit | `npx vitest run public/worklets/pitch-detector.worklet.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for PERF-02/PERF-03 are only needed IF profiling triggers AudioWorklet build
- [ ] Profiling session (PERF-01) is entirely manual — no automated test infrastructure needed

*Note: This phase is profiling-gated. Wave 2 tests (PERF-02, PERF-03) are only created if PERF-01 shows >5% frame drop.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CPU profiling on real Android device | PERF-01 | Requires physical hardware + USB debugging | Connect device, open chrome://inspect, record Performance trace during 10-question session, verify FPS ≥57 |
| Frame drop measurement | PERF-01 | Chrome DevTools is the measurement tool | Check FPS chart for red bars during active mic detection, check Scripting % in Summary tab |
| Bass clef detection accuracy (if AudioWorklet built) | PERF-03 | Requires real microphone + instrument | Play A2-E4 notes into mic, verify correct detection |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
