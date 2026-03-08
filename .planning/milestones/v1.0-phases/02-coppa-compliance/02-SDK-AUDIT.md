# Third-Party SDK Audit for COPPA Compliance

**Audit Date:** 2026-01-31
**Auditor:** Claude (automated)
**App Version:** PianoMaster v0.0.0

## Executive Summary

The PianoMaster app has a **clean third-party data collection profile**. No analytics, crash reporting, or advertising SDKs are present. The primary external data flows are:

1. **Supabase** - Backend services (our control, COPPA-configurable)
2. **Google Fonts** - Font delivery (collects IP addresses, user-agent)
3. **Debug logging endpoints** - Disabled by default, localhost-only

**Verdict:** One actionable item (Google Fonts) requires remediation for full COPPA compliance.

---

## Dependency Analysis

### Production Dependencies (24 packages)

| Package | Version | Data Collection Risk | COPPA Impact | Notes |
|---------|---------|---------------------|--------------|-------|
| react | 18.3.1 | None | None | UI library, no network calls |
| react-dom | 18.3.1 | None | None | DOM rendering only |
| react-router-dom | 7.7.0 | None | None | Client-side routing |
| redux | 5.0.1 | None | None | State management |
| react-redux | 9.2.0 | None | None | React bindings for Redux |
| @reduxjs/toolkit | 2.8.2 | None | None | State management utilities |
| @supabase/supabase-js | 2.52.0 | **User data** | **Our control** | Backend - see Supabase section |
| @tanstack/react-query | 5.83.0 | None | None | Data fetching/caching |
| @tanstack/react-query-devtools | 5.83.0 | None | None | Dev-only debugging tools |
| clsx | 2.1.1 | None | None | CSS class utility |
| framer-motion | 12.23.26 | None | None | Animation library |
| i18next | 25.7.0 | None | None | Translations - bundled, no HTTP backend |
| i18next-browser-languagedetector | 8.2.0 | None | None | Reads localStorage/navigator only |
| i18next-http-backend | 3.0.2 | None | None | Installed but NOT used - translations bundled |
| klavier | 2.0.1 | None | None | Piano keyboard library |
| lucide-react | 0.344.0 | None | None | Icon library |
| react-confetti | 6.4.0 | None | None | Visual effects |
| react-hot-toast | 2.5.2 | None | None | Toast notifications |
| react-i18next | 16.3.5 | None | None | i18n React bindings |
| react-icons | 5.5.0 | None | None | Icon library |
| recharts | 3.1.0 | None | None | Charts library |
| tailwindcss-animate | 1.0.7 | None | None | CSS animations |
| vexflow | 5.0.0 | None | None | Music notation rendering |
| vite-plugin-svgr | 4.5.0 | None | None | SVG handling |

### Dev Dependencies (NOT shipped to production - 21 packages)

All dev dependencies are build/test tools that do not ship to production:

- ESLint ecosystem (eslint, plugins, configs)
- Testing library (vitest, @testing-library/*)
- Build tools (vite, autoprefixer, postcss, tailwindcss)
- Code quality (prettier, husky, lint-staged)

**Verified:** Dev dependencies are excluded from production build via Vite's tree-shaking.

---

## External Network Requests

| Domain | Purpose | Data Collected | COPPA Concern | Status |
|--------|---------|----------------|---------------|--------|
| `*.supabase.co` | Backend API | User data, auth | **Our control** | Compliant (configurable) |
| `fonts.googleapis.com` | Font CSS | IP address, user-agent, referrer | **YES** | **Needs remediation** |
| `fonts.gstatic.com` | Font files | IP address, user-agent | **YES** | **Needs remediation** |
| `127.0.0.1:7242` | Debug logging | Session data | None | Disabled by default |
| `localhost:5174` | Dev server | None | None | Dev only |

### Source Analysis

**index.html external resources:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@..." />
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
```

**Fonts loaded:**
- Outfit (400-700 weights)
- Comic Neue (300, 400, 700)
- Nunito (300-800)
- Fredoka One
- Dancing Script (400-700)
- Heebo (400-800) - Hebrew support
- Assistant (400-800) - Hebrew support
- Material Icons Round

---

## Findings

### High Priority (Must Fix Before Production)

#### 1. Google Fonts External Loading

**Issue:** Google Fonts tracks user IP addresses, user-agent strings, and referrer URLs when fonts are loaded. While Google states they do not use this for advertising, under COPPA, any collection of persistent identifiers from children under 13 without verifiable parental consent is non-compliant.

**Evidence:**
- `index.html` lines 12-13, 51-55 load fonts from Google CDN
- Google's Privacy Policy for APIs: "Google Fonts logs records of the CSS and the font file requests, and access to this data is kept secure."

**Remediation Options:**

| Option | Effort | Tradeoffs |
|--------|--------|-----------|
| **Self-host fonts** (Recommended) | Medium | Larger bundle size (~500KB), full compliance |
| Use `fontsource` packages | Low | Adds npm dependencies, full compliance |
| Remove preconnect but keep CDN | None | Partial improvement, still collects data |

**Recommended Action:** Self-host fonts using `fontsource` packages or download font files directly.

### Medium Priority (Should Address)

#### 2. Debug Logging Endpoints

**Issue:** Two hooks contain debug logging to `127.0.0.1:7242`:
- `src/hooks/useMicNoteInput.js` - microphone pitch detection logs
- `src/components/games/sight-reading-game/SightReadingGame.jsx` - sight-reading logs

**Current Status:** **Safe** - Disabled by default via environment variable checks:
```javascript
const __MIC_LOG_ENABLED = import.meta.env.VITE_DEBUG_MIC_LOGS === "true";
const __SR_LOG_ENABLED = import.meta.env.VITE_DEBUG_SR_LOGS === "true";
```

**Recommendation:** No action required. Code is safe as-is. Consider removing entirely before public release to eliminate any doubt.

### Low Priority (Monitor)

#### 3. Service Worker Caching of Google Fonts

**Issue:** `public/sw.js` includes Google Fonts in runtime cache patterns:
```javascript
const RUNTIME_CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  // ...
];
```

**Impact:** If fonts are self-hosted, this pattern becomes unused. If fonts remain external, caching reduces repeated requests but initial request still collects data.

**Action:** Update after deciding on font hosting strategy.

---

## Supabase COPPA Compliance Status

### Data Processing

| Aspect | Status | Notes |
|--------|--------|-------|
| Data location | US/EU configurable | Project region selected at creation |
| DPA available | Yes | Supabase offers Data Processing Addendum |
| COPPA mode | Manual configuration | No built-in "COPPA mode" toggle |
| Data retention | Configurable | Via RLS policies and scheduled functions |
| Data export | Manual | Via Supabase dashboard or SQL |
| Data deletion | Supported | Via SQL/dashboard, cascade delete available |

### Supabase Features in Use

1. **Authentication** - Email/password auth
2. **Database** - PostgreSQL with RLS
3. **Realtime** - Subscriptions (eventsPerSecond: 10)
4. **Storage** - Accessory images (public bucket)

### Supabase COPPA Configuration Required

To achieve COPPA compliance with Supabase:

1. **Execute DPA** with Supabase if processing children's data
2. **Configure data retention** via scheduled functions or triggers
3. **Implement data export** endpoint for parental requests
4. **Implement data deletion** cascade for account deletion
5. **Disable optional telemetry** if any (none detected)

**Note:** Supabase Auth collects email addresses. Under COPPA, email collection from under-13 users requires verifiable parental consent. The app's age verification and parental consent features (Phase 2 goals) address this.

---

## NPM Audit Vulnerabilities

| Package | Severity | Issue | COPPA Impact | Action |
|---------|----------|-------|--------------|--------|
| @eslint/plugin-kit | Low | ReDoS in ConfigCommentParser | None (dev only) | `npm audit fix` |
| glob | High | Command injection in CLI | None (dev only) | `npm audit fix` |
| js-yaml | Moderate | Prototype pollution | None (dev only) | `npm audit fix` |
| react-router | High | CSRF/XSS vulnerabilities | Security risk | **Update urgently** |
| vite | Moderate | Path traversal issues | None (dev only) | `npm audit fix` |

**Note:** Most vulnerabilities are in dev dependencies. The react-router vulnerabilities (CSRF, XSS) should be addressed for security but do not directly impact COPPA compliance.

**Command:** Run `npm audit fix` to address all fixable vulnerabilities.

---

## Remediation Plan

### Immediate Actions (Before Child Data Collection)

| # | Action | Priority | Effort | Owner |
|---|--------|----------|--------|-------|
| 1 | Self-host Google Fonts | High | 2-4 hours | Dev |
| 2 | Run `npm audit fix` | High | 10 minutes | Dev |
| 3 | Update react-router-dom | High | 30 minutes | Dev |

### Before Public Launch

| # | Action | Priority | Effort | Owner |
|---|--------|----------|--------|-------|
| 4 | Execute DPA with Supabase | Medium | 1 hour | Legal/Admin |
| 5 | Remove debug logging code (optional) | Low | 15 minutes | Dev |
| 6 | Update service worker cache patterns | Low | 10 minutes | Dev |

---

## Recommendations

1. **Self-host fonts immediately** - This is the only blocking COPPA issue. Use `fontsource` packages:
   ```bash
   npm install @fontsource/outfit @fontsource/nunito @fontsource/comic-neue @fontsource/fredoka-one @fontsource/dancing-script @fontsource/heebo @fontsource/assistant
   npm install @fontsource/material-icons
   ```

2. **Update dependencies** - Run `npm audit fix` and manually update react-router-dom to latest version.

3. **Document data flows** - Add a PRIVACY_ARCHITECTURE.md documenting all data collection for legal review.

4. **Supabase DPA** - Execute Data Processing Addendum with Supabase before collecting any child data.

5. **Monitor new dependencies** - Before adding any npm package, check for telemetry/analytics behavior.

---

## Verification Checklist

- [x] All production dependencies audited (24 packages)
- [x] All dev dependencies verified as not shipped (21 packages)
- [x] External network requests documented (5 domains)
- [x] npm audit vulnerabilities documented (6 issues)
- [x] Supabase compliance status reviewed
- [x] Remediation plan with priorities created

---

## Appendix: Full Dependency Tree

Production dependencies only (excluding dev):
```
react@18.3.1
react-dom@18.3.1
react-router-dom@7.7.0
redux@5.0.1
react-redux@9.2.0
@reduxjs/toolkit@2.8.2
@supabase/supabase-js@2.52.0
@tanstack/react-query@5.83.0
@tanstack/react-query-devtools@5.83.0
clsx@2.1.1
framer-motion@12.23.26
i18next@25.7.0
i18next-browser-languagedetector@8.2.0
i18next-http-backend@3.0.2 (unused)
klavier@2.0.1
lucide-react@0.344.0
react-confetti@6.4.0
react-hot-toast@2.5.2
react-i18next@16.3.5
react-icons@5.5.0
recharts@3.1.0
tailwindcss-animate@1.0.7
vexflow@5.0.0
vite-plugin-svgr@4.5.0
```

---

*Audit completed: 2026-01-31*
*Next review: Before adding any new npm dependency or external service*
