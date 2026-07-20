# PRD: Refactoring Authentication & User Architecture for Parental Control (COPPA Compliance)

## 1. Overview & Objective

Currently, the application allows direct registration or data collection from child users, raising COPPA compliance risks and failing to meet Google Play Families Policy standards.

The goal of this refactor is to transition to a **Parent-First Account Architecture**. All top-level authenticated users will be adults/parents, and children will be represented solely as lightweight Child Profiles contained within a parent's account.

## 2. Core Architectural Principles

- **Primary Account Owner = Parent**: Only an adult can create a top-level user account (Email/Password, Google OAuth, etc.).
- **Zero PII for Children**: Child profiles must contain NO Personally Identifiable Information (PII) — no full names, no personal emails, no phone numbers, no location data, and no real photos.
- **Parental Consent Implicit via Account Creation**: By owning the master account and creating child profiles within it, the parent provides explicit control and legal consent for profile setup and exercise tracking.

## 3. Detailed Workflow & UI/UX Requirements

### Step 1: Age Gate / Onboarding Gate

**Requirement:** Before allowing registration, present a neutral Age Gate.

**Logic:**

- Ask for Year of Birth (or "Are you a parent / over 18?").
- If user is under 18: Block direct registration. Display a screen: "Please ask a parent or guardian to create an account for you."
- If user is 18+: Proceed to Parent Registration.

### Step 2: Parent Registration & Authentication

**Requirement:** Standard registration using existing auth providers (Supabase Auth / Firebase Auth / Custom JWT).

**Data collected for Parent:**

- Parent Email (Required)
- Parent Password / OAuth Token
- Parent Full Name (Optional)

### Step 3: Child Profile Creation (Post-Signup / Dashboard)

**Requirement:** Allow the parent to create one or more child profiles inside their account settings/dashboard.

**Allowed Child Profile Fields ONLY:**

- `display_name` / nickname (e.g., "Itay") — Enforce a UI note: "Do not use child's full name".
- `avatar_id` / `avatar_url` (Selected strictly from a set of pre-defined system avatars/icons. No image uploads).
- `birth_year` or `grade_level` (Optional, strictly for adapting exercise difficulty).

**Forbidden Fields:** Child Email, Child Phone, Social Media links, Custom Avatars/Photos.

### Step 4: Profile Switcher / App Mode

**Requirement:** Provide a simple toggle/switcher in the UI so the app can switch active profile (e.g., "Switch to Itay's Practice Mode").

**Security Guard:**

Accessing Account Settings, Subscription Management, or Billing requires a Parental Gate (e.g., a simple math problem like `8 x 7 = ?` or Parent Password/PIN).

## 4. Database Schema Changes (Example / Guidelines)

**Existing Model (To be deprecated/migrated):**

`users (id, email, full_name, is_child, practice_stats, ...)`

**Target Model:**

`parents` (or main users table):

- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `created_at` (Timestamp)

`child_profiles` table:

- `id` (UUID, Primary Key)
- `parent_id` (UUID, Foreign Key -> `parents.id`, On Delete Cascade)
- `nickname` (String)
- `avatar_id` (String)
- `created_at` (Timestamp)

`practice_sessions` / `progress` table:

- `id` (UUID)
- `child_profile_id` (UUID, Foreign Key -> `child_profiles.id`)
- `score` / `duration` / `exercise_data` (JSON/Table)

## 5. Third-Party Libraries & Analytics Audit (Critical for COPPA)

**SDK Restrictions:**

- Disable or strip Advertising ID (IDFA / GAID) collection in mobile wrappers / SDKs.
- Ensure analytics tools (e.g., Firebase Analytics, PostHog, Mixpanel) operate in Child-Directed / Restricted Data Processing Mode.
- Never associate tracking tokens or IP-based geolocation with `child_profile_id`.

## 6. Implementation Checklist for Claude Code

- [ ] **Database Migration**: Create `child_profiles` table and adjust foreign keys for progress/stats to point to `child_profile_id` instead of `user_id`.
- [ ] **Age Gate Component**: Implement Age Gate component at the start of signup flow.
- [ ] **Signup Refactor**: Restrict signup inputs strictly to Parent email/password/OAuth.
- [ ] **Profile Management API/Functions**:
  - `createChildProfile(parentId, nickname, avatarId)`
  - `getChildProfiles(parentId)`
  - `deleteChildProfile(parentId, profileId)`
- [ ] **Parental Gate Component**: Add a simple math/PIN gate modal before reaching Parent Settings / Billing.
- [ ] **Privacy Policy Link**: Ensure a direct link to the Privacy Policy is visible on both the Registration screen and inside Parent Settings.
