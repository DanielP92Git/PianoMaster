---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/pages/AppSettings.jsx
  - src/locales/en/common.json
  - src/locales/he/common.json
autonomous: true
requirements: [QUICK-INSTALL-BUTTON]

must_haves:
  truths:
    - "On desktop Chrome/Edge, the settings Install section shows an Install App button that triggers the native PWA install prompt"
    - "On Android Chrome, the existing install button continues to work"
    - "On iOS Safari, the manual install steps continue to show"
    - "When the app is already installed (standalone mode), no install button shows"
    - "When beforeinstallprompt has not fired (unsupported browser), a helpful fallback message shows instead of a broken button"
  artifacts:
    - path: "src/pages/AppSettings.jsx"
      provides: "Install App button in settings install card for all beforeinstallprompt-capable browsers"
    - path: "src/locales/en/common.json"
      provides: "English i18n keys for desktop install button/description"
    - path: "src/locales/he/common.json"
      provides: "Hebrew i18n keys for desktop install button/description"
  key_links:
    - from: "src/pages/AppSettings.jsx"
      to: "src/components/pwa/PWAInstallPrompt.jsx"
      via: "window.dispatchEvent(new Event('request-pwa-install')) custom event"
      pattern: "request-pwa-install"
---

<objective>
Add an "Install App" button to the Settings install card so that users on ANY platform supporting `beforeinstallprompt` (desktop Chrome, Edge, Android Chrome) can trigger the native PWA install prompt directly from settings.

Purpose: Currently only Android Chrome users see an install button in settings. Desktop Chrome/Edge users see only a text fallback ("Visit on mobile...") even though `beforeinstallprompt` fires on those platforms too. This gives all eligible users a direct install action.

Output: Updated AppSettings install section with a universal install button, plus i18n keys.
</objective>

<execution_context>
@C:\Users\pagis\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\pagis\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@src/pages/AppSettings.jsx
@src/components/pwa/PWAInstallPrompt.jsx
@src/utils/pwaDetection.js
@src/locales/en/common.json
@src/locales/he/common.json

<interfaces>
<!-- The existing event-based communication pattern between AppSettings and PWAInstallPrompt -->

From src/components/pwa/PWAInstallPrompt.jsx (lines 79-93):
- Listens for `window.addEventListener("request-pwa-install", ...)` custom event
- If `installer.canInstall` is true, opens the install prompt modal
- If not available, dispatches `window.dispatchEvent(new CustomEvent("pwa-install-unavailable"))` back

From src/pages/AppSettings.jsx (lines 69-91):
- Listens for `pwa-install-unavailable` and shows toast via `toast.error(t("install.unavailableToast"))`
- `handleAndroidInstallRequest()` dispatches `new Event("request-pwa-install")`
- `installEnv` state tracks: isIOS, isSafari, isAndroid, isChrome, isStandalone

From src/utils/pwaDetection.js:
```javascript
export const isIOSDevice = () => { ... }
export const isSafariBrowser = () => { ... }
export const isAndroidDevice = () => { ... }
export const isChromeBrowser = () => { ... }
export const isInStandaloneMode = () => { ... }
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add universal install button to settings and update i18n</name>
  <files>src/pages/AppSettings.jsx, src/locales/en/common.json, src/locales/he/common.json</files>
  <action>
Refactor the install section in `AppSettings.jsx` to show an "Install App" button on ALL platforms where `beforeinstallprompt` can fire (desktop Chrome, desktop Edge, Android Chrome), not just Android.

**Changes to `src/pages/AppSettings.jsx`:**

1. Rename `handleAndroidInstallRequest` to `handleInstallRequest` (it is not Android-specific -- it dispatches `request-pwa-install` which works on any platform where `PWAInstallPrompt` has captured the `beforeinstallprompt` event).

2. Compute a new boolean `showDesktopInstall`:
   ```js
   const showDesktopInstall =
     installEnv.isReady &&
     !installEnv.isStandalone &&
     !showIOSInstall &&
     !showAndroidInstall;
   ```
   This covers desktop Chrome, desktop Edge, and any other non-iOS/non-Android browser that fires `beforeinstallprompt`.

3. In the fallback block (`!showIOSInstall && !showAndroidInstall`), replace the static "no install" text with a section that includes:
   - A description paragraph: `t("install.desktop.installDescription")`
   - An "Install App" button that calls `handleInstallRequest()` (same event dispatch pattern as Android)
   - A secondary note: `t("install.desktop.installFallback")` explaining that if the button doesn't work, the browser may not support installation

4. Keep the `showAndroidInstall` block's button calling the same renamed `handleInstallRequest`.

5. The `pwa-install-unavailable` listener already shows a toast -- this will fire if the user clicks Install on a browser where `beforeinstallprompt` hasn't been captured. No changes needed there.

**Changes to `src/locales/en/common.json`:**

Add under the `"install"` object a new `"desktop"` key:
```json
"desktop": {
  "installDescription": "You can install PianoMaster as an app for quick access and a native experience.",
  "installButton": "Install App",
  "installFallback": "If the button doesn't work, your browser may not support app installation. Try using Chrome or Edge."
}
```

**Changes to `src/locales/he/common.json`:**

Add matching Hebrew translations under the `"install"` object:
```json
"desktop": {
  "installDescription": "אתם יכולים להתקין את PianoMaster כאפליקציה לגישה מהירה וחויה טבעית.",
  "installButton": "התקנת אפליקציה",
  "installFallback": "אם הכפתור לא עובד, ייתכן שהדפדפן שלכם אינו תומך בהתקנת אפליקציות. נסו להשתמש ב-Chrome או Edge."
}
```

**Design notes:**
- The desktop install button should use the same styling as the Android install button: `px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-colors text-sm font-medium` with a `Download` icon
- Keep the `installDescriptionNoInstall` text available but only show it when `isStandalone` is true (already installed) as a "you're all set" message. Actually, if standalone, the install section's `defaultOpen={false}` is fine as-is. If you detect standalone, consider showing a brief "Already installed" message instead.
  </action>
  <verify>
    <automated>cd C:/Development/PianoApp2 && npx vitest run src/pages/AppSettings.cleanup.test.jsx 2>/dev/null; npm run lint -- --quiet 2>&1 | head -20; npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>
- Desktop Chrome/Edge: Settings > Install section shows "Install App" button that dispatches `request-pwa-install` event
- Android Chrome: Install button still works (renamed handler, same behavior)
- iOS Safari: Manual install steps still show (unchanged)
- Standalone mode: Shows appropriate "already installed" or fallback message
- All i18n keys present in both en and he locales
- Build succeeds, lint passes
  </done>
</task>

</tasks>

<verification>
1. `npm run build` succeeds (no missing imports, no broken i18n keys)
2. `npm run lint` passes
3. Manual verification: open Settings > Install section on desktop Chrome to confirm Install App button appears
</verification>

<success_criteria>
- Install App button visible in settings on desktop Chrome/Edge (not just Android)
- Button triggers native PWA install prompt via existing `request-pwa-install` event mechanism
- iOS Safari install instructions unchanged
- Android Chrome install button unchanged (just renamed handler)
- i18n complete for en and he
- No regressions in existing install flow
</success_criteria>

<output>
After completion, create `.planning/quick/260326-mrm-add-install-app-button-to-settings-insta/260326-mrm-SUMMARY.md`
</output>
