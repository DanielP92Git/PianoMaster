# Phase 3: Production Hardening - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated safeguards that prevent XP farming, protect shared device users from forgotten logouts, and provide rate limiting at the database level. Students auto-logout after 30 minutes of inactivity, teachers after 2 hours. Score submissions are limited to 10 per 5 minutes per student per node.

</domain>

<decisions>
## Implementation Decisions

### Session Timeout UX
- 5-minute warning before automatic logout (modal or toast)
- "Stay logged in" button requires single click only (no password re-entry)
- Timeout timer extends automatically during active exercise gameplay (not settings screens or victory screens)
- After logout, show login page with message: "You were logged out due to inactivity"

### Rate Limit Feedback
- Friendly cooldown message with countdown timer when limit hit: "Take a breather! You can continue in X:XX"
- Rate limit is per-node (each trail node has its own 10/5min counter)
- Fixed 5-minute window (timer starts at first submission, resets fully after 5 min)
- While rate-limited, students can play in "Practice Mode" — games work but scores don't save
- Visible banner during practice mode: "Practice Mode — scores won't be saved"
- Rate limit status hidden until hit (no proactive counter)
- Teachers have no rate limits on their activities
- No override mechanism — limits apply equally to all students

### Inactivity Detection
- Activity triggers: clicks and keypresses only (not mouse movement)
- Background tabs: timer continues when tab is backgrounded
- Active game = exercise in progress (gameplay only, not settings or victory screens)
- Device sleep: Claude's discretion on best practice handling

### Teacher vs Student Differences
- Timeout durations: Students 30 minutes, Teachers 2 hours (from roadmap)
- Same warning message for both roles (just different times)
- Same post-logout message for both roles
- Same "Stay logged in" behavior for both roles (single click extends)
- Fixed timeouts — teachers cannot configure student timeout duration

### Claude's Discretion
- Device sleep/wake handling (best practice approach)
- Exact modal/toast styling for timeout warning
- Practice mode banner styling
- Countdown timer format in rate limit message

</decisions>

<specifics>
## Specific Ideas

- Rate limiting explained: prevents XP farming by limiting score submissions (not note presses). 10 per 5 min per node is generous for legitimate play (~30-60 sec per exercise)
- Practice mode keeps students engaged when rate-limited instead of blocking all gameplay
- "Take a breather!" tone is child-friendly and frames the limit positively

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-production-hardening*
*Context gathered: 2026-02-01*
