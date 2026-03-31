---
phase: 14
slug: console-logging-cleanup
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-31
---

# Phase 14 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vite.config.js` (vitest config) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | QUAL-06 | grep | `grep -rn "console\.log\|console\.debug" src/ --include="*.js" --include="*.jsx" \| grep -v "eslint-disable" \| grep -v "import.meta.env.DEV" \| grep -v "__srLog" \| grep -v "process.env.NODE_ENV" \| grep -v "if (DEBUG)" \| grep -v "if (RHYTHM_DEBUG)" \| grep -v "if (METRONOME_TIMING_DEBUG)" \| grep -v "isDebugEnabled" \| wc -l` | N/A | pending |
| 14-01-02 | 01 | 1 | QUAL-06 | lint | `npm run lint 2>&1 \| grep -c "no-console"` (expect 0) | N/A | pending |
| 14-01-03 | 01 | 1 | QUAL-06 | build | `npm run build 2>&1 \| tail -1` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Production console clean | QUAL-06 | Requires running app in browser | `npm run build && npm run preview`, open browser DevTools console, navigate through login -> dashboard -> trail -> play a game. Verify zero console.log/debug output. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
