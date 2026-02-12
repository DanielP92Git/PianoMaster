# Phase 4: Self-Host Google Fonts - Research

**Researched:** 2026-02-01
**Domain:** Font optimization, COPPA compliance, PWA performance
**Confidence:** HIGH

## Summary

Self-hosting Google Fonts eliminates third-party data collection from under-13 users, completing COPPA-06 compliance. The standard approach is using **Fontsource** npm packages, which provide pre-packaged, self-hostable font files with automatic `@font-face` generation.

This app currently loads 8 font families from Google Fonts CDN (fonts.googleapis.com and fonts.gstatic.com):
- **Text fonts:** Outfit, Comic Neue, Nunito, Fredoka One, Dancing Script, Heebo, Assistant (7 families)
- **Icon font:** Material Icons Round (1 family)

The migration is straightforward: install individual `@fontsource/*` packages, import them in `src/main.jsx`, remove CDN links from `index.html`, and update service worker cache patterns. Fonts already configured in `tailwind.config.js` require no changes.

**Primary recommendation:** Use static font packages (not variable fonts) for this app, importing only the specific weights needed (400, 500, 600, 700, 800 based on Tailwind config). This minimizes bundle size since each font family uses 2-5 weights, where static fonts outperform variable fonts for limited weight ranges.

## Standard Stack

The established libraries/tools for self-hosting Google Fonts in React/Vite projects:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@fontsource/*` | Latest (v5.x) | Self-hosted font packages | Industry standard for self-hosting Google Fonts, 1500+ fonts, automatic `@font-face` generation, version-lockable |
| Vite | 6.x | Build tool | Native font file handling, automatic bundling of imported CSS/font assets |

### Font Packages Required
| Package | Weights Needed | Purpose | Notes |
|---------|---------------|---------|-------|
| `@fontsource/outfit` | 400, 500, 600, 700 | Primary sans-serif | Default font via Tailwind `font-outfit` |
| `@fontsource/comic-neue` | 300, 400, 700 | Comic/playful font | Tailwind `font-comic` |
| `@fontsource/nunito` | 300, 400, 600, 700, 800 | Rounded sans-serif | Tailwind `font-rounded`, heavily used in UI components |
| `@fontsource/fredoka-one` | 400 | Display/playful | Tailwind `font-playful`, single weight only |
| `@fontsource/dancing-script` | 400, 500, 600, 700 | Signature/cursive | Tailwind `font-signature` |
| `@fontsource/heebo` | 400, 500, 600, 700, 800 | Hebrew/RTL font | Tailwind `font-hebrew`, RTL support |
| `@fontsource/assistant` | 400, 500, 600, 700, 800 | Hebrew/RTL font | Tailwind `font-hebrew`, RTL support |
| `@fontsource/material-icons-round` | 400 | Icon font | Replaces Google Fonts Material Icons Round CDN |

**Note:** Current `index.html` line 53 uses `family=Material+Icons+Round` which maps to package `@fontsource/material-icons-round` (not `@fontsource/material-icons-rounded`).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static fonts | Variable fonts | Variable fonts are larger (200KB) vs 2-5 static weights (150KB total). Only beneficial when using 3+ weights; this app uses specific weights per font. |
| Fontsource | Manual `@font-face` | Manual approach requires downloading font files, managing file structure, writing `@font-face` rules, and tracking updates. Fontsource automates this. |
| Self-hosting | CDN fonts | CDN fonts violate COPPA-06 by sharing user IP addresses with Google. Self-hosting is non-negotiable for compliance. |

**Installation:**
```bash
npm install --save-dev \
  @fontsource/outfit \
  @fontsource/comic-neue \
  @fontsource/nunito \
  @fontsource/fredoka-one \
  @fontsource/dancing-script \
  @fontsource/heebo \
  @fontsource/assistant \
  @fontsource/material-icons-round
```

## Architecture Patterns

### Recommended Import Structure

Fontsource fonts should be imported **early in the application lifecycle** to ensure fonts are available before first render. For Vite + React projects, the entry point is `src/main.jsx`.

```
src/
├── main.jsx              # Import all @fontsource packages HERE
├── index.css             # Already has Tailwind directives
└── ...
```

### Pattern 1: Import Specific Weights in main.jsx

**What:** Import only the font weights your app actually uses to minimize bundle size.

**When to use:** Always, unless using variable fonts (not recommended for this app).

**Example:**
```javascript
// src/main.jsx
// Import fonts BEFORE React and other imports

// Outfit: weights 400, 500, 600, 700
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';

// Comic Neue: weights 300, 400, 700
import '@fontsource/comic-neue/300.css';
import '@fontsource/comic-neue/400.css';
import '@fontsource/comic-neue/700.css';

// Nunito: weights 300, 400, 600, 700, 800
import '@fontsource/nunito/300.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';

// Fredoka One: weight 400 only
import '@fontsource/fredoka-one/400.css';

// Dancing Script: weights 400, 500, 600, 700
import '@fontsource/dancing-script/400.css';
import '@fontsource/dancing-script/500.css';
import '@fontsource/dancing-script/600.css';
import '@fontsource/dancing-script/700.css';

// Heebo: weights 400, 500, 600, 700, 800
import '@fontsource/heebo/400.css';
import '@fontsource/heebo/500.css';
import '@fontsource/heebo/600.css';
import '@fontsource/heebo/700.css';
import '@fontsource/heebo/800.css';

// Assistant: weights 400, 500, 600, 700, 800
import '@fontsource/assistant/400.css';
import '@fontsource/assistant/500.css';
import '@fontsource/assistant/600.css';
import '@fontsource/assistant/700.css';
import '@fontsource/assistant/800.css';

// Material Icons Round: weight 400 (icon fonts typically have single weight)
import '@fontsource/material-icons-round/400.css';

// ... rest of main.jsx imports (React, App, etc.)
```

**Source:** [Fontsource Install Documentation](https://fontsource.org/docs/getting-started/install)

### Pattern 2: Remove External Font Links from index.html

**What:** Delete all `<link>` tags pointing to fonts.googleapis.com and fonts.gstatic.com.

**When to use:** Immediately after confirming fonts load via Fontsource.

**Example:**
```html
<!-- DELETE THESE LINES from index.html -->
<!-- Lines 12-13: Preconnect hints -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />

<!-- Lines 53, 55: Font stylesheets -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=..." />
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
```

**Result:** Zero external font requests in Network tab.

### Pattern 3: Update Service Worker Cache Patterns

**What:** Remove Google Fonts cache patterns from `public/sw.js` since fonts are now bundled locally.

**When to use:** After migrating to Fontsource.

**Example:**
```javascript
// public/sw.js
// BEFORE (lines 22-24)
const RUNTIME_CACHE_PATTERNS = [
  // Cache Google Fonts
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  // Cache Supabase API endpoints...
  /^https:\/\/.*\.supabase\.co/,
];

// AFTER
const RUNTIME_CACHE_PATTERNS = [
  // Cache Supabase API endpoints (excluding auth - see AUTH_EXCLUDED_PATTERNS)
  /^https:\/\/.*\.supabase\.co/,
];
```

**Why:** Self-hosted fonts are bundled by Vite into `/assets/*.woff2` and cached by the service worker's static asset cache patterns. No runtime caching of external font CDNs is needed.

### Pattern 4: Material Icons Round Special Handling

**What:** Material Icons Round is an **icon font** (ligatures-based), not a text font. Usage differs from standard fonts.

**When to use:** When migrating `<span className="material-icons-round">icon_name</span>` components.

**Current usage:** Based on `index.html` line 55, the app loads Material Icons Round from CDN. However, Grep search found **zero instances** of `className="material-icons"` in `src/`, suggesting icons may be using SVG or other methods instead of ligature-based icon fonts.

**Action required:** Verify if Material Icons Round is actually used before installing the package. If not used, skip the installation.

**If used (icon font pattern):**
```html
<!-- Requires font-family: 'Material Icons Round' in CSS -->
<span className="material-icons-round">home</span>
```

The `@fontsource/material-icons-round` package provides the font file. Ensure CSS includes:
```css
.material-icons-round {
  font-family: 'Material Icons Round';
  font-weight: 400;
  font-style: normal;
  /* Additional Material Icons properties */
}
```

**Source:** [Fontsource Material Icons Round](https://fontsource.org/fonts/material-icons-round)

### Anti-Patterns to Avoid

- **Importing default package without specifying weights:** `import '@fontsource/outfit'` loads only weight 400, causing bold text to use faux-bold rendering. Always import explicit weights.

- **Importing fonts in `index.css`:** While functional, this adds an extra HTTP request before the browser can parse CSS and request fonts. Importing in `main.jsx` allows Vite to bundle fonts inline, eliminating the round-trip. **Exception:** This is a minor optimization; importing in `index.css` is acceptable if preferred.

- **Using variable fonts for limited weight ranges:** A variable font (200KB) is larger than 3-5 static weights (30-50KB each, ~150KB total). Only use variable fonts when needing 6+ weights or continuous weight axis animation.

- **Not updating service worker:** Leaving Google Fonts cache patterns causes unnecessary cache pollution and failed fetch attempts, logged as errors in console.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font file hosting | Manually download WOFF2 files from Google Fonts, create `public/fonts/` directory, write `@font-face` rules | `@fontsource/*` packages | Fontsource handles font file optimization (subsetting, WOFF2 compression), `@font-face` generation (including `unicode-range` for subsetting), and versioning. Manual approach requires tracking font updates. |
| Font loading optimization | Custom font preload logic, FOUT/FOIT handling, fallback font metrics | Fontsource + `font-display: swap` | Fontsource packages include `font-display: swap` by default (since v5.x), preventing invisible text. Manual preload can cause over-preloading, delaying page load. |
| Icon font conversion | Download Material Icons SVG set, create sprite sheet, write React components | `@fontsource/material-icons-round` | Icon fonts are optimized for ligature-based rendering. Manual SVG conversion requires build-time processing and increases bundle size. |

**Key insight:** Font optimization has numerous edge cases (unicode subsetting, format detection, CORS headers, preload priorities, font-display timing). Fontsource packages are maintained by the community with these optimizations baked in. Custom solutions risk performance regressions and maintenance burden.

## Common Pitfalls

### Pitfall 1: Over-Preloading Fonts

**What goes wrong:** Adding `<link rel="preload" as="font" ... >` for every font causes network congestion, delaying LCP and blocking critical resources.

**Why it happens:** Developers assume preload = faster. In reality, preload forces the browser to fetch resources immediately, even if not needed for first paint.

**How to avoid:**
- **Do not** add font preload links to `index.html`. Let the browser discover fonts naturally via CSS.
- Fontsource packages use `font-display: swap`, which shows fallback text immediately and swaps in the custom font when loaded. This prevents FOIT (flash of invisible text).
- Only preload if your primary font is critical for LCP **and** you've measured improved performance. For this app, hero images and text likely use different fonts, making preload unnecessary.

**Warning signs:**
- Lighthouse audit shows "Eliminate render-blocking resources" with font files
- LCP regresses after adding preload links
- Network waterfall shows fonts loading before critical CSS/JS

**Source:** [Preload with font-display: optional is an Anti-pattern](https://www.zachleat.com/web/preload-font-display-optional/)

### Pitfall 2: Bundling Fonts into CSS Instead of Separate Imports

**What goes wrong:** Importing Fontsource in `index.css` instead of `main.jsx` adds an extra network round-trip: browser fetches HTML → parses CSS → fetches fonts.

**Why it happens:** CSS imports feel "natural" for styles. However, Vite bundles JS imports more efficiently.

**How to avoid:**
- Import Fontsource packages in `main.jsx` (before React imports)
- Vite will inline font `@font-face` rules into the bundled CSS, and fonts into `/assets/*.woff2`
- Browser can discover and fetch fonts in parallel with JS bundle

**Warning signs:**
- Network tab shows CSS file load → font file load (sequential, not parallel)
- Fonts appear later than expected on first page load

**Source:** [Fontsource, Fontaine, Tailwind and Vite](https://aaronjbecker.com/posts/fontsource-fontaine-tailwind-vite/)

### Pitfall 3: Forgetting to Update Service Worker Cache Version

**What goes wrong:** After migrating to self-hosted fonts, the old service worker still caches Google Fonts CDN requests. This causes:
- Failed network requests to googleapis.com/gstatic.com (404s in console)
- Cache bloat with unused font data
- Confusion when debugging offline behavior

**Why it happens:** Service worker cache is persistent and survives code changes. Updating font imports doesn't invalidate the cache.

**How to avoid:**
- Update `CACHE_NAME` in `public/sw.js` (e.g., `pianomaster-v2` → `pianomaster-v3`)
- Remove Google Fonts patterns from `RUNTIME_CACHE_PATTERNS`
- Deploy and verify in DevTools → Application → Cache Storage (old cache should be deleted)

**Warning signs:**
- Console errors: `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT` for googleapis.com
- Cache Storage shows multiple versions with Google Fonts entries
- Fonts fail to load in offline mode

**Source:** Service worker implementation from `public/sw.js` (lines 4-27)

### Pitfall 4: Not Verifying Material Icons Round Usage

**What goes wrong:** Installing `@fontsource/material-icons-round` when the app doesn't use icon fonts wastes ~50KB bundle size.

**Why it happens:** `index.html` includes the CDN link, so developers assume it's used. However, the app may use SVG icons or removed icon font usage.

**How to avoid:**
- Search codebase for `className="material-icons"` or similar patterns
- If no matches found (as in this app), **do not install** `@fontsource/material-icons-round`
- Remove the CDN link from `index.html` line 55
- Verify no visual regressions after deployment

**Warning signs:**
- Grep search returns zero results for icon font usage
- No visual icons break after removing CDN link
- Bundle size increases unnecessarily

**Source:** Grep search results showing 0 matches for Material Icons usage in `src/`

### Pitfall 5: Layout Shift from font-display: swap

**What goes wrong:** Text renders in fallback font (system sans-serif) then "jumps" when custom font loads, causing CLS (Cumulative Layout Shift).

**Why it happens:** `font-display: swap` prioritizes showing text over preserving layout. Fallback fonts have different metrics (x-height, spacing) than custom fonts.

**How to avoid:**
- **Accept minor CLS:** For most apps, CLS from font swap is negligible (<0.1) and preferable to invisible text (FOIT).
- **Measure CLS:** Use Lighthouse or WebPageTest to measure actual layout shift. Only optimize if CLS > 0.1.
- **Advanced mitigation (optional):** Use `@font-face` `size-adjust`, `ascent-override`, `descent-override` to match fallback font metrics to custom font. Requires manual measurement per font. **Not recommended** for this phase unless CLS is severe.

**Warning signs:**
- Lighthouse CLS > 0.1
- Visible text "jump" on page load
- User complaints about flickering text

**Source:** [How to avoid layout shifts caused by web fonts](https://simonhearne.com/2021/layout-shifts-webfonts/)

## Code Examples

Verified patterns from official sources:

### Complete main.jsx Font Import Pattern

```javascript
// src/main.jsx
// Import fonts FIRST, before any other imports
// This ensures fonts are available when React renders

// === TEXT FONTS ===

// Outfit: Primary sans-serif (font-outfit)
// Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';

// Comic Neue: Playful/comic font (font-comic)
// Weights: 300 (light), 400 (regular), 700 (bold)
import '@fontsource/comic-neue/300.css';
import '@fontsource/comic-neue/400.css';
import '@fontsource/comic-neue/700.css';

// Nunito: Rounded sans-serif (font-rounded) - HEAVILY USED IN UI
// Weights: 300 (light), 400 (regular), 600 (semibold), 700 (bold), 800 (extrabold)
import '@fontsource/nunito/300.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';

// Fredoka One: Display/playful font (font-playful)
// Weights: 400 only (single-weight font)
import '@fontsource/fredoka-one/400.css';

// Dancing Script: Signature/cursive font (font-signature)
// Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
import '@fontsource/dancing-script/400.css';
import '@fontsource/dancing-script/500.css';
import '@fontsource/dancing-script/600.css';
import '@fontsource/dancing-script/700.css';

// Heebo: Hebrew/RTL font (font-hebrew)
// Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
import '@fontsource/heebo/400.css';
import '@fontsource/heebo/500.css';
import '@fontsource/heebo/600.css';
import '@fontsource/heebo/700.css';
import '@fontsource/heebo/800.css';

// Assistant: Hebrew/RTL font (font-hebrew)
// Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
import '@fontsource/assistant/400.css';
import '@fontsource/assistant/500.css';
import '@fontsource/assistant/600.css';
import '@fontsource/assistant/700.css';
import '@fontsource/assistant/800.css';

// === ICON FONTS ===

// Material Icons Round: Icon font (if used - VERIFY FIRST)
// NOTE: Grep search found ZERO usage of className="material-icons"
// RECOMMENDATION: Skip this import unless usage is confirmed
// import '@fontsource/material-icons-round/400.css';

// === REACT APP IMPORTS ===
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Tailwind + global styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Source:** [Fontsource Documentation - Install](https://fontsource.org/docs/getting-started/install)

### Service Worker Update Pattern

```javascript
// public/sw.js

// BEFORE
const CACHE_NAME = "pianomaster-v2";
const RUNTIME_CACHE_PATTERNS = [
  // Cache Google Fonts
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  // Cache Supabase API endpoints
  /^https:\/\/.*\.supabase\.co/,
];

// AFTER
const CACHE_NAME = "pianomaster-v3"; // Bump version to invalidate old cache
const RUNTIME_CACHE_PATTERNS = [
  // Cache Supabase API endpoints (excluding auth - see AUTH_EXCLUDED_PATTERNS)
  /^https:\/\/.*\.supabase\.co/,
];

// Google Fonts patterns REMOVED - fonts now self-hosted and bundled by Vite
```

**Why bump cache version:** Forces service worker to install new version, delete old cache (including Google Fonts), and recache assets with self-hosted fonts.

**Source:** Current `public/sw.js` lines 4, 21-27

### Verification Steps After Migration

```bash
# 1. Install packages
npm install --save-dev \
  @fontsource/outfit \
  @fontsource/comic-neue \
  @fontsource/nunito \
  @fontsource/fredoka-one \
  @fontsource/dancing-script \
  @fontsource/heebo \
  @fontsource/assistant

# 2. Run dev server
npm run dev

# 3. Open browser DevTools → Network tab → Filter: Font
# Expected: ZERO requests to googleapis.com or gstatic.com
# Expected: Multiple requests to localhost:5174/assets/*.woff2

# 4. Check for font rendering issues
# - Verify all text renders correctly
# - Check bold/semibold weights display properly
# - Test Hebrew/RTL fonts if app has language switching

# 5. Test offline mode (PWA)
# - Open DevTools → Application → Service Workers
# - Check "Update on reload"
# - Reload page
# - Verify cache version updated (pianomaster-v3)
# - Go offline (DevTools → Network → Offline)
# - Reload page → fonts should still load

# 6. Build and measure bundle size
npm run build
# Check dist/assets/*.css and *.woff2 files
# Typical font bundle: 300-500KB total for all weights
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Google Fonts CDN links in HTML | Self-hosted via Fontsource npm packages | 2020-2021 (Fontsource v4) | Eliminates third-party requests, improves privacy/COPPA compliance, version-locks fonts |
| Manual `@font-face` with downloaded files | Fontsource auto-generated `@font-face` | 2019 (Fontsource v1) | Reduces maintenance, handles subsetting/optimization automatically |
| `font-display: auto` (default) | `font-display: swap` (Fontsource default) | 2018 (Chrome 60) | Prevents FOIT, improves perceived performance |
| Loading all font weights (100-900) | Import only needed weights | 2020+ (bundle size optimization trend) | Reduces bundle size by 60-80% for typical apps |
| Variable fonts for all use cases | Static fonts for ≤5 weights, variable for 6+ weights | 2022-2023 (performance analysis) | Optimizes bundle size: static fonts win for limited weight ranges |

**Deprecated/outdated:**
- **Google Fonts CDN for privacy-sensitive apps:** GDPR (2018) and COPPA compliance require avoiding third-party font CDNs that collect IP addresses. Self-hosting is now standard for educational/child-focused apps.
- **`font-display: auto`:** Modern browsers and Lighthouse audits recommend `font-display: swap` or `optional`. Fontsource defaults to `swap` since v5.0 (2021).
- **Preloading all fonts:** 2023+ best practices advise against preloading non-critical fonts due to network congestion. Let browser prioritize font loading based on CSS usage.

## Open Questions

Things that couldn't be fully resolved:

1. **Material Icons Round Usage**
   - What we know: `index.html` line 55 includes CDN link, but Grep search found zero `className="material-icons"` usage in `src/`.
   - What's unclear: Is the font actually used? Could be legacy code from earlier development.
   - Recommendation: **Skip installing** `@fontsource/material-icons-round` initially. Remove CDN link, deploy, test. If no visual regressions, icons aren't used. If icons break, install the package.

2. **Italic Font Styles**
   - What we know: Current CDN link doesn't specify italic variants. Tailwind config doesn't mention italic styles.
   - What's unclear: Does the app use italic text anywhere (e.g., `<em>`, `font-italic` class)?
   - Recommendation: Assume no italic usage. If italic text is needed later, import italic variants: `import '@fontsource/outfit/400-italic.css'`.

3. **Font Subsetting for Performance**
   - What we know: Fontsource packages include full character sets. Some packages offer subset imports (e.g., `@fontsource/outfit/latin.css`).
   - What's unclear: Would subsetting provide meaningful bundle size reduction for this app?
   - Recommendation: Start with full character sets (default). If bundle size is an issue (>500KB for fonts), explore latin-only subsets. Hebrew fonts (Heebo, Assistant) need full character sets for RTL support.

4. **Service Worker Precaching of Font Files**
   - What we know: Vite bundles fonts into `/assets/*.woff2`. Current service worker doesn't explicitly precache font files (only icons, manifest, offline page).
   - What's unclear: Should font files be precached on service worker install for faster offline-first load?
   - Recommendation: No changes needed. Vite-bundled fonts are automatically cached by the browser's HTTP cache. Service worker caches them on first network request (runtime caching). Precaching would add 300-500KB to install event, slowing initial PWA installation.

## Sources

### Primary (HIGH confidence)
- [Fontsource GitHub Repository](https://github.com/fontsource/fontsource) - Official repository
- [Fontsource Documentation - Introduction](https://fontsource.org/docs/getting-started/introduction) - Core concepts, installation
- [Fontsource Documentation - Install](https://fontsource.org/docs/getting-started/install) - Import patterns, weight-specific loading
- [Fontsource Documentation - Font Display](https://fontsource.org/docs/getting-started/display) - `font-display` configuration
- [@fontsource/material-icons-round npm](https://www.npmjs.com/package/@fontsource/material-icons-round) - Icon font package details

### Secondary (MEDIUM confidence)
- [Self-host Google Fonts in React with Fontsource - DEV Community](https://dev.to/danwalsh/self-host-google-fonts-in-your-next-react-project-with-fontsource-1n07) - React-specific patterns
- [Variable fonts vs static fonts performance analysis - LogRocket](https://blog.logrocket.com/variable-fonts-is-the-performance-trade-off-worth-it/) - Bundle size comparison
- [Tailwind CSS Font Family Documentation](https://tailwindcss.com/docs/font-family) - Tailwind v4 font configuration
- [Fontsource, Fontaine, Tailwind and Vite - AaronJBecker.com](https://aaronjbecker.com/posts/fontsource-fontaine-tailwind-vite/) - Import location optimization
- [How to avoid layout shifts caused by web fonts - Simon Hearne](https://simonhearne.com/2021/layout-shifts-webfonts/) - CLS mitigation strategies

### Tertiary (LOW confidence - general PWA/Vite guidance)
- [Vite PWA Plugin Documentation](https://vite-pwa-org.netlify.app/guide/) - Service worker patterns for Vite
- [Web font best practices - web.dev](https://web.dev/articles/font-best-practices) - General font optimization

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - Fontsource is industry standard, verified via official docs and npm registry
- Architecture: **HIGH** - Import patterns verified via Fontsource docs and Vite/React best practices
- Pitfalls: **MEDIUM** - Based on community experiences (GitHub issues, blog posts), not official docs
- Performance data: **MEDIUM** - Variable vs static font comparisons from 2023-2024 sources, not 2026-specific measurements

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - font tooling is stable, Fontsource v5.x hasn't had breaking changes since 2021)

**Notes for planner:**
- All font packages are installed as `--save-dev` since they're build-time dependencies (bundled by Vite)
- Tailwind config already defines font families; no changes needed there
- Service worker cache version bump is critical to prevent stale cache issues
- Material Icons Round package is optional pending usage verification
- No italic variants needed based on current codebase analysis
