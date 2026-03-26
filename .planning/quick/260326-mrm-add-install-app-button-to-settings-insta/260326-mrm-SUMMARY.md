---
phase: quick
plan: 260326-mrm
subsystem: pwa/settings
tags: [pwa, install, settings, i18n, desktop]
dependency_graph:
  requires: []
  provides: [desktop-pwa-install-button]
  affects: [src/pages/AppSettings.jsx]
tech_stack:
  added: []
  patterns: [request-pwa-install custom event, beforeinstallprompt detection]
key_files:
  created: []
  modified:
    - src/pages/AppSettings.jsx
    - src/locales/en/common.json
    - src/locales/he/common.json
decisions:
  - showDesktopInstall catches all non-iOS/non-Android platforms where beforeinstallprompt fires
  - Single handleInstallRequest handler replaces platform-specific handleAndroidInstallRequest
metrics:
  duration: "~5 minutes"
  completed: "2026-03-26"
  tasks_completed: 1
  files_modified: 3
---

# Quick Task 260326-mrm: Add Install App Button to Settings

**One-liner:** Universal PWA install button in settings using `request-pwa-install` event for desktop Chrome/Edge alongside existing Android and iOS flows.

## What Was Built

The settings Install section previously showed a static fallback message ("Visit on mobile...") on desktop browsers even though Chrome and Edge support `beforeinstallprompt`. This task adds a proper "Install App" button for all platforms that support `beforeinstallprompt` but are not Android or iOS.

## Changes

### `src/pages/AppSettings.jsx`
- Renamed `handleAndroidInstallRequest` to `handleInstallRequest` — the function is platform-agnostic (dispatches `request-pwa-install` custom event regardless of OS)
- Added `showDesktopInstall` boolean: `isReady && !isStandalone && !showIOSInstall && !showAndroidInstall`
- Replaced the static fallback `<p>` with a full install section rendered when `showDesktopInstall` is true, containing a description, an "Install App" button with `Download` icon matching Android button styling, and a fallback note explaining what to do if the button doesn't work

### `src/locales/en/common.json`
Added `install.desktop` object:
- `installDescription` — describes what the button does
- `installButton` — "Install App"
- `installFallback` — guidance when `beforeinstallprompt` hasn't fired (unsupported browser)

### `src/locales/he/common.json`
Added matching Hebrew translations under `install.desktop`.

## Behavior by Platform

| Platform | Behavior |
|---|---|
| Desktop Chrome / Edge | Shows "Install App" button; triggers native PWA prompt via `request-pwa-install` event |
| Android Chrome | Unchanged — shows Android-specific install button (same renamed handler) |
| iOS Safari | Unchanged — shows manual step-by-step install instructions |
| Already installed (standalone) | `showDesktopInstall` is false; install section collapses (defaultOpen=false) |
| Unsupported browser | Button shown; `pwa-install-unavailable` event fires toast error if browser can't install |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `src/pages/AppSettings.jsx` modified — handleInstallRequest, showDesktopInstall, desktop install JSX block
- [x] `src/locales/en/common.json` modified — install.desktop keys added
- [x] `src/locales/he/common.json` modified — install.desktop Hebrew keys added
- [x] Build succeeds (`npm run build` — exit 0)
- [x] Commit c2084b8 exists

## Self-Check: PASSED
