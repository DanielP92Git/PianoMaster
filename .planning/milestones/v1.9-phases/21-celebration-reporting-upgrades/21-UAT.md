---
status: diagnosed
phase: 21-celebration-reporting-upgrades
source: [21-01-SUMMARY.md, 21-02-SUMMARY.md]
started: 2026-03-07T19:15:00Z
updated: 2026-03-07T19:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Weekly Summary Card on Dashboard
expected: Dashboard shows a glass card titled "Weekly Summary" or similar, displaying 3 stats: days practiced (with a circular SVG progress indicator), nodes completed, and exercises done over the last 7 days.
result: pass

### 2. Daily Fun Fact Banner
expected: Dashboard shows a fun fact banner between the header area and the "Play Next" / "Continue Learning" button. The message should be a short music/piano fact (one of 12 rotating messages).
result: issue
reported: "it shows but it intersects with the play next button. we should find a better placement"
severity: minor

### 3. Personal Best Badge on VictoryScreen
expected: Complete a trail exercise where you beat your previous best score. VictoryScreen should show an amber/gold Trophy badge indicating "Personal Best!" or similar. On first-ever completion of a node (no previous score), no personal best badge should appear.
result: pass

### 4. Fun Fact Daily Rotation
expected: Refreshing the dashboard on the same day shows the same fun fact message. The message should differ from yesterday's (localStorage-based non-repeat logic).
result: pass

### 5. i18n Support for New Features
expected: Switch language to Hebrew in settings. The Weekly Summary card labels, fun fact messages, and personal best badge text should all appear in Hebrew (RTL layout).
result: pass

## Summary

total: 5
passed: 4
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "DailyMessageBanner displays without overlapping other dashboard elements"
  status: failed
  reason: "User reported: it shows but it intersects with the play next button. we should find a better placement"
  severity: minor
  test: 2
  root_cause: "DailyMessageBanner rendered between hero and PlayNextButton (-mt-7 overlap), causing z-order collision"
  artifacts:
    - path: "src/components/layout/Dashboard.jsx"
      issue: "Banner placement between hero and negative-margin PlayNextButton"
  missing:
    - "Move DailyMessageBanner inside main content area, below PlayNextButton"
  debug_session: ""
  fix_applied: "Moved DailyMessageBanner from between hero/PlayNextButton to inside main content MotionOrDiv, above UnifiedStatsCard"
