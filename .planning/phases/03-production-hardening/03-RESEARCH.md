# Phase 3: Production Hardening - Research

**Researched:** 2026-02-01
**Domain:** Session management, inactivity detection, rate limiting
**Confidence:** HIGH

## Summary

This phase implements three automated safeguards for production readiness: inactivity-based session timeouts, user activity detection, and database-level rate limiting. The research reveals a mature ecosystem of solutions for React-based inactivity detection (react-idle-timer 5.7.2), established patterns for PostgreSQL rate limiting using token buckets or fixed windows, and existing UI components in the codebase (Modal, Toast) that can be adapted for timeout warnings.

The standard approach uses react-idle-timer for cross-tab synchronized activity tracking, PostgreSQL functions with advisory locks for race-free rate limiting, and toast/modal notifications for user-friendly feedback. The phase leverages Supabase's built-in session management (1-hour access tokens, long-lived refresh tokens) while adding application-level timeout enforcement on top.

**Primary recommendation:** Use react-idle-timer 5.7.2 with cross-tab synchronization for inactivity detection, implement PostgreSQL token bucket rate limiting with per-node tracking via database function + trigger, and extend existing Modal/Toast components for timeout warnings and rate limit feedback.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-idle-timer | 5.7.2 | Inactivity detection with cross-tab sync | Industry-standard library with WebWorker support, BroadcastChannel for multi-tab coordination, 700k+ weekly downloads |
| react-hot-toast | 2.5.1 (existing) | Toast notifications for warnings | Already in codebase, accessible, supports custom content |
| Supabase Auth | Current | JWT session management | Already in use, handles token refresh automatically |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-countdown | 6.x | Countdown timer display | For showing remaining time in rate limit cooldown messages |
| Page Visibility API | Browser native | Detect tab backgrounding | Already available via document.visibilityState, useful for sleep/wake detection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-idle-timer | Custom setInterval solution | Custom would lack cross-tab sync, WebWorker support, and require significant testing for edge cases |
| Token bucket | Fixed window counter | Fixed window allows burst traffic at window boundaries; token bucket is smoother but more complex |
| Database-level rate limiting | Client-side only | Client-side can be bypassed; database enforcement is security-critical |

**Installation:**
```bash
npm install react-idle-timer react-countdown
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── hooks/
│   ├── useInactivityTimeout.js      # Wraps react-idle-timer with role-based timeouts
│   └── useRateLimitStatus.js        # Polls rate limit status from backend
├── components/ui/
│   ├── InactivityWarningModal.jsx   # 5-minute warning modal
│   └── RateLimitBanner.jsx          # "Practice Mode" banner when rate-limited
├── services/
│   └── rateLimitService.js          # Check/track rate limit status
└── contexts/
    └── SessionContext.jsx            # Global session timeout coordination
```

### Pattern 1: Inactivity Detection with Cross-Tab Sync
**What:** Central hook that detects user inactivity using react-idle-timer with cross-tab synchronization
**When to use:** Wrap entire authenticated app in IdleTimer component, pass role-based timeout duration
**Example:**
```javascript
// Source: react-idle-timer docs (idletimer.dev)
import { useIdleTimer } from 'react-idle-timer';

function useInactivityTimeout(userRole) {
  const timeout = userRole === 'student' ? 30 * 60 * 1000 : 2 * 60 * 60 * 1000; // 30min or 2hr
  const promptBeforeIdle = 5 * 60 * 1000; // 5 minutes before

  const { getRemainingTime, isIdle, start, pause } = useIdleTimer({
    timeout,
    promptBeforeIdle,
    onPrompt: () => {
      // Show warning modal
    },
    onIdle: () => {
      // Force logout
    },
    events: ['click', 'keydown'], // Only clicks and keypress (not mousemove per requirements)
    crossTab: true, // Sync across tabs via BroadcastChannel
    leaderElection: true, // One tab coordinates timers
    throttle: 500, // Limit event processing
  });

  return { getRemainingTime, isIdle, start, pause };
}
```

### Pattern 2: PostgreSQL Token Bucket Rate Limiting
**What:** Database function that enforces per-user, per-node rate limits using token bucket algorithm
**When to use:** Before inserting scores into students_score or student_skill_progress tables
**Example:**
```sql
-- Source: Neon guides (neon.com/guides/rate-limiting)
CREATE TABLE IF NOT EXISTS rate_limits (
  student_id UUID NOT NULL,
  node_id TEXT NOT NULL,
  tokens INTEGER NOT NULL DEFAULT 10,
  last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, node_id)
);

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_student_id UUID,
  p_node_id TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 300 -- 5 minutes
) RETURNS BOOLEAN AS $$
DECLARE
  v_tokens INTEGER;
  v_elapsed_seconds NUMERIC;
BEGIN
  -- Use advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(p_student_id::text || p_node_id));

  -- Get current token count and calculate refill
  SELECT tokens, EXTRACT(EPOCH FROM (NOW() - last_refill))
  INTO v_tokens, v_elapsed_seconds
  FROM rate_limits
  WHERE student_id = p_student_id AND node_id = p_node_id;

  -- If no record, insert with full tokens
  IF NOT FOUND THEN
    INSERT INTO rate_limits (student_id, node_id, tokens, last_refill)
    VALUES (p_student_id, p_node_id, p_max_requests - 1, NOW());
    RETURN TRUE;
  END IF;

  -- Fixed window: reset tokens if window expired
  IF v_elapsed_seconds >= p_window_seconds THEN
    UPDATE rate_limits
    SET tokens = p_max_requests - 1, last_refill = NOW()
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  END IF;

  -- Check if tokens available
  IF v_tokens > 0 THEN
    UPDATE rate_limits
    SET tokens = tokens - 1
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE; -- Rate limited
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Pattern 3: Timeout Warning with Stay Logged In
**What:** Modal shown 5 minutes before timeout with single-click extension
**When to use:** When promptBeforeIdle fires in useIdleTimer
**Example:**
```javascript
// Extend existing Modal component
function InactivityWarningModal({ isOpen, onStayLoggedIn, timeRemaining }) {
  return (
    <Modal isOpen={isOpen} closeOnOverlayClick={false} closeOnEscape={false}>
      <ModalHeader>
        <ModalTitle>Still there?</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <p>You'll be logged out in {formatTime(timeRemaining)} due to inactivity.</p>
      </ModalContent>
      <ModalFooter>
        <button onClick={onStayLoggedIn} className="btn-primary">
          Stay Logged In
        </button>
      </ModalFooter>
    </Modal>
  );
}
```

### Pattern 4: Rate Limit Feedback with Countdown
**What:** Banner showing "Practice Mode" when rate-limited, with countdown to when scores will save again
**When to use:** When check_rate_limit returns FALSE for a student score submission
**Example:**
```javascript
// Using react-countdown library
import Countdown from 'react-countdown';

function RateLimitBanner({ resetTime }) {
  const renderer = ({ minutes, seconds }) => (
    <div className="bg-yellow-100 border border-yellow-400 p-4 rounded">
      <p className="font-semibold">Take a breather! 🌟</p>
      <p>You can continue in {minutes}:{seconds.toString().padStart(2, '0')}</p>
      <p className="text-sm mt-2">Practice Mode — scores won't be saved</p>
    </div>
  );

  return <Countdown date={resetTime} renderer={renderer} />;
}
```

### Anti-Patterns to Avoid
- **Client-only rate limiting:** Can be bypassed by modifying code or API calls. Always enforce at database level.
- **Mousemove for activity detection:** Creates excessive event processing and battery drain. Use clicks/keypress only per requirements.
- **Hard logout without warning:** Frustrating UX, especially mid-activity. Always provide 5-minute warning.
- **Separate timers per tab:** Causes inconsistent timeouts across tabs. Use cross-tab synchronization.
- **Row-level triggers for rate limit:** High overhead on score inserts. Use database functions called before insert instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idle detection | Custom setInterval timer | react-idle-timer 5.7.2 | Cross-tab sync, WebWorker support, handles edge cases like page visibility, sleep/wake detection |
| Rate limiting | Application-level counters | PostgreSQL function with advisory locks | Prevents race conditions, enforceable at DB level, can't be bypassed by client |
| Countdown display | Custom timer component | react-countdown | Handles formatting, auto-updates, supports different renderers |
| Session management | Custom JWT refresh logic | Supabase auth auto-refresh | Built-in refresh ahead of expiry, handles edge cases like token refresh failures |

**Key insight:** Inactivity detection and rate limiting have complex edge cases (multi-tab coordination, race conditions, device sleep, token refresh timing) that make custom solutions error-prone. Using battle-tested libraries prevents security holes and UX bugs.

## Common Pitfalls

### Pitfall 1: Race Conditions in Rate Limiting
**What goes wrong:** Multiple concurrent score submissions bypass rate limit because reads/writes aren't atomic
**Why it happens:** PostgreSQL's default isolation level allows concurrent UPDATEs to race
**How to avoid:** Use `pg_advisory_xact_lock()` in rate limit function to serialize access per user+node
**Warning signs:** Rate limit counts drift higher than expected, multiple submissions succeed simultaneously in logs

### Pitfall 2: Cross-Tab Timer Desynchronization
**What goes wrong:** User has multiple tabs open, timers fire independently, logout happens unpredictably
**Why it happens:** Each tab runs its own timer without coordination
**How to avoid:** Enable `crossTab: true` and `leaderElection: true` in useIdleTimer config
**Warning signs:** Users report being logged out while actively using app in another tab

### Pitfall 3: Blocking Gameplay During Active Exercise
**What goes wrong:** Timer logs user out mid-game, losing progress
**Why it happens:** Settings screens and victory screens don't count as "active gameplay" per requirements
**How to avoid:** Call `pause()` from useIdleTimer when game state is "in-progress", `start()` when returning to idle/settings
**Warning signs:** User complaints about losing progress, logout during gameplay reported in issues

### Pitfall 4: Rate Limit Window Drift
**What goes wrong:** 5-minute window doesn't align with user expectations (e.g., submits 10 at 4:59, gets blocked at 5:01)
**Why it happens:** Fixed window resets at arbitrary timestamps, not from first submission
**How to avoid:** Store `last_refill` timestamp on first submission, reset when `NOW() - last_refill >= 300s`
**Warning signs:** Users report inconsistent rate limiting behavior, some windows seem shorter/longer

### Pitfall 5: Device Sleep Breaking Timer
**What goes wrong:** User puts device to sleep for 10 minutes, wakes up, timer doesn't recognize elapsed time correctly
**Why it happens:** setInterval and setTimeout pause during sleep, don't account for wall-clock time gap
**How to avoid:** react-idle-timer 5.7+ uses WebWorkers which handle sleep/wake better; also listen to Page Visibility API changes
**Warning signs:** Users report not being logged out after long inactivity periods, timers "freeze" on mobile

### Pitfall 6: Supabase Session vs App Timeout Mismatch
**What goes wrong:** App logs user out at 30 min, but Supabase session is still valid for 60 min, causing confusion
**Why it happens:** Supabase's default access token expiry is 1 hour, independent of app timeout
**How to avoid:** When forcing logout in onIdle, call `supabase.auth.signOut()` to invalidate session; don't rely on token expiry
**Warning signs:** Users can still make API calls after app timeout, session state inconsistent

## Code Examples

Verified patterns from official sources:

### Inactivity Timeout Hook with Role-Based Durations
```javascript
// Source: idletimer.dev documentation
import { useIdleTimer } from 'react-idle-timer';
import { useUser } from '../features/authentication/useUser';
import { useLogout } from '../features/authentication/useLogout';
import { useState, useCallback } from 'react';

export function useInactivityTimeout() {
  const { userRole, isStudent } = useUser();
  const { logout } = useLogout();
  const [showWarning, setShowWarning] = useState(false);

  // Student: 30min, Teacher: 2hr (from requirements)
  const timeout = isStudent ? 30 * 60 * 1000 : 2 * 60 * 60 * 1000;
  const promptBeforeIdle = 5 * 60 * 1000; // 5 minutes warning

  const handlePrompt = useCallback(() => {
    setShowWarning(true);
  }, []);

  const handleIdle = useCallback(() => {
    setShowWarning(false);
    logout(); // This calls supabase.auth.signOut() from useLogout
  }, [logout]);

  const { getRemainingTime, activate, pause } = useIdleTimer({
    timeout,
    promptBeforeIdle,
    onPrompt: handlePrompt,
    onIdle: handleIdle,
    events: ['click', 'keydown'], // Only clicks and keypress per requirements
    crossTab: true, // Sync across tabs via BroadcastChannel
    leaderElection: true, // Elect one tab as coordinator
    throttle: 500, // Process events at most every 500ms
    startManually: false, // Auto-start
  });

  const stayLoggedIn = useCallback(() => {
    setShowWarning(false);
    activate(); // Reset timer
  }, [activate]);

  return {
    showWarning,
    timeRemaining: getRemainingTime(),
    stayLoggedIn,
    pauseTimer: pause,
    resumeTimer: activate,
  };
}
```

### Database Rate Limit Check Before Score Insert
```sql
-- Source: Neon rate limiting guide (neon.com/guides/rate-limiting)
-- Migration: 20260201000002_add_rate_limiting.sql

-- Table to track rate limits per student per node
CREATE TABLE IF NOT EXISTS rate_limits (
  student_id UUID NOT NULL,
  node_id TEXT NOT NULL,
  tokens INTEGER NOT NULL DEFAULT 10,
  last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, node_id)
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON rate_limits TO authenticated;

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Students can only see/modify their own rate limits
CREATE POLICY "Students can manage own rate limits"
  ON rate_limits
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

-- Function to check and consume rate limit token
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_student_id UUID,
  p_node_id TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 300 -- 5 minutes
) RETURNS BOOLEAN AS $$
DECLARE
  v_tokens INTEGER;
  v_elapsed_seconds NUMERIC;
BEGIN
  -- Advisory lock prevents race conditions (lock released at transaction end)
  PERFORM pg_advisory_xact_lock(hashtext(p_student_id::text || p_node_id));

  -- Get current token count and time since last refill
  SELECT tokens, EXTRACT(EPOCH FROM (NOW() - last_refill))
  INTO v_tokens, v_elapsed_seconds
  FROM rate_limits
  WHERE student_id = p_student_id AND node_id = p_node_id;

  -- First submission: insert record with full tokens minus one
  IF NOT FOUND THEN
    INSERT INTO rate_limits (student_id, node_id, tokens, last_refill)
    VALUES (p_student_id, p_node_id, p_max_requests - 1, NOW());
    RETURN TRUE;
  END IF;

  -- Window expired: reset tokens to full (minus one for this request)
  IF v_elapsed_seconds >= p_window_seconds THEN
    UPDATE rate_limits
    SET tokens = p_max_requests - 1, last_refill = NOW()
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  END IF;

  -- Window active: check if tokens available
  IF v_tokens > 0 THEN
    -- Consume one token
    UPDATE rate_limits
    SET tokens = tokens - 1
    WHERE student_id = p_student_id AND node_id = p_node_id;
    RETURN TRUE;
  ELSE
    -- Rate limited: no tokens left
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION check_rate_limit IS 'Fixed window rate limiter: 10 requests per 5 minutes per student per node. Returns TRUE if request allowed, FALSE if rate limited.';
```

### Client-Side Rate Limit Service
```javascript
// src/services/rateLimitService.js
import supabase from './supabase';

/**
 * Check if student can submit score for a node
 * @param {string} studentId - Student UUID
 * @param {string} nodeId - Trail node ID
 * @returns {Promise<{allowed: boolean, resetTime?: Date}>}
 */
export async function checkRateLimit(studentId, nodeId) {
  // Call database function
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_student_id: studentId,
    p_node_id: nodeId,
    p_max_requests: 10,
    p_window_seconds: 300, // 5 minutes
  });

  if (error) {
    console.error('Rate limit check failed:', error);
    throw error;
  }

  const allowed = data === true;

  // If rate limited, calculate reset time
  let resetTime = null;
  if (!allowed) {
    const { data: limitData } = await supabase
      .from('rate_limits')
      .select('last_refill')
      .eq('student_id', studentId)
      .eq('node_id', nodeId)
      .single();

    if (limitData) {
      resetTime = new Date(new Date(limitData.last_refill).getTime() + 5 * 60 * 1000);
    }
  }

  return { allowed, resetTime };
}

/**
 * Get remaining rate limit tokens for a node
 * @param {string} studentId
 * @param {string} nodeId
 * @returns {Promise<{tokens: number, resetTime: Date}>}
 */
export async function getRateLimitStatus(studentId, nodeId) {
  const { data, error } = await supabase
    .from('rate_limits')
    .select('tokens, last_refill')
    .eq('student_id', studentId)
    .eq('node_id', nodeId)
    .single();

  if (error || !data) {
    return { tokens: 10, resetTime: new Date() }; // No record = full tokens
  }

  const resetTime = new Date(new Date(data.last_refill).getTime() + 5 * 60 * 1000);
  return { tokens: data.tokens, resetTime };
}
```

### Inactivity Warning Modal Component
```javascript
// src/components/ui/InactivityWarningModal.jsx
import React from 'react';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from './Modal';
import Countdown from 'react-countdown';

export default function InactivityWarningModal({ isOpen, onStayLoggedIn, timeRemaining }) {
  const countdownRenderer = ({ minutes, seconds }) => (
    <span className="font-mono font-bold text-2xl text-kidsPrimary-600">
      {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );

  return (
    <Modal
      isOpen={isOpen}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      showCloseButton={false}
      size="default"
    >
      <ModalHeader>
        <ModalTitle>Still there?</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <p className="text-gray-700 mb-4">
          You'll be logged out in{' '}
          <Countdown
            date={Date.now() + timeRemaining}
            renderer={countdownRenderer}
          />{' '}
          due to inactivity.
        </p>
        <p className="text-sm text-gray-600">
          Click below to stay logged in and keep practicing!
        </p>
      </ModalContent>
      <ModalFooter>
        <button
          onClick={onStayLoggedIn}
          className="btn-primary px-6 py-3 rounded-lg font-semibold"
        >
          Stay Logged In
        </button>
      </ModalFooter>
    </Modal>
  );
}
```

### Rate Limit Banner Component
```javascript
// src/components/ui/RateLimitBanner.jsx
import React from 'react';
import Countdown from 'react-countdown';
import { Coffee } from 'lucide-react';

export default function RateLimitBanner({ resetTime, onDismiss }) {
  const countdownRenderer = ({ minutes, seconds, completed }) => {
    if (completed) {
      return <span>You can save scores again now! 🎉</span>;
    }
    return (
      <span className="font-mono font-semibold">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    );
  };

  return (
    <div className="bg-kidsWarning-100 border-2 border-kidsWarning-400 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Coffee className="w-6 h-6 text-kidsWarning-700 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-bold text-kidsWarning-900 mb-1">
            Take a breather! 🌟
          </h3>
          <p className="text-kidsWarning-800">
            You can continue in{' '}
            <Countdown date={resetTime} renderer={countdownRenderer} />
          </p>
          <p className="text-sm text-kidsWarning-700 mt-2">
            <strong>Practice Mode</strong> — You can still play, but scores won't be saved
          </p>
        </div>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side setTimeout logout | react-idle-timer with WebWorkers | v5.0 (2022) | Timers survive background tab throttling, cross-tab sync prevents inconsistent timeouts |
| Token bucket in Redis | PostgreSQL advisory locks | 2024+ | Removes Redis dependency, leverages existing Supabase Postgres, advisory locks prevent races |
| Global rate limit | Per-node rate limiting | Phase 3 design | Allows students to practice different skills while rate-limited on one, better UX |
| Sliding window log | Fixed window counter | Optimization | Simpler implementation, lower memory usage, acceptable for this use case (10/5min is generous) |

**Deprecated/outdated:**
- **react-idle-timer v4**: Version 5 added WebWorker support and cross-tab sync via BroadcastChannel
- **pg_cron for rate limit cleanup**: Fixed window approach doesn't require cleanup (rows reused, tokens refill on window expiry)
- **Redis for rate limiting in Supabase apps**: PostgreSQL advisory locks are sufficient and remove external dependency

## Open Questions

Things that couldn't be fully resolved:

1. **Device Sleep/Wake Handling**
   - What we know: react-idle-timer v5 uses WebWorkers which handle sleep better than main-thread timers; Page Visibility API can detect wake
   - What's unclear: Exact behavior on iOS PWA vs Android PWA vs desktop browsers when device sleeps mid-session
   - Recommendation: Test on target devices (iPad, Android tablet) and implement Page Visibility listener to force logout if hidden > timeout duration

2. **Rate Limit in Practice Mode vs Real Games**
   - What we know: Rate limit applies to score submissions, not gameplay. Games should work but scores don't save.
   - What's unclear: Should practice mode exercises count toward daily goals? Should they award XP?
   - Recommendation: Discuss with user/PM; likely practice mode should NOT count toward goals (would encourage XP farming during rate limit)

3. **Teacher Rate Limiting**
   - What we know: Requirements state teachers have no rate limits
   - What's unclear: Should check_rate_limit function early-return TRUE for teacher role? Or skip call entirely in client?
   - Recommendation: Skip rate limit check entirely in client for teachers (cleaner, avoids DB round-trip)

4. **Multi-Tab Logout Behavior**
   - What we know: react-idle-timer can sync across tabs, logout would happen in leader tab
   - What's unclear: Should all tabs close/redirect simultaneously, or only leader tab?
   - Recommendation: Use BroadcastChannel to notify all tabs when logout occurs, each calls useLogout independently for clean state reset

## Sources

### Primary (HIGH confidence)
- [IdleTimer Official Docs](https://idletimer.dev/) - react-idle-timer v5.7 features, configuration, cross-tab sync
- [react-idle-timer npm](https://www.npmjs.com/package/react-idle-timer) - Installation, version info
- [Neon Rate Limiting Guide](https://neon.com/guides/rate-limiting) - PostgreSQL rate limiting patterns with advisory locks
- [Supabase Auth Sessions](https://supabase.com/docs/guides/auth/sessions) - Token expiration, refresh behavior
- [Supabase refreshSession API](https://supabase.com/docs/reference/javascript/auth-refreshsession) - Manual session refresh

### Secondary (MEDIUM confidence)
- [LogRocket: Idle Timer for React](https://blog.logrocket.com/make-idle-timer-react-app/) - Implementation patterns, use cases
- [Blog: Rate Limiting with PostgreSQL](https://blog.mansueli.com/rate-limiting-supabase-requests-with-postgresql-and-pgheaderkit) - Supabase-specific patterns
- [DEV: Token Bucket in PostgreSQL](https://dev.to/yugabyte/rate-limiting-with-postgresql-yugabytedb-token-buckets-function-5dh8) - Token bucket implementation
- [react-countdown npm](https://www.npmjs.com/package/react-countdown) - Countdown component API
- [FreeCodeCamp: Countdown Timer Tutorial](https://www.freecodecamp.org/news/build-a-countdown-timer-with-react-step-by-step/) - Implementation patterns

### Tertiary (LOW confidence)
- WebSearch results on sliding window vs fixed window (general information, not PostgreSQL-specific)
- Medium articles on inactivity detection (good patterns but not authoritative sources)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-idle-timer is industry-standard (700k weekly downloads), PostgreSQL rate limiting is well-documented
- Architecture: HIGH - Patterns verified from official documentation, aligned with existing codebase structure (Modal, Toast, hooks, services)
- Pitfalls: MEDIUM - Based on documented edge cases and community experiences, but device sleep behavior needs testing

**Research date:** 2026-02-01
**Valid until:** 60 days (libraries are stable, PostgreSQL patterns are established)
