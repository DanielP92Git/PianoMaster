-- Daily Challenge System
-- One rotating daily challenge per student with bonus XP

CREATE TABLE student_daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  challenge_date DATE NOT NULL,
  challenge_type TEXT NOT NULL,
  challenge_config JSONB NOT NULL DEFAULT '{}',
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, challenge_date)
);

-- Enable RLS
ALTER TABLE student_daily_challenges ENABLE ROW LEVEL SECURITY;

-- Students can only access their own challenges
CREATE POLICY "students_own_challenges" ON student_daily_challenges
  FOR ALL USING (student_id = auth.uid());

-- Index for fast lookups by student + date
CREATE INDEX idx_daily_challenges_student_date
  ON student_daily_challenges(student_id, challenge_date);
