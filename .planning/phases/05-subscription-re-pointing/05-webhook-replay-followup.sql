-- ############################################################################
-- Follow-up SQL for 05-webhook-replay.mjs (D-10a replay suite).
-- Run against the SAME database WEBHOOK_URL pointed at when you ran the
-- script -- for plan 05-08 that's the sandbox project (bfzdqhsdbqkhznwjfghk),
-- never production, unless you deliberately ran the replay against prod (in
-- which case the CLEANUP section below is mandatory and must be recorded in
-- 05-apply-log.md).
--
-- Run the two SELECTs first and paste their results back. Do NOT run the
-- CLEANUP section until told to -- Task 2 of plan 05-08 still needs the B10
-- duplicate-active state (two active rows for the same parent) left in place.
-- ############################################################################

-- -----------------------------------------------------------------------------
-- CHECK 1 -- one row per branch that should have written to parent_subscriptions
-- (B1, B2, B3, B4, B10a, B10b -- 6 rows expected if every branch behaved as
-- expected; B5/B6/B7/B8/B9 should NOT appear here).
-- -----------------------------------------------------------------------------
SELECT ls_subscription_id, parent_id, student_id, status
FROM parent_subscriptions
WHERE ls_subscription_id LIKE 'sim_verify_%'
ORDER BY ls_subscription_id;

-- -----------------------------------------------------------------------------
-- CHECK 2 -- one row per branch that should have been dead-lettered instead
-- (B5, B6, B7 -- 3 rows expected).
-- -----------------------------------------------------------------------------
SELECT received_at, event_name, ls_subscription_id, attempted_id
FROM unresolved_webhook_log
WHERE ls_subscription_id LIKE 'sim_verify_%'
ORDER BY received_at;

-- ############################################################################
-- CLEANUP -- run later, only once Task 2 (real LS checkout + cancel-subscription
-- tests) no longer needs B10's duplicate-active rows. Mandatory before this
-- phase can be considered done if this was ever run against production.
-- ############################################################################

-- DELETE FROM parent_subscriptions WHERE ls_subscription_id LIKE 'sim_verify_%';
-- SELECT * FROM unresolved_webhook_log WHERE ls_subscription_id LIKE 'sim_verify_%';  -- inspect, then delete
-- DELETE FROM unresolved_webhook_log WHERE ls_subscription_id LIKE 'sim_verify_%';
