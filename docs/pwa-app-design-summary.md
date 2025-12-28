# PWA App Design - Summary from web.dev

**Source:** [web.dev/learn/pwa/app-design](https://web.dev/learn/pwa/app-design)

## Overview
This document summarizes critical aspects of rendering content outside of the browser tab for Progressive Web Apps.

---

## 1. The Window

Different operating systems handle application windows differently:
- **iPhones**: Apps always take 100% of the screen
- **Android/iPads**: Usually fullscreen, can share screen between two apps, but only one instance at a time
- **Desktop**: Multiple instances possible, can resize/position anywhere, can overlap

---

## 2. The Icon

Icons appear in:
- Home screen (iOS, iPadOS, Android)
- App Launcher (macOS, Android)
- Start Menu/App Menu (Windows, ChromeOS, Linux)
- Dock, TaskBar, Multi-task panels (all OS)

**Best Practice:** Create platform-agnostic icons as each OS can apply different shape masks.

---

## 3. Theming Your App

### Theme Color
- Defines the color of the window's title bar (desktop) and status bar (mobile)
- Can use meta tag with different schemes (dark/light mode) based on user preference
- **Important:** Only plain colors work (no images/gradients)
- Best to use colors without transparency
- Use `rgb`, `hsl`, hex codes, or named colors

### Background Color
- Defines the color of the window before the app and CSS are loaded

### Accent Color
- Defines the color of built-in browser components (form controls)

**Note:** Theming may affect browser theming even without installing the app (e.g., using `<meta name="theme-color">`).

---

## 4. Display Modes

Three main options:
1. **Fullscreen**
2. **Standalone**
3. **Minimal User Interface**

You can also use **Window Controls Overlay** for advanced display mode.

**Fallback Chain:** If a display mode isn't supported, it falls back:
- Fullscreen → Standalone → Minimal UI → Browser (default)

Use `display_override` field to specify your own fallback chain before evaluating the `display` member.

### Fullscreen Experience
- Suitable for immersive experiences (games, VR, AR)
- **Currently only available on Android devices**
- Hides status bar and navigation bar
- Gives 100% of screen for content
- On desktop/iPadOS: Not supported, but can use Fullscreen API from within PWA

### Standalone Experience
- **Most common option** for PWAs
- Displays PWA in OS-standard window without browser navigation UI
- May include browser-controlled menu (copy URL, extensions, permissions, SSL cert)
- **On mobile**: Keeps status bar visible (notifications, time, battery)
- Often no browser-controlled menu on mobile
- Some Android browsers create fixed/silent notification with URL copy options

### Minimal User Interface
- Available on Android and desktop
- Shows minimal browser UI to help navigation
- **Android**: Title bar with current `<title>` and origin, small dropdown menu
- **Desktop**: Back button, stop/reload controls
- **Warning:** Safari on iOS/iPadOS doesn't support Minimal UI - falls back to browser shortcut/bookmark

---

## 5. Optimizing Design for Desktop

Consider:
- Endless window size possibilities
- Mini-mode: Desktop apps can be as small as 200x100 pixels
- The `<title>` element is used as the window title
- `<title>` appears in alt-tab and other places
- **Important:** Update `<title>` when moving between routes/sections in React/Vue apps

---

## 6. CSS Best Practices

### Display Mode Media Queries

```css
/* Browser mode only */
@media (display-mode: browser) {
}

/* Standalone mode only */
@media (display-mode: standalone) {
}

/* All installed app modes */
@media (display-mode: standalone), 
       (display-mode: fullscreen), 
       (display-mode: minimal-ui) {
}
```

**Best Practices:**
- Offer dark/light modes using `prefers-color-scheme`
- Honor `prefers-reduced-motion` to disable/reduce animations
- Users expect apps to integrate with the platform

---

## 7. The App Experience

### User Selection
- Disable user selection on navigation items, menus, buttons using `user-select: none`
- **Don't disable on all content** - only on UI elements where selection creates poor experience

```css
.unselectable {
  user-select: none;
  -webkit-user-select: none;
}
```

### Accent Color
- Use `accent-color` property for form controls to match brand

### System Fonts
- Use system font stack for dialogs/messages to match platform:

```css
font-family: -apple-system, BlinkMacSystemFont,
  "Segoe UI", system-ui, Roboto, Oxygen-Sans, Ubuntu, Cantarell,
  "Helvetica Neue", sans-serif;
```

### Pull to Refresh
- Modern mobile browsers have pull-to-refresh
- Chrome on Android also enables this on standalone PWAs
- Disable if you provide your own gesture management or refresh action
- Use `overscroll-behavior-y: contain`:

```css
body {
  overscroll-behavior-y: contain;
}
```

---

## 8. Safe Areas

Some devices have non-rectangular screens or notches (e.g., iPhone 13).

### Full Screen Access
- Include `viewport-fit=cover` in `<meta name="viewport">` tag
- Use `safe-area-inset-*` environment variables to extend content safely

**Caution:** When using `viewport-fit=cover`, you can render pixels behind rounded corners and notches. Always use safe margins/paddings for critical content and interactive elements.

---

## Key Takeaways

1. **Display Mode:** Choose appropriate mode (standalone is most common)
2. **Theme Color:** Use plain colors (no gradients/images) for status bar/title bar
3. **Safe Areas:** Use `viewport-fit=cover` and `safe-area-inset-*` for full-screen experience
4. **User Experience:** Disable selection on UI elements, use system fonts, handle pull-to-refresh
5. **Desktop:** Consider window sizing, update `<title>` dynamically
6. **Platform Integration:** Honor user preferences (dark mode, reduced motion)

---

## Resources

- CSS display-mode media query
- Take control of your scroll: customizing pull-to-refresh and overflow effects
- prefers-color-scheme: Hello darkness, my old friend
- prefers-reduced-motion: Sometimes less movement is more
- env() CSS function
- CSS Accent Color
- Window Controls Overlay

