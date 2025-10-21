# Settings Section Testing Guide

## Pre-Testing Checklist

Before testing, ensure:

1. ✅ Database migration deployed to Supabase
2. ✅ Application restarted to load new code
3. ✅ Service worker updated (may require hard refresh or clear cache)
4. ✅ User is logged in

## Testing Scenarios

### 1. Profile Settings

#### Test 1.1: View Profile Information

1. Navigate to `/settings`
2. Verify profile section is visible and expanded by default
3. Confirm current first name, last name, username, email, and level are displayed
4. Verify email and level fields are read-only (greyed out)

**Expected Result:** Profile information displays correctly with proper read-only fields

#### Test 1.2: Edit Profile - Valid Changes

1. Click "Edit Profile" button
2. Change first name to "TestFirst"
3. Change last name to "TestLast"
4. Change username to "testuser123" (if available)
5. Click "Save Changes"

**Expected Result:**

- Success toast appears
- Profile updates in UI
- Edit mode exits automatically

#### Test 1.3: Username Validation - Real-time Check

1. Click "Edit Profile"
2. Type an existing username in the username field
3. Observe the username field after 500ms debounce

**Expected Result:**

- Loading spinner appears while checking
- Red error message appears if username taken
- Green checkmark appears if username available
- Save button disabled if username unavailable

#### Test 1.4: Username Validation - Invalid Format

1. Click "Edit Profile"
2. Try entering:
   - "ab" (too short - minimum 3 characters)
   - "this_is_a_very_long_username_over_twenty_chars" (too long - maximum 20)
   - "user name" (contains space)
   - "user@name" (contains invalid character)

**Expected Result:** Error message appears for each invalid format

#### Test 1.5: Required Field Validation

1. Click "Edit Profile"
2. Clear first name field
3. Click "Save Changes"

**Expected Result:** Error message: "First name is required"

### 2. Accessibility Settings

#### Test 2.1: Visual Settings

1. Toggle "High Contrast Mode" ON
2. Observe UI changes (should increase contrast)
3. Toggle "Reduced Motion" ON
4. Try navigating (animations should be minimized)
5. Click each font size button (small, normal, large, xl)

**Expected Result:**

- Each setting applies immediately
- Changes persist across page navigation
- Font size changes are visible throughout app

#### Test 2.2: Motor Settings

1. Toggle "Large Touch Targets" ON
2. Observe buttons/controls become larger
3. Toggle "Sticky Hover" ON

**Expected Result:** UI elements adapt to motor accessibility needs

#### Test 2.3: Cognitive Settings

1. Toggle "Simplified UI" ON
2. Observe UI becomes less complex
3. Toggle "Extended Timeouts" ON

**Expected Result:** Settings apply and persist

#### Test 2.4: Navigation & Screen Reader

1. Toggle all navigation settings
2. Verify keyboard navigation works when enabled
3. Test focus indicators visibility

**Expected Result:** All navigation settings function correctly

### 3. Notification Settings

#### Test 3.1: Web Push Permission - First Time

1. Locate "Enable Push Notifications" card
2. Click "Enable Notifications" button
3. Handle browser permission dialog

**Expected Result:**

- Browser permission prompt appears
- Card updates to show permission status
- Green success card if granted
- Red blocked card if denied

#### Test 3.2: Master Notification Toggle

1. Toggle "Enable All Notifications" OFF
2. Verify all notification type toggles become disabled
3. Toggle back ON
4. Verify notification type toggles become enabled

**Expected Result:** Master toggle controls all sub-settings

#### Test 3.3: Notification Types

1. Toggle each notification type individually:
   - Achievements
   - Assignments
   - Messages
   - Reminders
   - System
2. Navigate away and back to settings

**Expected Result:** Each type can be toggled independently, settings persist

#### Test 3.4: Quiet Hours

1. Toggle "Quiet Hours" ON
2. Verify start and end time pickers appear
3. Set start time to "22:00"
4. Set end time to "08:00"
5. Toggle Quiet Hours OFF
6. Verify time pickers disappear

**Expected Result:** Quiet hours UI shows/hides correctly, times save

#### Test 3.5: Daily Practice Reminder

1. Toggle "Daily Practice Reminder" ON
2. Verify time picker appears
3. Set reminder time to "16:00"
4. Toggle reminder OFF
5. Verify time picker disappears

**Expected Result:** Reminder toggle controls time picker visibility, time saves

### 4. Audio Settings

#### Test 4.1: Sound Enable/Disable

1. Toggle "Enable Sounds" OFF
2. Try test sound button (should be disabled)
3. Navigate to a game and verify no sound plays
4. Toggle "Enable Sounds" ON
5. Verify sound works again

**Expected Result:** Master sound toggle controls all app audio

#### Test 4.2: Master Volume

1. Ensure "Enable Sounds" is ON
2. Move master volume slider to 50%
3. Click "Test Sound" button
4. Verify sound plays at medium volume
5. Move slider to 100%
6. Click "Test Sound" again
7. Verify sound plays louder

**Expected Result:**

- Volume slider updates visual feedback
- Test sound volume changes accordingly
- Volume setting persists

#### Test 4.3: Volume Disabled State

1. Toggle "Enable Sounds" OFF
2. Verify volume slider becomes disabled (greyed out)
3. Verify test sound button becomes disabled

**Expected Result:** Related controls disable when sound is off

### 5. Data Persistence

#### Test 5.1: Auto-Save

1. Change any setting (e.g., toggle high contrast)
2. Wait 1 second
3. Open browser DevTools → Network tab
4. Filter for Supabase API calls

**Expected Result:**

- Settings save automatically after 500ms
- No manual save button needed
- Network request appears in DevTools

#### Test 5.2: Session Persistence

1. Change multiple settings across all sections
2. Navigate to Dashboard
3. Navigate back to Settings
4. Verify all changes are still applied

**Expected Result:** All settings persist during session

#### Test 5.3: Cross-Session Persistence

1. Change multiple settings
2. Log out
3. Log back in
4. Navigate to Settings

**Expected Result:** All settings persist across sessions

### 6. Collapsible Sections

#### Test 6.1: Section Expand/Collapse

1. Click on each section header
2. Verify section collapses (content hides)
3. Click header again
4. Verify section expands (content shows)

**Expected Result:** All sections are collapsible and remember state

### 7. Error Handling

#### Test 7.1: Network Error During Save

1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try changing a setting

**Expected Result:**

- Error toast appears
- Setting may revert to previous value
- User is notified of the issue

#### Test 7.2: Invalid Data

1. Try entering invalid data in profile form
2. Attempt to save

**Expected Result:**

- Validation errors display
- Save is prevented
- Helpful error messages shown

### 8. Responsive Design

#### Test 8.1: Mobile View (< 768px)

1. Resize browser to mobile width
2. Verify all sections are readable
3. Test all interactive elements

**Expected Result:** UI adapts to mobile, all features accessible

#### Test 8.2: Tablet View (768px - 1024px)

1. Resize browser to tablet width
2. Test all features

**Expected Result:** UI looks good on tablet sizes

#### Test 8.3: Desktop View (> 1024px)

1. View on full desktop width
2. Verify max-width constraint (4xl = 56rem)

**Expected Result:** Content doesn't stretch too wide

### 9. Integration Tests

#### Test 9.1: Audio Settings Affect Games

1. Set master volume to 25%
2. Navigate to Note Recognition game
3. Play game and listen to sound effects

**Expected Result:** Game sounds play at 25% volume

#### Test 9.2: Accessibility Settings Affect UI

1. Enable "Large Touch Targets"
2. Enable "High Contrast"
3. Navigate through app
4. Verify buttons are larger and contrast is higher

**Expected Result:** Accessibility settings apply globally

#### Test 9.3: Profile Changes Reflect in Dashboard

1. Change first name in settings
2. Navigate to Dashboard
3. Verify new name appears in profile area

**Expected Result:** Profile changes visible throughout app

## Common Issues & Solutions

### Issue: Settings not saving

- **Check:** Is user logged in?
- **Check:** Open DevTools → Console for errors
- **Check:** Verify database migration was deployed
- **Solution:** Check network connectivity, verify Supabase connection

### Issue: Username validation not working

- **Check:** Is there a network delay?
- **Check:** Console for API errors
- **Solution:** Wait 500ms for debounce, check Supabase RLS policies

### Issue: Notifications not working

- **Check:** Is HTTPS enabled (or localhost)?
- **Check:** Browser notification support
- **Check:** Service worker registered
- **Solution:** Use supported browser, enable HTTPS, check permissions

### Issue: Audio not playing

- **Check:** Is sound enabled in settings?
- **Check:** Browser audio policy (may require user interaction first)
- **Solution:** Toggle sound on, try after user interaction

## Browser Compatibility

| Feature          | Chrome | Firefox | Safari | Edge |
| ---------------- | ------ | ------- | ------ | ---- |
| Profile Settings | ✅     | ✅      | ✅     | ✅   |
| Accessibility    | ✅     | ✅      | ✅     | ✅   |
| Web Push         | ✅     | ✅      | ❌ iOS | ✅   |
| Audio Controls   | ✅     | ✅      | ✅     | ✅   |
| Service Worker   | ✅     | ✅      | ✅     | ✅   |

**Note:** iOS Safari does not support Web Push notifications (browser limitation)

## Performance Benchmarks

Expected performance metrics:

- **Settings Page Load:** < 200ms
- **Auto-save Delay:** 500ms (debounced)
- **Username Validation:** < 1s (including network)
- **Profile Update:** < 2s
- **Test Sound Playback:** Immediate

## Accessibility Testing

Test with:

- ✅ Keyboard only (Tab, Enter, Space, Arrow keys)
- ✅ Screen reader (NVDA, JAWS, VoiceOver)
- ✅ High contrast mode enabled
- ✅ 200% browser zoom
- ✅ Touch device (tablet/mobile)

## Sign-Off Checklist

- [ ] All profile tests passing
- [ ] All accessibility tests passing
- [ ] All notification tests passing
- [ ] All audio tests passing
- [ ] Data persistence verified
- [ ] Responsive design verified
- [ ] Error handling tested
- [ ] Cross-browser compatibility checked
- [ ] Accessibility compliance verified
- [ ] Performance metrics met

---

**Testing Date:** ******\_******  
**Tester Name:** ******\_******  
**Build Version:** ******\_******  
**Status:** ⬜ Pass | ⬜ Fail | ⬜ Pass with Issues
