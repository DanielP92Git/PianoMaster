# Phase 14: Subscription Context and Service Layer - Research

**Researched:** 2026-02-27
**Domain:** React Context + TanStack React Query v5 + Supabase Realtime (postgres_changes)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Context shape
- `useSubscription()` returns `{ isPremium, isLoading }` — minimal API
- `isPremium` is a boolean: `true` = active subscription (including grace period), `false` = everything else (free, expired, cancelled past period end)
- No distinction between "never subscribed" and "subscription ended" — both are `isPremium: false`
- No plan details, status strings, or expiry dates exposed — keep it simple, add later if needed

#### Provider placement
- `SubscriptionProvider` sits inside `AuthProvider` but above the Router/App content
- Only fetches subscription status when user is authenticated

#### Loading behavior
- While subscription status is loading, `isPremium` defaults to `false` (assume free)
- Components can use `isLoading` to show skeletons if they want, but the default locked state is acceptable
- No blocking of UI — app renders immediately with free-tier assumption

#### Error handling
- If subscription fetch fails (network error, Supabase down): `isPremium = false` (fail safe)
- Silent degradation — no error toasts or banners shown to the user
- Avoids confusing 8-year-old users with technical error messages

#### Real-time update feedback
- When Realtime channel pushes an update (subscription activated), show a brief toast or subtle animation ("Premium unlocked!" or similar)
- Premium nodes unlock seamlessly on the trail map via query invalidation
- This is the one moment where the user should feel "it worked"

### Claude's Discretion
- Supabase Realtime channel configuration details
- React Query cache key structure and invalidation mechanics
- Service function implementation for fetching subscription status from `parent_subscriptions` table
- Toast/animation implementation details for the unlock moment

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SVC-01 | SubscriptionContext provides isPremium status globally to all components | Context + React Query useQuery pattern with useQueryClient; `useSubscription()` hook consumes the context |
| SVC-02 | Subscription status query uses staleTime: 0 to prevent stale gate decisions | TanStack Query v5 `staleTime: 0` overrides global default of 5 min; verified that `invalidateQueries` overrides even staleTime regardless |
| SVC-03 | Subscription status updates propagate to client in real-time after webhook processes | Supabase Realtime `postgres_changes` channel subscribes to `parent_subscriptions` INSERT/UPDATE events for the authenticated student; callback calls `queryClient.invalidateQueries` |
</phase_requirements>

---

## Summary

This phase creates the React layer that makes subscription status available globally. The pattern combines TanStack React Query v5 (for server state with `staleTime: 0`) with a Supabase Realtime channel (for push invalidation when a payment webhook writes to `parent_subscriptions`). The context is thin: a provider that owns the query and Realtime subscription, and a `useSubscription()` hook that exposes `{ isPremium, isLoading }`.

The existing project already has `react-hot-toast@2.5.1` configured globally via `<Toaster>` in App.jsx, so the unlock toast is a single `toast.success()` call in the Realtime callback. The `useQueryClient()` hook pattern is used universally throughout this codebase (40+ usages) — the provider component can call `useQueryClient()` inside itself since it sits within `QueryClientProvider`. No architectural changes to App.jsx are needed beyond inserting `<SubscriptionProvider>` in the existing provider stack.

The `parent_subscriptions` table already exists (from Phase 12) with RLS that allows authenticated users to SELECT their own row. The service function is a straightforward Supabase query against that table using `auth.uid()` for scoping. The `has_active_subscription()` Postgres helper function exists and handles grace periods — the client query should mirror its logic: `status IN ('active', 'on_trial')` OR (`status = 'cancelled'` AND `current_period_end > NOW()`).

**Primary recommendation:** Build `SubscriptionProvider` as a React context component that calls `useQuery` and `useQueryClient` internally, sets up a Realtime channel in a `useEffect` that calls `queryClient.invalidateQueries({ queryKey: ['subscription', userId] })` on any `parent_subscriptions` change event for the authenticated user, and cleans up the channel on unmount.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.66.0 (installed) | Server-state management, staleTime: 0, invalidation | Already in project; v5 API confirmed |
| @supabase/supabase-js | ^2.48.1 (installed) | Realtime channel subscription | Already configured with Realtime enabled |
| react-hot-toast | ^2.5.1 (installed) | Premium unlock toast notification | Already installed and `<Toaster>` mounted in App.jsx |
| react | ^18.3.1 (installed) | createContext, useContext, useEffect | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.344.0 (installed) | Icon for toast (e.g., Star or Unlock icon) | Optional: enrich unlock toast with icon |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Query | Zustand or Redux | RQ already in project, handles caching + loading states automatically |
| Realtime postgres_changes | polling with refetchInterval | Realtime is push (instant); polling adds 5-30s delay. Realtime is correct choice per SVC-03 |
| toast.success() | Custom modal or animation | toast.success is one line, app already has Toaster mounted |

**Installation:** No new packages needed — all required libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── contexts/
│   └── SubscriptionContext.jsx    # NEW: SubscriptionProvider + useSubscription hook
├── services/
│   └── subscriptionService.js     # NEW: fetchSubscriptionStatus() pure async function
```

### Pattern 1: Context Provider with Embedded React Query

**What:** `SubscriptionProvider` calls `useQuery` and `useQueryClient` directly inside the component body (not at module level). The Realtime channel is set up in a `useEffect` scoped to the user's auth state.

**When to use:** When you need a global subscription to server state that multiple unrelated components need without prop drilling, and you need real-time invalidation from an external push event.

**Example:**
```jsx
// Source: project pattern (useUser.js, AccessibilityContext.jsx combined)
import { createContext, useContext, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSubscriptionStatus } from '../services/subscriptionService';
import { useUser } from '../features/authentication/useUser';
import supabase from '../services/supabase';
import toast from 'react-hot-toast';

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const { user, isAuthenticated } = useUser();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', userId],
    queryFn: () => fetchSubscriptionStatus(userId),
    enabled: isAuthenticated && !!userId,
    staleTime: 0,                  // SVC-02: always considered stale
    retry: 1,
    // On error, React Query returns undefined — isPremium defaults to false
  });

  // SVC-03: Realtime channel for instant invalidation after webhook writes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`subscription-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parent_subscriptions',
          filter: `student_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
          toast.success('Premium unlocked!', { duration: 4000 });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const isPremium = data?.isPremium ?? false;

  return (
    <SubscriptionContext.Provider value={{ isPremium, isLoading }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
```

### Pattern 2: Service Function — fetchSubscriptionStatus

**What:** Pure async function that queries `parent_subscriptions` and returns `{ isPremium: boolean }`. Mirrors the logic of the `has_active_subscription()` Postgres helper.

**When to use:** Called by the React Query `queryFn` — pure function with no React dependencies.

**Example:**
```javascript
// Source: skillProgressService.js pattern + CLAUDE.md DB schema
import supabase from './supabase';

/**
 * Fetch subscription status for the authenticated student.
 * Returns { isPremium: boolean }.
 * Mirrors has_active_subscription() Postgres helper logic.
 */
export async function fetchSubscriptionStatus(studentId) {
  if (!studentId) return { isPremium: false };

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('parent_subscriptions')
    .select('status, current_period_end')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error || !data) return { isPremium: false };

  const { status, current_period_end } = data;

  // Mirror has_active_subscription() Postgres helper:
  // Active OR on_trial
  if (status === 'active' || status === 'on_trial') {
    return { isPremium: true };
  }

  // Cancelled but period not ended — grace: still premium
  if (status === 'cancelled' && current_period_end && current_period_end > now) {
    return { isPremium: true };
  }

  // past_due with 3-day grace (mirrors Postgres helper)
  if (status === 'past_due' && current_period_end) {
    const threeDaysLater = new Date(new Date(current_period_end).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    if (threeDaysLater > now) return { isPremium: true };
  }

  return { isPremium: false };
}
```

### Pattern 3: Provider Placement in App.jsx

**What:** Insert `<SubscriptionProvider>` inside the existing provider stack, after `QueryClientProvider` (which it depends on for `useQueryClient`) but before Router content. `useUser` is called inside `SubscriptionProvider`, so it must be inside `QueryClientProvider` as well.

**When to use:** One-time App.jsx change.

**Example:**
```jsx
// App.jsx — inside the App() component's return, after existing providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <SettingsProvider>
          <SessionTimeoutProvider>
            <ModalProvider>
              <RhythmProvider>
                <SightReadingSessionProvider>
                  <SubscriptionProvider>   {/* NEW — wraps everything that needs isPremium */}
                    <div className="min-h-screen ...">
                      ...
                    </div>
                  </SubscriptionProvider>
                </SightReadingSessionProvider>
              </RhythmProvider>
            </ModalProvider>
          </SessionTimeoutProvider>
        </SettingsProvider>
      </AccessibilityProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
```

### Anti-Patterns to Avoid

- **Module-level queryClient in SubscriptionContext:** Don't import a module-level `queryClient` — use `useQueryClient()` inside the component body. The project uses `useQueryClient()` everywhere; be consistent.
- **Using `refetchInterval` instead of Realtime:** Polling via `refetchInterval` introduces 5-30s delay. The CONTEXT.md explicitly requires Realtime for SVC-03.
- **Subscribing to all `parent_subscriptions` changes:** Always filter with `student_id=eq.${userId}` — never subscribe to the full table. This is both a performance and a COPPA concern (no other users' data).
- **Showing error toast on fetch failure:** CONTEXT.md explicitly requires silent degradation. No error UI for subscription fetch failures.
- **Subscribing to Realtime before `userId` is available:** Guard the `useEffect` with `if (!userId) return` — the channel should only open for authenticated users.
- **Not cleaning up the Realtime channel:** Always call `supabase.removeChannel(channel)` in the `useEffect` cleanup. Leaking channels wastes WebSocket connections.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time DB change detection | WebSocket listener with custom reconnect | Supabase Realtime `postgres_changes` | Handles reconnect, auth, multiplexing |
| Stale-data prevention | Manual timestamp comparisons or localStorage flags | React Query `staleTime: 0` + `invalidateQueries` | Invalidation overrides staleTime; no custom logic needed |
| Toast notifications | Custom toast component | react-hot-toast `toast.success()` | Already installed, Toaster already mounted |
| Auth-gated subscription fetch | Manual auth check in queryFn | `enabled: isAuthenticated && !!userId` in useQuery | Prevents fetch when not logged in; React Query handles it |
| Grace period logic | Client-side date arithmetic | Mirror `has_active_subscription()` logic | Postgres helper defines source of truth; client must match exactly |

**Key insight:** Every component in this phase is a thin wiring of existing infrastructure. The hard problems (database RLS, Realtime auth, query caching, toast rendering) are already solved by the installed stack.

---

## Common Pitfalls

### Pitfall 1: Realtime Channel Auth and RLS

**What goes wrong:** The Realtime channel subscribes successfully (status = SUBSCRIBED) but never fires events, even when `parent_subscriptions` rows are written.

**Why it happens:** Supabase Realtime `postgres_changes` requires the authenticated user to have SELECT permission on the table via RLS. The `parent_subscriptions` RLS policy from Phase 12 grants SELECT to `student_id = auth.uid()` — the filter `student_id=eq.${userId}` must match the auth context exactly. If the user's JWT has expired or the Supabase client session is stale, the channel auth check fails silently.

**How to avoid:** After adding the provider to App.jsx, test in browser devtools: open the network tab, look for the WebSocket connection to `realtime.supabase.co`, and verify the subscription acknowledgment frame. Also test by directly calling `supabase.from('parent_subscriptions').select('*')` from the browser console to verify RLS SELECT works.

**Warning signs:** `status === 'CHANNEL_ERROR'` or `status === 'TIMED_OUT'` in the channel subscribe callback. Add a subscribe status log during development.

### Pitfall 2: Toast Firing on Every Reconnect

**What goes wrong:** When the app recovers from offline or the Realtime connection drops and reconnects, the channel re-subscribes and the existing row in `parent_subscriptions` triggers another postgres_changes event, firing the "Premium unlocked!" toast repeatedly.

**Why it happens:** Supabase Realtime can send synthetic events on reconnection. The `postgres_changes` event filter with `event: '*'` catches both `INSERT` and `UPDATE` — a reconnect may re-deliver the most recent change.

**How to avoid:** Track the previous `isPremium` state with a `useRef`. Only show the toast when `isPremium` transitions from `false` to `true`:
```javascript
const prevIsPremiumRef = useRef(null);

// In the Realtime callback:
() => {
  queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
  // Toast is shown in a useEffect watching data, not in the Realtime callback
}

// Separate useEffect:
useEffect(() => {
  if (prevIsPremiumRef.current === false && data?.isPremium === true) {
    toast.success('Premium unlocked!', { duration: 4000 });
  }
  prevIsPremiumRef.current = data?.isPremium ?? false;
}, [data]);
```

**Warning signs:** Toast fires on app foreground/background switch or on poor network conditions.

### Pitfall 3: staleTime: 0 Causing Excessive Refetches

**What goes wrong:** With `staleTime: 0`, every window focus or component remount triggers a network refetch of `parent_subscriptions`. The global default in App.jsx is `staleTime: 5 * 60 * 1000` (5 min) — this query overrides that with 0.

**Why it happens:** `staleTime: 0` means the data is immediately stale, so any refetch trigger (window focus, network reconnect, component mount) fires a new fetch. The global config has `refetchOnWindowFocus: false` which partially mitigates this, but `refetchOnReconnect: true` is still set globally.

**How to avoid:** Set `staleTime: 0` deliberately (per SVC-02 requirement) but also set `refetchOnWindowFocus: false` on this specific query to match the global default. The Realtime channel handles push invalidation — window-focus refetch is redundant. Add `retry: 1` (not default of 3) to avoid hammering Supabase on transient errors.

**Warning signs:** Network tab shows subscription query firing on every click/navigation.

### Pitfall 4: SubscriptionProvider Calling useUser Before Auth is Ready

**What goes wrong:** `SubscriptionProvider` calls `useUser()` which fires a React Query fetch for the user. If `SubscriptionProvider` is placed outside `QueryClientProvider`, both hooks throw because `QueryClientProvider` is missing from context.

**Why it happens:** `useUser()` internally calls `useQuery()` which requires `QueryClientProvider` in the tree. `SubscriptionProvider` must be a descendant of `QueryClientProvider`.

**How to avoid:** Place `SubscriptionProvider` inside `QueryClientProvider` in App.jsx — exactly as documented in the provider placement pattern above. The `enabled: isAuthenticated && !!userId` guard on the subscription query means no fetch fires until auth is resolved.

**Warning signs:** React error "No QueryClient set, use QueryClientProvider to set one."

### Pitfall 5: Channel Name Collisions

**What goes wrong:** If two `SubscriptionProvider` instances mount (e.g., during HMR or if the component unmounts/remounts), two channels with the same name are created and conflict.

**Why it happens:** Supabase channels are identified by name. Two subscriptions with the same channel name on the same client cause undefined behavior.

**How to avoid:** Use a user-scoped channel name: `` `subscription-changes-${userId}` ``. Since `userId` is unique per session and the provider is a singleton at app root, collisions are prevented in production. During dev HMR, the cleanup function (`supabase.removeChannel(channel)`) in the `useEffect` return handles teardown before remount.

---

## Code Examples

Verified patterns from official sources and project codebase:

### React Query v5 useQuery with staleTime: 0 and conditional fetch
```javascript
// Source: TanStack Query v5 docs + project useUser.js pattern
const { data, isLoading } = useQuery({
  queryKey: ['subscription', userId],
  queryFn: () => fetchSubscriptionStatus(userId),
  enabled: isAuthenticated && !!userId,  // don't fetch until auth is ready
  staleTime: 0,                           // SVC-02: always refetch on invalidation
  refetchOnWindowFocus: false,            // Realtime handles push; no window-focus poll
  retry: 1,
});
```

### Supabase Realtime postgres_changes with filter
```javascript
// Source: https://supabase.com/docs/guides/realtime/postgres-changes
const channel = supabase
  .channel(`subscription-changes-${userId}`)
  .on(
    'postgres_changes',
    {
      event: '*',                    // INSERT and UPDATE
      schema: 'public',
      table: 'parent_subscriptions',
      filter: `student_id=eq.${userId}`,
    },
    (payload) => {
      // payload.new contains the updated row
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
    }
  )
  .subscribe((status) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SubscriptionContext] Realtime status:', status);
    }
  });

// Cleanup in useEffect return:
return () => {
  supabase.removeChannel(channel);
};
```

### queryClient.invalidateQueries v5 syntax
```javascript
// Source: TanStack Query v5 docs — single object parameter (v5 breaking change)
// ✅ v5 syntax:
queryClient.invalidateQueries({ queryKey: ['subscription', userId] });

// ❌ v4 syntax (do NOT use — several other files in project still use old syntax):
queryClient.invalidateQueries(['subscription', userId]);
```

Note: Several files in this project use the v4 syntax (e.g., `TrailMap.jsx:320`, `SightReadingGame.jsx:1376`). For consistency with v5, use the object syntax. Both work in v5 but object syntax is the canonical form.

### react-hot-toast — unlock toast
```javascript
// Source: https://react-hot-toast.com/docs/toast
// Already configured: Toaster is mounted in App.jsx with position="top-center"
import toast from 'react-hot-toast';

toast.success('Premium unlocked!', { duration: 4000 });
```

### Supabase query for parent_subscriptions — matching has_active_subscription()
```javascript
// Source: CLAUDE.md DB schema + has_active_subscription() Postgres function definition
const { data, error } = await supabase
  .from('parent_subscriptions')
  .select('status, current_period_end')
  .eq('student_id', studentId)
  .maybeSingle();  // returns null (not error) if no row found
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prop drilling isPremium down component tree | React Context + useSubscription() hook | This phase | Eliminates prop drilling; single source of truth |
| Polling with refetchInterval for subscription updates | Supabase Realtime postgres_changes push invalidation | This phase | Sub-second update propagation vs. 5-30s polling lag |
| TanStack Query v4 multi-arg invalidateQueries | v5 single object parameter: `{ queryKey: [...] }` | TanStack v5 release | Breaking change — use object syntax in new code |

**Deprecated/outdated:**
- `queryClient.invalidateQueries(['key'])` (array arg): Works in v5 but is v4 style. New code should use `{ queryKey: ['key'] }`.
- `supabase.from('parent_subscriptions').select().eq('student_id', userId).single()`: Use `.maybeSingle()` instead — `.single()` throws if no row exists (un-subscribed student would error).

---

## Open Questions

1. **Toast de-duplication during Realtime reconnect**
   - What we know: Supabase Realtime may re-deliver events on reconnect; toast fires in callback
   - What's unclear: Exact reconnect behavior of `@supabase/supabase-js@2.48.1` with `postgres_changes` — does it replay events?
   - Recommendation: Use the `prevIsPremiumRef` guard pattern documented in Pitfall 2. Show toast only when `isPremium` transitions `false → true` in a `useEffect` watching query data, not directly in the Realtime callback.

2. **`parent_subscriptions` RLS on monetization worktree vs. main branch**
   - What we know: The `parent_subscriptions` table and Realtime SELECT permission exist on the monetization worktree (Phase 12 complete). The main branch does not have this migration yet.
   - What's unclear: Whether Phase 14 work will be done on `feature/v1.8-monetization` or main; the context suggests monetization worktree.
   - Recommendation: Confirm the working branch before starting. All Phase 14 work should be on the monetization worktree (`C:/Users/pagis/OneDrive/WebDev/Projects/MainPianoApp2/worktrees/monetization`).

3. **Supabase Realtime requires explicit table replication for postgres_changes**
   - What we know: For `postgres_changes` to fire, the table must have its `replica identity` set. Supabase sets `replica identity full` by default for tables with RLS.
   - What's unclear: Whether the Phase 12 migration set this explicitly for `parent_subscriptions`.
   - Recommendation: In Wave 0 (or at start of plan), verify: `SELECT relreplident FROM pg_class WHERE relname = 'parent_subscriptions'` returns `f` (full). If not, the plan should include `ALTER TABLE parent_subscriptions REPLICA IDENTITY FULL;`.

---

## Sources

### Primary (HIGH confidence)
- TanStack Query v5 docs (tanstack.com/query/v5) — useQuery staleTime, invalidateQueries, useQueryClient hook
- Supabase Realtime docs (supabase.com/docs/guides/realtime/postgres-changes) — postgres_changes subscribe API, filter syntax, cleanup pattern
- Project codebase: `src/App.jsx` — QueryClient config, existing provider hierarchy, Toaster placement
- Project codebase: `src/features/authentication/useUser.js` — React Query pattern with enabled, staleTime, retry
- Project codebase: `src/contexts/AccessibilityContext.jsx` — Context provider + useEffect cleanup pattern
- CLAUDE.md — `parent_subscriptions` table schema, `has_active_subscription()` Postgres logic, security patterns

### Secondary (MEDIUM confidence)
- react-hot-toast docs (react-hot-toast.com/docs/toast) — toast.success API, duration option
- Supabase JS client reference (supabase.com/docs/reference/javascript/subscribe) — channel subscribe/unsubscribe, status codes
- TanStack Query v5 migration guide — v5 single-object parameter breaking change for invalidateQueries

### Tertiary (LOW confidence)
- Supabase Realtime reconnect behavior with postgres_changes — not explicitly documented; behavior inferred from architecture docs and Medium article on production reliability

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries already installed; versions verified from package.json
- Architecture: HIGH — Provider pattern directly matches existing project patterns (useUser, AccessibilityContext); React Query + Realtime combination is the intended design per CONTEXT.md
- Pitfalls: MEDIUM-HIGH — Realtime reconnect/toast issue is MEDIUM (inferred from architecture); other pitfalls are HIGH (verified from project patterns and official docs)

**Research date:** 2026-02-27
**Valid until:** 2026-03-28 (30 days — Supabase and TanStack APIs are stable; react-hot-toast is stable)
