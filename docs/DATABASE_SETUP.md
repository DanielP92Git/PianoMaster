# Database Setup Documentation

## Current Database Schema

Based on the actual Supabase project structure, here are the existing tables:

### Core Tables

#### 1. students

```sql
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  avatar_id TEXT REFERENCES avatars(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT,
  first_name TEXT,
  level TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT
);
```

#### 2. avatars

```sql
CREATE TABLE avatars (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image_url TEXT,
  name TEXT
);
```

#### 2a. accessories (NEW)

```sql
CREATE TABLE accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT GENERATED ALWAYS AS (
    regexp_replace(lower(name), '[^a-z0-9]+', '_', 'g')
  ) STORED,
  category TEXT NOT NULL CHECK (category IN ('hat', 'headgear', 'eyes', 'face', 'body', 'background', 'other')),
  image_url TEXT NOT NULL,
  price_points INTEGER NOT NULL CHECK (price_points >= 0),
  unlock_level INTEGER CHECK (unlock_level >= 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2b. user_accessories (NEW)

```sql
CREATE TABLE user_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  accessory_id UUID NOT NULL REFERENCES accessories(id) ON DELETE CASCADE,
  slot TEXT NOT NULL DEFAULT 'auto',
  is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  equipped_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT user_accessories_user_accessory_key UNIQUE (user_id, accessory_id)
);
```

#### Students equipped accessories cache (NEW COLUMN)

```sql
ALTER TABLE students
  ADD COLUMN equipped_accessories JSONB NOT NULL DEFAULT '[]'::jsonb;
```

#### Student point transactions (NEW TABLE)

```sql
CREATE TABLE student_point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. practice_sessions

```sql
CREATE TABLE practice_sessions (
  id SERIAL PRIMARY KEY,
  student_id TEXT REFERENCES students(id),
  recording_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis_score INTEGER,
  duration INTEGER,
  goals_completed JSONB[],
  goals_worked JSONB[],
  has_recording BOOLEAN,
  notes_played INTEGER,
  recording_description TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  status practice_session_status,
  submitted_at TIMESTAMP WITH TIME ZONE,
  teacher_feedback TEXT,
  unique_notes INTEGER
);
```

### Game Tables

#### 4. games

```sql
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  icon TEXT,
  name TEXT,
  type TEXT
);
```

#### 5. games_categories

```sql
CREATE TABLE games_categories (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  difficulty TEXT,
  name TEXT,
  type TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

#### 6. students_score

```sql
CREATE TABLE students_score (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id),
  game_id TEXT REFERENCES games(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_type TEXT,
  score INTEGER
);
```

#### 7. students_total_score

```sql
CREATE TABLE students_total_score (
  student_id TEXT PRIMARY KEY REFERENCES students(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT,
  total_score INTEGER,
  user_email TEXT
);
```

### Streak Tracking Tables

#### 8. current_streak

```sql
CREATE TABLE current_streak (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak_count INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

#### 9. highest_streak

```sql
CREATE TABLE highest_streak (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  streak_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  achieved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

#### 10. last_practiced_date

```sql
CREATE TABLE last_practiced_date (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  practiced_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Enums

#### practice_session_status

```sql
CREATE TYPE practice_session_status AS ENUM (
  'pending_review',
  'reviewed',
  'needs_work',
  'excellent'
);
```

## Key Relationships

1. **students → avatars**: Many-to-one (students can have one avatar)
2. **students → practice_sessions**: One-to-many (students can have multiple practice sessions)
3. **students → students_score**: One-to-many (students can have multiple game scores)
4. **students → students_total_score**: One-to-one (each student has one total score record)
5. **games → students_score**: One-to-many (games can be played by multiple students)

## Authentication Integration

The database integrates with Supabase Auth where:

- `students.id` corresponds to `auth.users.id`
- Authentication is handled by Supabase Auth service
- Row Level Security (RLS) policies should be in place

## Teacher Schema (NEW)

### Teacher-Related Tables

#### 11. teachers

```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  school_name TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### 12. classes

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  name TEXT NOT NULL,
  description TEXT,
  grade_level TEXT,
  subject TEXT DEFAULT 'Music',
  class_code TEXT UNIQUE NOT NULL, -- 6-character auto-generated code
  is_active BOOLEAN DEFAULT TRUE,
  max_students INTEGER DEFAULT 30
);
```

#### 13. class_enrollments

```sql
CREATE TABLE class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  class_id UUID NOT NULL REFERENCES classes(id),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'withdrawn'))
);
```

#### 14. assignments

```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  class_id UUID REFERENCES classes(id), -- NULL for global assignments
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  assignment_type TEXT DEFAULT 'practice',
  due_date TIMESTAMPTZ,
  points_possible INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  requirements JSONB
);
```

#### 15. assignment_submissions

```sql
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  assignment_id UUID NOT NULL REFERENCES assignments(id),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'assigned',
  score INTEGER,
  feedback TEXT,
  practice_sessions INTEGER DEFAULT 0,
  total_practice_time INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00
);
```

#### 16. notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  sender_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('achievement', 'assignment', 'message', 'reminder', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal'
);
```

#### 17. teacher_student_messages

```sql
CREATE TABLE teacher_student_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  class_id UUID REFERENCES classes(id),
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  reply_to UUID REFERENCES teacher_student_messages(id)
);
```

### Key Teacher Relationships

1. **teachers → classes**: One-to-many (teachers can have multiple classes)
2. **classes → class_enrollments**: One-to-many (classes can have multiple students)
3. **teachers → assignments**: One-to-many (teachers can create multiple assignments)
4. **assignments → assignment_submissions**: One-to-many (assignments can have multiple submissions)
5. **auth.users → notifications**: One-to-many (users can receive multiple notifications)
6. **auth.users → teacher_student_messages**: Many-to-many (users can send/receive messages)

### Database Views

#### teacher_class_overview

Provides aggregated class information for teachers including student counts.

#### student_progress_summary

Comprehensive student progress data including points, streaks, practice time, and session statistics.

### Special Features

- **Auto-generated Class Codes**: 6-character alphanumeric codes for easy class joining
- **Row Level Security**: Comprehensive RLS policies ensuring data isolation
- **Real-time Subscriptions**: All tables support Supabase real-time subscriptions
- **Automated Timestamps**: Automatic created_at and updated_at timestamp management

## Current Status

✅ **Database Structure**: All tables exist and are properly structured  
✅ **Type Definitions**: TypeScript types generated and updated  
✅ **Relationships**: Foreign key constraints are in place  
✅ **Teacher Schema**: Complete teacher-student relationship system implemented
✅ **RLS Policies**: Comprehensive security policies for data isolation
🔄 **Data Access Layer**: Service functions need to be aligned with actual schema

## Next Steps

1. Update API service functions to match actual table structure
2. Verify RLS policies are properly configured
3. Test data access patterns with existing tables
4. Populate initial data for games and avatars if needed
5. Create teacher dashboard API services
6. Implement teacher authentication flow
7. Test teacher-student relationship functionality
