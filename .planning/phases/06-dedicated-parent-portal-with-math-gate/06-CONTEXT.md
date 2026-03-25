# Phase 6: Dedicated Parent Portal with Math Gate - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign `/parent-portal` as a dedicated, ParentGateMath-guarded parent area. Consolidate all parent-facing features (subscription management, practice heatmap, progress summary, notification/streak settings) behind a single math gate. Add discoverable entry points in sidebar (desktop) and Settings (mobile). Remove individual ParentGateMath gates from Settings sections that move into the portal.

</domain>

<decisions>
## Implementation Decisions

### Entry Point & Navigation
- **D-01:** Desktop sidebar gets a "Parent Zone" entry with ShieldCheck icon (lucide), placed between Achievements and Settings in `appNavigationConfig.js`
- **D-02:** Mobile does NOT get a bottom nav entry (avoid overloading). Instead, a prominent card/button at the TOP of the Settings page serves as the mobile entry point
- **D-03:** Tapping either entry point navigates to `/parent-portal` which immediately shows the math gate overlay

### Gate Behavior
- **D-04:** Math gate appears on EVERY visit to `/parent-portal` — no session caching, no timed access
- **D-05:** Gate renders as a full-screen overlay (reuse existing `ParentGateMath` component pattern — fixed overlay with backdrop blur)
- **D-06:** Gate state is local to the ParentPortalPage component (simple `useState` boolean, not persisted)

### Portal Content & Layout
- **D-07:** Portal contains 4 sections after gate is passed:
  1. **Quick Stats Cards** — current level + XP, total stars earned, nodes completed (N/93), app-usage streak
  2. **Practice Heatmap** — existing `PracticeHeatmapCard` (52-week rolling calendar)
  3. **Subscription Management** — existing plan status, billing, cancel/re-subscribe UI
  4. **Parent Settings** — weekend pass toggle + push notification consent (moved from AppSettings)
- **D-08:** Quick stats cards are simple glass cards with numbers — no charts, no per-path breakdown
- **D-09:** Portal layout is a single scrollable page with sections, matching the existing glassmorphism design system

### Relationship to Settings
- **D-10:** Weekend pass toggle moves FROM Settings INTO the parent portal
- **D-11:** Push notification consent (NotificationPermissionCard) moves FROM Settings INTO the parent portal
- **D-12:** Subscription section in Settings is replaced by a simple "Parent Zone" entry card (not the full subscription status UI)
- **D-13:** Individual ParentGateMath gates on weekend pass and notification toggles are removed — the portal-level gate covers them
- **D-14:** The feedback form stays in Settings (not parent-gated)

### Claude's Discretion
- Exact card layout and spacing within the portal
- Order of sections within the portal (suggested order in D-07 is a preference, not a hard requirement)
- BackButton destination (likely "/" or "/settings" depending on entry point)
- Animation/transition when gate is solved

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Parent Portal (existing)
- `src/pages/ParentPortalPage.jsx` — Current portal with subscription management + heatmap
- `src/components/parent/PracticeHeatmapCard.jsx` — 52-week heatmap component (reuse as-is)

### Gate Component
- `src/components/settings/ParentGateMath.jsx` — Math gate overlay (reuse pattern, may need minor prop changes)

### Settings (sections to move)
- `src/pages/AppSettings.jsx` — Current Settings page; subscription section, weekend pass, and notification sections will be modified
- `src/components/settings/NotificationPermissionCard.jsx` — Push notification consent component (move to portal)

### Navigation
- `src/components/layout/appNavigationConfig.js` — Sidebar/bottom nav config (add Parent Zone entry)
- `src/components/layout/AppLayout.jsx` — Layout with title resolution for routes

### Routing
- `src/App.jsx` — Route definitions (parent-portal route already exists)

### Design System
- `docs/DESIGN_SYSTEM.md` — Glass card patterns, color tokens

### Data Sources (for quick stats)
- `src/utils/xpSystem.js` — XP level calculation
- `src/services/skillProgressService.js` — Node progress, stars
- `src/services/streakService.js` — Streak data

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ParentGateMath` — Full overlay gate with math problem, RTL support, hint after 3 failures. Reuse directly with `onConsent`/`onCancel` props
- `PracticeHeatmapCard` — Already integrated in ParentPortalPage. No changes needed
- `ParentPortalPage` — Subscription management UI (status badge, cancel dialog, re-subscribe). Refactor to be one section of the new portal
- `NotificationPermissionCard` — 6-state notification permission machine. Move from Settings
- `BackButton` — Reusable back navigation component
- `SettingsSection` — Collapsible section with icon/title (could reuse for portal sections)

### Established Patterns
- Glass card: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg`
- RTL: `i18n.dir() === 'rtl'` with flex-row-reverse pattern
- Data fetching: TanStack React Query with `useQuery`/`queryKey` pattern
- Streak data: React Query key `["streak-state", userId]`

### Integration Points
- `appNavigationConfig.js` — Add new nav item to `student` array (desktop only) and `common` array
- `AppSettings.jsx` — Remove subscription section, weekend pass section, notification section; add Parent Zone entry card at top
- `App.jsx` — Route already exists at `/parent-portal`; no new route needed
- `AppLayout.jsx` — May need title mapping for `/parent-portal` route

</code_context>

<specifics>
## Specific Ideas

- Desktop sidebar entry point with ShieldCheck icon, mobile entry via Settings top card — avoids overloading mobile bottom nav
- Every-visit gate is intentional for COPPA — no session persistence, child can never accidentally browse parent content
- Quick stats should be scannable glass cards, not detailed charts — parents want a quick snapshot

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-dedicated-parent-portal-with-math-gate*
*Context gathered: 2026-03-25*
