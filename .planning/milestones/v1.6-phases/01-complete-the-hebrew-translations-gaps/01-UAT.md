---
status: testing
phase: 01-complete-the-hebrew-translations-gaps
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md]
started: 2026-03-08T12:00:00Z
updated: 2026-03-08T12:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: English Install Instructions in Settings
expected: |
  Go to Settings page (in English). Scroll to the PWA install section.
  Safari and iOS install steps should display proper English text
  (e.g., "Tap the Share button", step descriptions).
  No raw translation keys like "install.safari.installStep1" should appear.
awaiting: user response

## Tests

### 1. English Install Instructions in Settings
expected: Go to Settings page (in English). Scroll to the PWA install section. Safari and iOS install steps should display proper English text (e.g., "Tap the Share button", step descriptions). No raw translation keys like "install.safari.installStep1" should appear.
result: [pending]

### 2. Hebrew Notification Settings Description
expected: Switch language to Hebrew, go to Settings > Notifications section. The "enable all notifications" toggle should show a proper Hebrew description below it. No missing translation fallback or raw key should appear.
result: [pending]

### 3. Hebrew Trail Page - No Deprecated Names
expected: Switch to Hebrew, open the Trail Map. All node names should display in Hebrew. No deprecated English unit names like "Beat Builders", "Rainbow of Notes", "Speed Champions" etc. should appear.
result: [pending]

### 4. No Console Translation Warnings
expected: Open browser DevTools console. Navigate through Settings and Trail pages in both English and Hebrew. No i18next "missing key" warnings should appear in the console output.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0

## Gaps

[none yet]
