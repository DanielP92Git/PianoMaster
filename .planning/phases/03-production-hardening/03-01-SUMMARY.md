---
phase: 03-production-hardening
plan: 01
subsystem: security
tags: [rate-limiting, postgresql, xp-system, anti-abuse]
depends_on:
  requires: [02-COPPA]
  provides: [rate-limit-infrastructure]
  affects: [03-02-score-integration]
tech-stack:
  added: []
  patterns: [fixed-window-rate-limit, advisory-locks, security-definer-with-auth]
key-files:
  created:
    - supabase/migrations/20260201000002_add_rate_limiting.sql
    - src/services/rateLimitService.js
  modified: []
decisions:
  - id: fixed-window-algorithm
    choice: "Fixed window rate limiting (reset after 5 minutes of inactivity)"
    reason: "Simpler than sliding window, acceptable for this use case, aligns with research recommendation"
  - id: advisory-lock-pattern
    choice: "pg_advisory_xact_lock with hash of student_id + node_id"
    reason: "Prevents race conditions on concurrent submissions, lock released at transaction end"
metrics:
  duration: "3 minutes"
  completed: "2026-02-01"
---

# Phase 3 Plan 1: Rate Limiting Database Infrastructure Summary

**One-liner:** PostgreSQL rate limiting with fixed window algorithm, advisory locks for race prevention, and auth.uid() verification for self-only enforcement

## What Was Built

### Database Layer (supabase/migrations/20260201000002_add_rate_limiting.sql)

1. **rate_limits table:**
   - Composite primary key: (student_id, node_id)
   - Fields: tokens (0-10), last_refill (timestamp)
   - Foreign key to students table with CASCADE delete
   - Index for efficient lookups

2. **check_rate_limit function (SECURITY DEFINER):**
   - Parameters: p_student_id, p_node_id, p_max_requests (default 10), p_window_seconds (default 300)
   - Returns BOOLEAN (true = allowed, false = rate limited)
   - Authorization: Verifies auth.uid() = p_student_id before any operation
   - Race prevention: Uses pg_advisory_xact_lock(hashtext(student_id || node_id))
   - Fixed window logic:
     - First submission: Insert record with max-1 tokens
     - Window expired (>= 5 min): Reset to max-1 tokens
     - Tokens available: Decrement and allow
     - No tokens: Return false (rate limited)

3. **RLS Policies:**
   - SELECT: student_id = auth.uid()
   - INSERT: student_id = auth.uid()
   - UPDATE: student_id = auth.uid() (both USING and WITH CHECK)

### Client Service (src/services/rateLimitService.js)

1. **checkRateLimit(studentId, nodeId):**
   - Calls supabase.rpc('check_rate_limit', {...})
   - Returns { allowed: boolean, resetTime: Date|null }
   - If rate limited, fetches last_refill to calculate resetTime

2. **getRateLimitStatus(studentId, nodeId):**
   - Queries rate_limits table directly (no token consumption)
   - Returns { tokens: number, resetTime: Date }
   - Handles PGRST116 (no rows) as "full tokens available"

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rate limit algorithm | Fixed window | Simpler than sliding window, research shows acceptable for 10/5min threshold |
| Lock mechanism | pg_advisory_xact_lock | Transaction-scoped, automatically released, prevents race conditions |
| Authorization | auth.uid() check in function | Defense-in-depth: RLS + function-level verification |
| Token initialization | max_requests - 1 | First submission consumes one token |
| Window reset | On first request after expiry | Lazy reset, no background job needed |

## Verification Checklist

- [x] Migration file contains CREATE TABLE rate_limits
- [x] check_rate_limit function uses SECURITY DEFINER
- [x] pg_advisory_xact_lock used for race prevention
- [x] auth.uid() != p_student_id raises exception
- [x] RLS policies use student_id = auth.uid()
- [x] Service exports checkRateLimit and getRateLimitStatus
- [x] supabase.rpc call uses correct parameter names (p_student_id, p_node_id)

## Integration Points

**Next plan (03-02) will wire:**
- VictoryScreen.jsx calls checkRateLimit before updateExerciseProgress/updateNodeProgress
- If rate limited, show RateLimitBanner component
- Allow gameplay but skip score saving ("Practice Mode")

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Rate limiting database migration | 9aa7252 |
| 2 | Rate limit service for client | 070291a |
