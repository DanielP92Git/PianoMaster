## Multilingual Support Implementation Guide

This document describes how to introduce full multilingual support to PianoMaster using the existing React + Vite + Tailwind stack and Supabase backend. Follow the steps in order; each section builds on the previous one.

---

### 1. Goals & Constraints
- Support at least English and Hebrew, with room for more locales.
- Avoid rewriting existing components—wrap strings progressively.
- Persist each user’s language across devices (eventually via Supabase profile).
- Respect RTL layout requirements when the active language demands it.

---

### 2. Libraries & Dependencies
Install the following frontend packages:
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```
Optional for fetching JSON bundles over HTTP:
```bash
npm install i18next-http-backend
```

Why these?
- **i18next**: mature, feature-rich i18n core.
- **react-i18next**: idiomatic React hooks (`useTranslation`).
- **browser language detector**: automatic locale discovery + localStorage caching.

---

### 3. File Structure & Assets
Recommended layout under `src/`:
```
src/
  i18n/
    index.js           # initializer
    detectors.js       # optional custom logic
  locales/
    en/
      common.json
      auth.json
      ...
    he/
      common.json
      auth.json
      ...
```
Guidelines:
- Keep keys flat but descriptive (`"iosTip.body"` vs nested objects everywhere).
- Split JSON by domain (`common`, `auth`, `dashboard`) once the file grows.
- Enforce consistent ordering of keys (alphabetical or grouped by screen).

---

### 4. Initialize i18next
Create `src/i18n/index.js`:
```javascript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enCommon from "../locales/en/common.json";
import heCommon from "../locales/he/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      he: { common: heCommon },
    },
    lng: "en",
    fallbackLng: "en",
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
```
If using HTTP backend, replace the `resources` block with backend config and keep JSON files under `public/locales/...`.

**Wire the initializer once** in `src/main.jsx`:
```javascript
import "./i18n";
```

---

### 5. Converting Components
Basic pattern:
```jsx
import { useTranslation } from "react-i18next";

function IOSLandscapeTipModal() {
  const { t } = useTranslation("common");
  return (
    <>
      <p>{t("iosTip.body")}</p>
      <button>{t("common.gotIt")}</button>
    </>
  );
}
```
Rules of thumb:
1. **Never concatenate raw strings**—use interpolation: `t("greeting", { name })`.
2. **Prefer keys over inline text** even for tooltips and aria labels.
3. **Extract shared strings** (buttons, status chips) into a `common` namespace.
4. **Track TODO per file** so you can migrate screen-by-screen without losing context.

---

### 6. Language Selector & Persistence
Short term (client only):
```jsx
const { i18n } = useTranslation();
const changeLanguage = (lng) => i18n.changeLanguage(lng);
```
- Place selectors in `AppSettings` and optionally in a top-level toolbar.
- Store selection in localStorage via the detector (already configured).

Long term (Supabase profile):
1. Add `language` column to `students` and `teachers`.
2. When the selector changes, call `supabase.from("students").update({ language })`.
3. On login, once the profile is fetched, call `i18n.changeLanguage(profile.language || "en")`.
4. Consider syncing service-worker notifications (“language” meta) if needed.

---

### 7. RTL Handling
1. React to language changes in `App.jsx`:
   ```jsx
   const { i18n } = useTranslation();
   useEffect(() => {
     document.documentElement.lang = i18n.language;
     document.documentElement.dir = i18n.dir();
   }, [i18n.language]);
   ```
2. Audit custom CSS for directional assumptions (e.g., `ml-4` vs `mr-4`). Use logical Tailwind classes (`me-4`, `ms-4`) if you adopt the Tailwind RTL plugin.
3. Verify that PWA prompts, modals, and game HUDs still align properly in RTL.

---

### 8. Supabase & Dynamic Content
- **Static UI**: always via translation keys.
- **Dynamic server data**:
  - Option A: store translation keys in Supabase (e.g., `achievement.titleKey`) and translate client-side.
  - Option B: store per-language columns (`title_en`, `title_he`). Use when non-dev staff edit strings through Supabase dashboards.
- **User-generated content**: never translate—render as-is.

---

### 9. Testing & QA
1. **Unit/Smoke Tests**: ensure components render with `useTranslation`.
2. **Manual QA checklist**:
   - Language switch updates UI immediately.
   - `localStorage` caches selection between sessions.
   - Login → redirect flows respect stored language.
   - RTL layout is correct on iOS and desktop browsers.
   - Service worker toasts or browser notifications adapt to new language (if applicable).
3. **Accessibility**: verify `lang` and `dir` attributes change so screen readers behave correctly.

---

### 10. Rollout Strategy
1. Add infra + translation files with English/Hebrew content for the most critical screens (auth, dashboard, navigation, PWA prompts).
2. Gate remaining translations behind a feature flag if needed (e.g., `ENABLE_HEBREW_UI` in `.env`).
3. Once all primary flows are localized, expose the selector to all users.
4. Keep a localization checklist for every new feature: strings, RTL review, JSON updates.
5. Consider integrating with a translation platform (Phrase, Lokalise) once the JSON count grows.

---

### 11. Maintenance Tips
- Require PR reviewers to reject hard-coded user-facing text.
- Automate linting for missing keys (`i18next-parser` or custom scripts).
- Version translation files—never delete keys without a migration plan.
- Document translation key conventions (`feature.section.label`).

---

### 12. Next Steps
1. Commit this guide (`docs/i18n-implementation-guide.md`).
2. Implement the `src/i18n/index.js` initializer and base locales.
3. Localize the highest-traffic components first (login, App layout, dashboard cards).
4. Add a user-facing language selector and persist language choice.
5. Expand coverage to games, modals, and PWA prompts.

Following these steps will give PianoMaster a scalable foundation for multiple languages while keeping the developer workflow straightforward.

