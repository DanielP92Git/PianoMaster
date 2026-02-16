# Phase 05: Accessibility & Internationalization - Research

**Researched:** 2026-02-16
**Domain:** Web accessibility (WCAG 2.1 AA), i18n, RTL layout, ARIA live regions
**Confidence:** HIGH

## Summary

This phase integrates the rotate prompt overlay with the existing accessibility and internationalization systems. The app already has a robust `AccessibilityContext` with `reducedMotion` preference detection, a complete i18next setup with English and Hebrew locales, and RTL layout support via `dir` attribute on the `<html>` element. The rotate prompt component exists but is currently hardcoded in English with no accessibility integration.

The task is to connect three existing systems: (1) AccessibilityContext's `reducedMotion` state to control animation behavior, (2) i18next translation keys for English/Hebrew text, and (3) RTL layout mirroring for Hebrew mode. WCAG 1.3.4 already has an "escape hatch" via the "Play anyway" button—users can dismiss and play in portrait without restriction.

**Primary recommendation:** Use conditional rendering based on `reducedMotion` rather than animation duration manipulation. Add ARIA live region with `aria-live="polite"` and `role="status"` for screen reader announcements. Create translation keys in existing `common.json` structure. Use CSS logical properties and `dir` attribute for RTL mirroring.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-i18next | 14.x | i18n hooks and translation | Official React binding for i18next, already integrated |
| i18next | 23.x | Translation engine | Industry standard i18n library for JavaScript |
| i18next-browser-languagedetector | 7.x | Auto-detect user language | Detects from localStorage, navigator, htmlTag |
| framer-motion | 11.x | Animation library | Already used for animations, has `useReducedMotion()` hook |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| AccessibilityContext | (custom) | Centralized a11y state | Already manages reducedMotion, announcements flags |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| framer-motion animations | CSS animations with prefers-reduced-motion | Would require refactoring existing animation tokens |
| Custom AccessibilityContext | react-aria hooks | Over-engineering for this specific integration |
| i18next namespaces | Flat translation keys | Already using namespace pattern (common, trail) |

**Installation:**
```bash
# No new dependencies required - all libraries already installed
```

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/orientation/
│   └── RotatePromptOverlay.jsx    # Update with a11y + i18n
├── hooks/
│   └── useRotatePrompt.js         # No changes needed
├── contexts/
│   └── AccessibilityContext.jsx   # Already has reducedMotion
├── i18n/
│   └── index.js                   # Already configured
└── locales/
    ├── en/common.json             # Add rotatePrompt keys
    └── he/common.json             # Add Hebrew translations
```

### Pattern 1: Conditional Rendering for Reduced Motion
**What:** Instead of `duration: 0`, conditionally render static vs. animated elements
**When to use:** When animation is purely decorative (like rotate prompt icon)
**Example:**
```jsx
// Source: App best practices + framer-motion docs
import { useAccessibility } from "../../contexts/AccessibilityContext";

function RotatePromptOverlay({ onDismiss }) {
  const { reducedMotion } = useAccessibility();
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      {reducedMotion ? (
        <Smartphone size={120} className="text-blue-400" />
      ) : (
        <motion.div animate={{ rotate: [0, 0, -90, -90, 0] }}>
          <Smartphone size={120} className="text-blue-400" />
        </motion.div>
      )}
      <h2>{t("rotatePrompt.title")}</h2>
    </div>
  );
}
```

### Pattern 2: ARIA Live Region for Screen Reader Announcements
**What:** Polite live region that announces prompt when it appears
**When to use:** Dynamic content that users should be informed about non-disruptively
**Example:**
```jsx
// Source: Sara Soueidan ARIA live regions articles + WCAG 4.1.3
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {shouldShowPrompt && t("rotatePrompt.screenReaderAnnouncement")}
</div>

<div className="fixed inset-0 z-[9999] bg-gradient-to-br...">
  {/* Visual prompt */}
</div>
```

### Pattern 3: RTL Layout with CSS Logical Properties
**What:** Use `margin-inline-start` instead of `margin-left` for automatic mirroring
**When to use:** Spacing that should flip in RTL (most horizontal spacing)
**Example:**
```jsx
// Source: LeanCode RTL guide + i18next docs
const isRTL = i18n.dir() === "rtl";

<div
  dir={isRTL ? "rtl" : "ltr"}
  className="flex flex-col items-center gap-4"
>
  {/* Text content automatically aligns right in RTL */}
  <h2 className="text-3xl font-bold text-white text-center">
    {t("rotatePrompt.title")}
  </h2>
</div>

// CSS logical property (if needed for custom spacing)
// margin-inline-start: 1rem; /* becomes margin-right in RTL */
```

### Pattern 4: i18next Translation Keys in Namespace Structure
**What:** Organize keys by feature within common namespace
**When to use:** Small feature with 3-5 translation strings
**Example:**
```json
// en/common.json
{
  "rotatePrompt": {
    "title": "Turn Your Phone Sideways!",
    "description": "Games work best when your phone is sideways",
    "dismissButton": "Play anyway",
    "screenReaderAnnouncement": "Please rotate your device to landscape for the best experience. You can dismiss this prompt and play in portrait mode."
  }
}

// he/common.json
{
  "rotatePrompt": {
    "title": "סובבו את הטלפון לרוחב!",
    "description": "משחקים עובדים הכי טוב כשהטלפון ברוחב",
    "dismissButton": "שחק בכל מקרה",
    "screenReaderAnnouncement": "אנא סובבו את המכשיר למצב רוחב לחוויה הטובה ביותר. ניתן לסגור הודעה זו ולשחק במצב אנכי."
  }
}
```

### Anti-Patterns to Avoid
- **Using `animation-duration: 0`:** Framer Motion's `useReducedMotion()` already sets duration to 0, but better to conditionally render to avoid DOM recalculation
- **`aria-live="assertive"`:** Never use assertive for non-critical prompts—interrupts screen readers mid-sentence
- **Physical CSS properties in RTL:** Avoid `margin-left`, `padding-right` etc.—use logical properties or Tailwind classes
- **Hardcoded text in JSX:** All user-facing strings should use `t()` function
- **Inline `dir` on every element:** Set once on parent container, children inherit

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Language detection | Custom locale detection from browser | i18next-browser-languagedetector | Handles localStorage persistence, fallback chain, navigator language |
| RTL layout logic | Custom CSS direction switching | `i18n.dir()` + CSS logical properties | Browser handles mirroring automatically with `dir` attribute |
| Reduced motion detection | Custom media query listeners | AccessibilityContext (already exists) | Centralized, persisted to localStorage, hooks into system preferences |
| Screen reader announcements | Custom focus management | ARIA live regions | Standard, tested, works across all screen readers |

**Key insight:** The app already has all infrastructure needed—this phase is purely integration work. Don't create new systems, connect existing ones.

## Common Pitfalls

### Pitfall 1: Forgetting to Set `dir` on Modal Containers
**What goes wrong:** Modals/overlays render outside main app tree, inherit global `dir` but might not have explicit setting
**Why it happens:** Portals and fixed-position elements don't inherit parent `dir` in some browsers
**How to avoid:** Always set `dir={isRTL ? "rtl" : "ltr"}` on root element of modals
**Warning signs:** Hebrew text aligns left, buttons stay on wrong side in Hebrew mode

### Pitfall 2: ARIA Live Region Not Announcing
**What goes wrong:** Screen reader doesn't announce prompt appearance
**Why it happens:** Live region added to DOM at same time as content—screen reader wasn't "monitoring" it yet
**How to avoid:** Render live region container on component mount, populate with text only when needed
**Warning signs:** VoiceOver/NVDA/JAWS silent when prompt appears

### Pitfall 3: Translation Keys Not Found
**What goes wrong:** `t("rotatePrompt.title")` returns "rotatePrompt.title" instead of translated text
**Why it happens:** Key doesn't exist in locale JSON, or wrong namespace loaded
**How to avoid:** Test with both languages, check browser console for i18next warnings
**Warning signs:** English keys appearing in Hebrew mode, or raw key strings visible

### Pitfall 4: Animation Still Plays in Reduced Motion
**What goes wrong:** Phone icon still rotates even with `reducedMotion: true`
**Why it happens:** Component doesn't consume AccessibilityContext, or conditional logic wrong
**How to avoid:** Test with System Settings > Accessibility > Reduce Motion enabled (macOS/iOS)
**Warning signs:** Animation visible when system preference set to reduce motion

### Pitfall 5: CSS Logical Properties Not Working
**What goes wrong:** `margin-inline-start` has no effect in RTL
**Why it happens:** Missing PostCSS plugin or browser doesn't support logical properties
**How to avoid:** Modern browsers support CSS logical properties natively (2020+), no plugin needed
**Warning signs:** Spacing identical in LTR and RTL despite using logical properties

### Pitfall 6: Dismiss Button Not Accessible via Keyboard
**What goes wrong:** Can't press "Play anyway" button with Enter/Space
**Why it happens:** Using `<div onClick>` instead of `<button>`
**How to avoid:** Always use semantic `<button>` element for interactive elements
**Warning signs:** Tab key skips over button, screen reader says "clickable" not "button"

## Code Examples

Verified patterns from official sources:

### Integrating AccessibilityContext with Rotate Prompt
```jsx
// Source: App's AccessibilityContext.jsx + framer-motion docs
import { useAccessibility } from "../../contexts/AccessibilityContext";
import { useTranslation } from "react-i18next";

export function RotatePromptOverlay({ onDismiss }) {
  const { reducedMotion } = useAccessibility();
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      {/* ARIA live region for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {t("rotatePrompt.screenReaderAnnouncement")}
      </div>

      {/* Visual overlay */}
      <motion.div className="fixed inset-0 z-[9999]...">
        {/* Conditionally render animated vs static icon */}
        {reducedMotion ? (
          <Smartphone size={120} className="text-blue-400" />
        ) : (
          <motion.div
            animate={{ rotate: [0, 0, -90, -90, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              times: [0, 0.1, 0.4, 0.75, 0.75],
              ease: "easeInOut"
            }}
          >
            <Smartphone size={120} className="text-blue-400" />
          </motion.div>
        )}

        <h2>{t("rotatePrompt.title")}</h2>
        <p>{t("rotatePrompt.description")}</p>

        <button onClick={onDismiss}>
          {t("rotatePrompt.dismissButton")}
        </button>
      </motion.div>
    </div>
  );
}
```

### Translation Files Setup
```json
// locales/en/common.json
{
  "rotatePrompt": {
    "title": "Turn Your Phone Sideways!",
    "description": "Games work best when your phone is sideways",
    "dismissButton": "Play anyway",
    "screenReaderAnnouncement": "Please rotate your device to landscape for the best experience. You can dismiss this prompt and play in portrait mode."
  }
}

// locales/he/common.json
{
  "rotatePrompt": {
    "title": "סובבו את הטלפון לרוחב!",
    "description": "משחקים עובדים הכי טוב כשהטלפון ברוחב",
    "dismissButton": "שחק בכל מקרה",
    "screenReaderAnnouncement": "אנא סובבו את המכשיר למצב רוחב לחוויה הטובה ביותר. ניתן לסגור הודעה זו ולשחק במצב אנכי."
  }
}
```

### Testing Reduced Motion
```javascript
// Test in browser DevTools Console
// Simulate reduced motion preference
window.matchMedia('(prefers-reduced-motion: reduce)').matches = true;

// Trigger AccessibilityContext to detect change
// (In real usage, change System Settings > Accessibility > Reduce Motion)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded strings in JSX | i18next translation keys | 2023-2024 | Multi-language support standard in modern apps |
| `margin-left`, `padding-right` | CSS logical properties (`margin-inline-start`) | 2020+ | Auto RTL support without duplicating CSS |
| `aria-live="assertive"` for all alerts | `aria-live="polite"` for non-critical | WCAG 2.1 (2018) | Reduces screen reader interruptions |
| `animation-duration: 0` for reduced motion | Conditional rendering or `useReducedMotion()` | 2021+ (framer-motion v4) | Cleaner code, better performance |

**Deprecated/outdated:**
- **`animation-duration: 0.01ms`:** Old workaround for browsers treating `0ms` as falsy—modern browsers handle `0ms` correctly
- **Separate RTL CSS files:** CSS logical properties eliminate need for duplicate stylesheets
- **Inline `translate="no"` attribute:** i18next handles this via `<Trans>` component for mixed content

## Open Questions

1. **Should the phone icon mini-piano-keys also be removed in reduced motion?**
   - What we know: Icon rotates, keys are static decorative elements
   - What's unclear: Do static decorative elements inside animated container need removal?
   - Recommendation: Keep piano keys visible even in reduced motion—they're not animated, just visual context

2. **Does ARIA live region need to persist for re-show behavior?**
   - What we know: Prompt can re-show once after auto-dismiss if user rotates back to portrait
   - What's unclear: Should live region announce again, or only first time?
   - Recommendation: Announce every time prompt appears—user might not have heard first announcement

3. **Should RTL flip the phone rotation animation direction?**
   - What we know: In Hebrew mode, UI mirrors left-to-right
   - What's unclear: Should phone icon rotate clockwise instead of counterclockwise in RTL?
   - Recommendation: No—phone rotation is physical action (rotate device), not UI direction. Keep same animation.

## Sources

### Primary (HIGH confidence)
- [WCAG 1.3.4 Orientation Success Criterion](https://www.w3.org/WAI/WCAG21/Understanding/orientation.html) - Official W3C guidance on orientation restrictions
- [Sara Soueidan: Accessible Notifications with ARIA Live Regions Part 1](https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-1/) - ARIA live region implementation patterns
- [Sara Soueidan: Accessible Notifications with ARIA Live Regions Part 2](https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-2/) - Advanced ARIA live region patterns
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) - CSS media query for motion preferences
- [Josh W. Comeau: Accessible Animations in React](https://www.joshwcomeau.com/react/prefers-reduced-motion/) - React-specific reduced motion patterns
- [i18next: Namespaces](https://www.i18next.com/principles/namespaces) - Official namespace organization guidance
- [react-i18next: useTranslation hook](https://react.i18next.com/latest/usetranslation-hook) - Hook API documentation

### Secondary (MEDIUM confidence)
- [LeanCode: Right to Left in React](https://leancode.co/blog/right-to-left-in-react) - RTL implementation guide
- [Lingo.dev: RTL in React Router v7](https://lingo.dev/en/react-router-i18n/right-to-left-languages) - Modern RTL patterns
- [ARIA Live Regions Cheatsheet](https://rightsaidjames.com/2025/08/aria-live-regions-when-to-use-polite-assertive/) - When to use polite vs assertive
- [Pope Tech: Accessible Animation Design](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) - 2025/2026 animation accessibility trends
- [Accesify: ARIA Live Regions](https://www.accesify.io/blog/accessible-notifications-alerts-aria-live-regions/) - Implementation best practices

### Tertiary (App-specific, HIGH confidence)
- `src/contexts/AccessibilityContext.jsx` - Existing implementation with reducedMotion state
- `src/i18n/index.js` - App's i18next configuration with namespace setup
- `src/locales/en/common.json` - Current translation structure
- `src/App.jsx` (lines 336-340) - Existing `dir` attribute implementation
- `src/utils/useMotionTokens.js` - Existing reduced motion integration with framer-motion

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use
- Architecture: HIGH - Patterns verified in existing app components (Sidebar, Dashboard, LanguageSelector)
- Pitfalls: MEDIUM - Based on WCAG docs + common i18n/RTL issues, not app-specific testing
- WCAG 1.3.4: HIGH - Official W3C documentation reviewed
- ARIA live regions: HIGH - Multiple authoritative sources cross-referenced
- RTL support: HIGH - i18next documentation + CSS logical properties standard

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days - stable domain, established standards)

**Key verification notes:**
- WCAG 1.3.4 does NOT prohibit prompts or suggestions—only restricts *forcing* single orientation
- "Play anyway" button already satisfies escape hatch requirement
- App's existing AccessibilityContext already detects system `prefers-reduced-motion` preference
- Hebrew font family already configured in `index.css` with `html[dir="rtl"]` selector
