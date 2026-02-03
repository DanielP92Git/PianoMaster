# PianoApp

## What This Is

A piano learning PWA for 8-year-old learners with a Duolingo-style skill progression trail featuring 26 nodes across 3 units, 8 node types for engagement variety, and 4 game modes (note recognition, sight reading, rhythm, memory). Security hardened with COPPA compliance, protecting children's data through layered authorization, parental consent flows with working email delivery, and shared device safeguards.

## Core Value

**Children's data must be protected and inaccessible to unauthorized users.** Every feature prioritizes preventing unauthorized access to child data, ensuring safe logout on shared devices, and preventing abuse of the XP/progression system.

## Requirements

### Validated

These capabilities exist, are working, and have been shipped:

**v1.2 Trail System Stabilization (shipped 2026-02-03):**
- TRAIL-01-04: 26 treble clef nodes across Units 1-3 (C4 through C5 progression)
- MEM-01-05: Memory Game integrated with trail auto-start, correct config parsing, progress saving
- NAV-01-04: Cross-exercise navigation works (note_recognition, memory_game, sight_reading, rhythm)
- CLEAN-01-02: Temporary docs and debug files removed from repo root
- DEBT-01-04: Tech debt resolved (docs gap, i18n, code deduplication, debug removal)

**v1.1 Parental Consent Email Service (shipped 2026-02-02):**
- EMAIL-01: Edge Function sends consent verification email via Brevo API
- EMAIL-02: Email contains child-friendly branding and clear CTA for parent
- EMAIL-03: Consent URL in email works end-to-end (verify → activate account)
- FIX-01: Eliminated 406 console errors during role detection (.maybeSingle())
- FIX-02: Handle edge cases (resend, expired tokens, invalid links)

**v1.0 Security Hardening (shipped 2026-02-01):**
- SEC-01: RLS policies use database state (not user_metadata) for authorization
- SEC-02: All SECURITY DEFINER functions have auth.uid() checks
- SEC-03: Client-side services verify user.id matches studentId
- SEC-04: Logout clears all user-specific localStorage keys
- SESS-01: Students auto-logout after 30min inactivity
- SESS-02: Teachers auto-logout after 2hr inactivity
- SESS-03: Inactivity timer resets on user interaction
- RATE-01: Score submissions limited to 10 per 5min per node
- RATE-02: Rate limiting enforced at database level
- RATE-03: Rate limit violations return clear error message
- COPPA-01: Data export returns all student data as JSON
- COPPA-02: Data deletion removes all student data with 30-day grace
- COPPA-03: Student usernames anonymized in shared features
- COPPA-04: Neutral age gate collects DOB (not checkbox)
- COPPA-05: Parental consent blocks data collection until verified
- COPPA-06: No third-party data collection (self-hosted fonts)

**Pre-existing:**
- Supabase authentication (email/password)
- Student/teacher role differentiation
- Trail gamification system with XP and levels
- Daily goals generation and tracking
- Multiple game modes (sight reading, notes recognition, rhythm, memory)

### Active

**Current Milestone: v1.3 Trail System Redesign**

**Goal:** Redesign the trail data layer with consistent pedagogy across all three paths (Treble, Bass, Rhythm), eliminating duplicates and creating a professional game-like learning progression for 8-year-olds.

**Target features:**

*Data Layer Cleanup:*
- [ ] Remove all legacy duplicate nodes (LEGACY_NODES in skillTrail.js)
- [ ] Remove nodeGenerator.js dependency for bass/rhythm units
- [ ] Single source of truth for all trail nodes

*Bass Clef Redesign (mirror treble pedagogy):*
- [ ] Bass Unit 1: C4 → B3 → A3 (8 nodes, same node types as treble)
- [ ] Bass Unit 2: G3 → F3 (8 nodes, five-finger bass position)
- [ ] Bass Unit 3: E3 → D3 → C3 (10 nodes, full octave)

*Rhythm Path Redesign (node types, not tier-based):*
- [ ] Rhythm Unit 1: Whole, Half, Quarter notes
- [ ] Rhythm Unit 2: + Dotted Half
- [ ] Rhythm Unit 3: + Eighth Notes
- [ ] Rhythm Unit 4: + Dotted Quarter
- [ ] Rhythm Unit 5: + Sixteenth Notes

*Structure & Pedagogy:*
- [ ] All units follow Discovery → Practice → Mix-Up → Speed → Boss pattern
- [ ] One new concept per Discovery node
- [ ] Node types provide engagement variety within each unit
- [ ] Three parallel paths available from start (Treble, Bass, Rhythm)

**Deferred to v1.4+:**
- VictoryScreen node-type-specific celebrations
- Unlock Event Modal after Unit 3 Boss completion
- Node type icons and colors in TrailNode.jsx
- "What's New" badges in TrailNodeModal.jsx
- Hard delete Edge Function for accounts past 30-day grace period
- Production deployment to Google Play / Apple App Store
- Beta testing with human verification checklist

### Out of Scope

Explicitly excluded:

| Feature | Reason |
|---------|--------|
| Performance optimizations | Not security-critical, separate project |
| Memory Game trail integration bug | Functional bug, not security |
| Debug code cleanup | Code quality, not security |
| Test coverage expansion | Important but not blocking security work |
| VexFlow rendering optimization | Performance, not security |
| Sound file bundle reduction | Performance, not security |
| Multi-language consent emails | English only for now, Hebrew later |

## Context

**Current State (after v1.2):**
- 26-node trail redesign committed with 8 node types for engagement variety
- Memory Game fully integrated with trail auto-start and progress tracking
- 4 game modes working: note recognition, sight reading, rhythm, memory
- COPPA consent flow fully operational with Brevo email delivery
- App hardened with 3-layer authorization (RLS, SECURITY DEFINER, client-side)
- Ready for production deployment and beta testing
- v1.0: 177 files, 31,659 lines | v1.1: 15 files, 1,687 lines | v1.2: 31 files, 4,698 lines

**Tech Stack:**
- Frontend: React 18, Vite 6, React Router v7
- State: Redux Toolkit (minimal), React Context (feature-scoped), TanStack Query v5
- Backend: Supabase (auth, database, real-time, Edge Functions)
- Email: Brevo API (300/day free tier)
- Music: VexFlow v5 for notation, Klavier for keyboard input
- Styling: Tailwind CSS with custom design system

**User Demographics:**
- Primary users: 8-year-old children learning piano
- Secondary users: Teachers managing students, parents overseeing progress
- COPPA compliance required for children under 13

**Known Issues (non-blocking):**
- Parental consent verification method needs legal review
- Privacy policy language requires attorney review
- State age verification laws may require Play Age Signals API

## Constraints

- **Backend**: Supabase (auth, database, real-time) — no changes to this choice
- **Compatibility**: Must not break existing beta user data or progress
- **Compliance**: Must meet Google Play and Apple App Store security requirements
- **COPPA**: Must comply with children's data protection regulations (under 13)
- **COPPA Deadline**: April 22, 2026 for full compliance

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| is_admin() function for admin checks | user_metadata is user-modifiable via supabase.auth.updateUser() | Good |
| Defense-in-depth in triggers | Verify auth.uid() even when RLS should prevent access | Good |
| Trigger-based is_under_13 column | GENERATED ALWAYS AS doesn't support date functions | Good |
| Neutral DOB collection | COPPA requires dropdown menus not leading questions | Good |
| Fixed window rate limiting | Simpler than sliding window, reset after 5 min of inactivity | Good |
| 30min student / 2hr teacher timeout | Balance security on shared devices vs. not interrupting practice | Good |
| crossTab with leaderElection | One tab coordinates timeout across all tabs | Good |
| Fontsource packages for fonts | npm versioning, Vite bundling, no manual font management | Good |
| No separate staging environment | Beta phase with few users; adds maintenance burden | Good |
| Switch from Resend to Brevo | Resend free tier domain limitation; Brevo offers 300/day | Good |
| .maybeSingle() for optional queries | Prevents 406 errors when no rows found | Good |
| SignOut before SignUp | Prevents session conflicts from previous users | Good |
| Public route bypass for consent verify | Parents complete verification regardless of child status | Good |
| Table-based HTML email layout | Maximum email client compatibility (Outlook uses Word engine) | Good |
| 8 node types for engagement variety | Psychological variety improves learning retention | Good |
| 26 nodes in Units 1-3 vs 18 original | Gradual progression appropriate for 8-year-old learners | Good |
| Score calc uses pairs: (cards/2)*10 | Cards count double-counts; pairs is correct game mechanic | Good |
| Use shared verifyStudentDataAccess | Robustness (.maybeSingle), code deduplication | Good |

---

*Last updated: 2026-02-03 after v1.3 milestone started*
