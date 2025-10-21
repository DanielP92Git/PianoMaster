# Practice Reminder Implementation

## Overview

Implemented a comprehensive practice reminder alarm system for the Dashboard that triggers both in-app alarms and browser notifications when the set time arrives.

## Features Implemented

### 1. Dashboard Reminder Service (`src/services/dashboardReminderService.js`)

A dedicated service that manages practice reminders set from the Dashboard:

- **Monitoring**: Checks every second if the reminder time has been reached
- **Smart Triggering**:
  - If app is visible: Plays looping alarm sound + shows full-screen modal
  - If app is hidden/backgrounded: Sends browser notification
- **Alarm Audio**: Uses `/audio/alarm.mp3` with looping playback
- **Snooze Support**: 15-minute snooze functionality
- **Persistent Storage**: Saves to localStorage, survives page refreshes
- **Permission Handling**: Requests notification permissions when needed

Key Methods:

- `initialize()` - Loads saved reminders and starts monitoring
- `scheduleReminder(dateTimeMs)` - Schedules a new reminder
- `cancelReminder()` - Cancels active reminder
- `snooze(minutes)` - Snoozes alarm for specified duration
- `getActiveReminder()` - Returns current reminder info for UI display
- `stopAlarm()` - Stops alarm and clears reminder

### 2. Alarm Modal Component (`src/components/ui/AlarmModal.jsx`)

Full-screen modal that appears when reminder triggers while app is open:

- **Visual Design**: Gradient background with pulsing bell icon
- **User Actions**:
  - "Dismiss" button - Stops alarm completely
  - "Snooze (15 min)" button - Reschedules for 15 minutes later
- **Device Integration**: Triggers device vibration if supported
- **Animations**: Smooth fade-in and zoom effects

### 3. App Integration (`src/App.jsx`)

- Initializes dashboard reminder service on app startup
- Listens for service worker messages:
  - `SNOOZE_DASHBOARD_REMINDER` - From notification snooze action
  - `STOP_ALARM` - From notification dismiss action
- Renders `<AlarmModal />` globally

### 4. Dashboard Updates (`src/components/layout/Dashboard.jsx`)

#### Active Reminder Indicator

- Polls reminder status every second
- Shows countdown display when reminder is active
- Format: "⏰ Practice reminder in: 2h 15m"
- Displays scheduled time
- Includes "Cancel" button to remove reminder

#### Set Reminder Modal

- Requests notification permission if needed
- Integrates with dashboard reminder service
- Saves reminder and starts monitoring
- User-friendly date/time picker

#### UI Behavior

- Shows "Set a Practice Reminder" button when no reminder is active
- Replaces with active reminder indicator when reminder is set
- Indicator animates (pulsing icon) to draw attention

### 5. Service Worker Notification Handling (`sw.js`)

Added handlers for `dashboard-practice-reminder` notification type:

- **Snooze Action**: Posts `SNOOZE_DASHBOARD_REMINDER` message to app
- **Dismiss Action**: Posts `STOP_ALARM` message to app
- **Click (no action)**: Opens/focuses the dashboard
- **Notification Settings**:
  - `requireInteraction: true` - Stays visible until user acts
  - Vibration pattern: `[200, 100, 200, 100, 200]`
  - Actions: "Dismiss" and "Snooze 15 min"

## User Flow

### Setting a Reminder

1. User clicks "Set a Practice Reminder" button on Dashboard
2. App checks notification permission:
   - If not granted: Requests permission
   - If denied: Shows error message
3. User selects date and time
4. Reminder is scheduled and saved to localStorage
5. Active reminder indicator appears with countdown

### When Reminder Triggers (App Open)

1. Looping alarm sound starts playing
2. Full-screen modal appears with message
3. Device vibrates (if supported)
4. User can:
   - Click "Dismiss" → Alarm stops, reminder removed
   - Click "Snooze (15 min)" → Alarm stops, reschedules for 15 min later

### When Reminder Triggers (App Closed/Background)

1. Browser notification appears with sound
2. Notification stays visible until user acts
3. User can:
   - Click "Dismiss" → Clears reminder
   - Click "Snooze 15 min" → Reschedules for 15 min later
   - Click notification body → Opens app to dashboard

### Canceling a Reminder

1. User clicks "Cancel" button on active reminder indicator
2. Reminder is removed from localStorage
3. Monitoring stops
4. "Set a Practice Reminder" button reappears

## Technical Details

### Time Formatting

Helper function `formatTimeRemaining(ms)` converts milliseconds to readable format:

- Hours and minutes: "2h 15m"
- Minutes only: "45m"
- Seconds only: "30s"

### Alarm State Management

Uses callback pattern for real-time alarm state updates:

- Components register callbacks via `onAlarmStateChange()`
- Service notifies all callbacks when alarm starts/stops
- Enables multiple UI components to respond to alarm state

### Visibility Detection

Uses `document.visibilityState` to determine if app is visible:

- `visible` → Play in-app alarm with modal
- `hidden` → Send browser notification

### Storage Structure

```javascript
{
  dateTime: 1708012800000,  // Timestamp when reminder should trigger
  isActive: true             // Whether reminder is active
}
```

## Browser Compatibility

- **Notifications**: Supported in all modern browsers (Chrome, Firefox, Edge, Safari)
- **Service Worker**: Required for background notifications
- **Audio**: Standard HTML5 Audio API
- **Vibration**: Optional enhancement, falls back gracefully if not supported

## Testing

### Manual Testing Checklist

1. ✓ Set reminder for 1 minute in future → verify countdown appears
2. ✓ Wait for trigger with app open → verify looping alarm plays + modal shows
3. ✓ Test snooze button → verify alarm stops and reschedules
4. ✓ Test dismiss button → verify alarm stops and clears
5. ✓ Set reminder, close/minimize browser → verify notification appears at time
6. ✓ Click notification snooze action → verify reschedules
7. ✓ Click notification dismiss action → verify clears
8. ✓ Verify active reminder indicator updates in real-time
9. ✓ Cancel active reminder → verify stops monitoring and clears display
10. ✓ Refresh page with active reminder → verify countdown resumes
11. ✓ Test with notification permission denied → verify error message

## Files Modified/Created

### New Files

- `src/services/dashboardReminderService.js` - Core reminder service
- `src/components/ui/AlarmModal.jsx` - Full-screen alarm modal
- `PRACTICE_REMINDER_IMPLEMENTATION.md` - This documentation

### Modified Files

- `src/App.jsx` - Service initialization and message handling
- `src/components/layout/Dashboard.jsx` - UI integration and controls
- `sw.js` - Notification action handling

## Future Enhancements

Potential improvements for future iterations:

1. **Custom Snooze Duration**: Allow user to choose snooze duration
2. **Multiple Reminders**: Support setting multiple reminders
3. **Recurring Reminders**: Option for daily/weekly recurring reminders
4. **Custom Alarm Sounds**: Let users choose different alarm sounds
5. **Reminder History**: Track reminder completion/dismissal
6. **Integration with Practice Sessions**: Auto-start practice session on dismiss
7. **Reminder Templates**: Quick-set common reminder times (e.g., "30 min", "1 hour")

## Known Limitations

1. Notification appearance/behavior varies slightly between browsers
2. iOS Safari has limited notification support (requires add to home screen)
3. Alarm sound may not play if browser has autoplay restrictions
4. Service Worker notifications not available in private/incognito mode on some browsers




