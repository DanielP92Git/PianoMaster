-- Migration: Add note_mastery JSONB column for per-node per-pitch cumulative accuracy
-- Enables cross-session weak-note targeting in the sight-reading game (Phase 03, ADAPT-03).
-- RLS: none added — existing row-level policies on student_skill_progress
-- (student_skill_progress_insert_own / _update_own / _select_consolidated) cover this
-- new column automatically (Postgres RLS is row-level, not column-level). ADAPT-04 is
-- satisfied by inheritance; the /gsd-secure-phase pass confirms this rather than adding policy.

ALTER TABLE student_skill_progress
ADD COLUMN IF NOT EXISTS note_mastery JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN student_skill_progress.note_mastery IS 'Per-pitch cumulative accuracy for this node, keyed by pitch: { "C4": { "correct": 7, "total": 9 }, ... }. Simple cumulative addition, no decay/recency-weighting (Phase 03 D-10). Written only by the owning student; sight-reading game only.';

CREATE INDEX IF NOT EXISTS idx_student_skill_progress_note_mastery
ON student_skill_progress USING GIN (note_mastery);
