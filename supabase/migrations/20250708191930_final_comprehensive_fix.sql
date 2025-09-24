-- Final Comprehensive Performance Fix
-- Address all remaining warnings from updated warnings.json
-- Focus on removing duplicate policies and fixing auth optimizations

DO $$
BEGIN
    RAISE NOTICE 'Starting final comprehensive performance fix...';
END $$;

-- 1. ASSIGNMENTS TABLE - Remove 7 duplicate SELECT policies!!!
DO $$
BEGIN
    RAISE NOTICE 'Fixing assignments table - removing 7 duplicate SELECT policies...';
    
    -- Drop ALL existing policies to start clean
    DROP POLICY IF EXISTS "Teachers can manage assignments in their classes" ON assignments;
    DROP POLICY IF EXISTS "Teachers can manage their assignments" ON assignments;
    DROP POLICY IF EXISTS "Teachers can manage their own assignments" ON assignments;
    DROP POLICY IF EXISTS "Teachers can update their assignments" ON assignments;
    DROP POLICY IF EXISTS "Teachers can view their assignments" ON assignments;
    DROP POLICY IF EXISTS "Teachers can create assignments" ON assignments;
    DROP POLICY IF EXISTS "Teachers can delete their assignments" ON assignments;
    DROP POLICY IF EXISTS "Students can view assignments for their classes" ON assignments;
    DROP POLICY IF EXISTS "Students can view assignments for enrolled classes" ON assignments;
    DROP POLICY IF EXISTS "Students can view assignments in their classes" ON assignments;
    DROP POLICY IF EXISTS "Students can view class assignments" ON assignments;
    DROP POLICY IF EXISTS "Students can view their assignments" ON assignments;
    DROP POLICY IF EXISTS "Students can view assignments" ON assignments;
    DROP POLICY IF EXISTS "Enable select for authenticated users" ON assignments;
    
    -- Create ONLY 2 clean policies
    CREATE POLICY "Teachers can manage assignments" ON assignments
        FOR ALL USING (teacher_id = (select auth.uid()));
    
    CREATE POLICY "Students can view assignments" ON assignments
        FOR SELECT USING (
            class_id IN (
                SELECT class_id FROM class_enrollments 
                WHERE student_id = (select auth.uid()) AND status = 'active'
            ) OR class_id IS NULL
        );
END $$;

-- 2. CLASS_ENROLLMENTS TABLE - Remove 7 duplicate SELECT policies!!!
DO $$
BEGIN
    RAISE NOTICE 'Fixing class_enrollments table - removing 7 duplicate SELECT policies...';
    
    -- Drop ALL existing policies
    DROP POLICY IF EXISTS "Students can view their enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Students can view their own enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Students can update their enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Students can update their own enrollment status" ON class_enrollments;
    DROP POLICY IF EXISTS "Students can manage their enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Students can insert their enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Students can delete their enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can manage class enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can manage enrollments for their classes" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can manage their class enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can view enrollments for their classes" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can view their class enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can create enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can update enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can delete enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Enable select for authenticated users" ON class_enrollments;
    
    -- Create ONLY 3 clean policies
    CREATE POLICY "Students can view their enrollments" ON class_enrollments
        FOR SELECT USING (student_id = (select auth.uid()));
    
    CREATE POLICY "Students can update their enrollments" ON class_enrollments
        FOR UPDATE USING (student_id = (select auth.uid()));
    
    CREATE POLICY "Teachers can manage enrollments" ON class_enrollments
        FOR ALL USING (
            class_id IN (SELECT id FROM classes WHERE teacher_id = (select auth.uid()))
        );
END $$;

-- 3. STUDENTS TABLE - Remove 9 duplicate SELECT policies!!!
DO $$
BEGIN
    RAISE NOTICE 'Fixing students table - removing 9 duplicate SELECT policies...';
    
    -- Drop ALL existing policies
    DROP POLICY IF EXISTS "Students can manage their profile" ON students;
    DROP POLICY IF EXISTS "Students can view own profile" ON students;
    DROP POLICY IF EXISTS "Students can view their own profile" ON students;
    DROP POLICY IF EXISTS "Students can insert own profile" ON students;
    DROP POLICY IF EXISTS "Students can insert their own profile" ON students;
    DROP POLICY IF EXISTS "Students can update own profile" ON students;
    DROP POLICY IF EXISTS "Students can update their own profile" ON students;
    DROP POLICY IF EXISTS "Students can delete their profile" ON students;
    DROP POLICY IF EXISTS "Teachers can view connected students" ON students;
    DROP POLICY IF EXISTS "Teachers can view enrolled students" ON students;
    DROP POLICY IF EXISTS "Teachers can view students" ON students;
    DROP POLICY IF EXISTS "Teachers can create students" ON students;
    DROP POLICY IF EXISTS "Teachers can update student records" ON students;
    DROP POLICY IF EXISTS "Teachers can manage students" ON students;
    DROP POLICY IF EXISTS "Service role can manage students" ON students;
    DROP POLICY IF EXISTS "Enable read access for all users" ON students;
    DROP POLICY IF EXISTS "Users can view insert and update their own info" ON students;
    DROP POLICY IF EXISTS "Users can update their own info" ON students;
    DROP POLICY IF EXISTS "Enable select for authenticated users" ON students;
    
    -- Create ONLY 3 clean policies
    CREATE POLICY "Students can manage their profile" ON students
        FOR ALL USING (id = (select auth.uid()));
    
    CREATE POLICY "Teachers can view enrolled students" ON students
        FOR SELECT USING (
            id IN (
                SELECT student_id FROM teacher_student_connections 
                WHERE teacher_id = (select auth.uid())
            )
        );
    
    CREATE POLICY "Service role can manage students" ON students
        FOR ALL USING (auth.role() = 'service_role');
END $$;

-- 4. TEACHERS TABLE - Remove 5 duplicate SELECT policies!!!
DO $$
BEGIN
    RAISE NOTICE 'Fixing teachers table - removing 5 duplicate SELECT policies...';
    
    -- Drop ALL existing policies
    DROP POLICY IF EXISTS "Teachers can manage their profile" ON teachers;
    DROP POLICY IF EXISTS "Teachers can view own profile" ON teachers;
    DROP POLICY IF EXISTS "Teachers can view their own profile" ON teachers;
    DROP POLICY IF EXISTS "Teachers can select own profile" ON teachers;
    DROP POLICY IF EXISTS "Teachers can insert own profile" ON teachers;
    DROP POLICY IF EXISTS "Teachers can insert their own profile" ON teachers;
    DROP POLICY IF EXISTS "Teachers can update own profile" ON teachers;
    DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;
    DROP POLICY IF EXISTS "Teachers can delete their profile" ON teachers;
    DROP POLICY IF EXISTS "Service role can manage teachers" ON teachers;
    DROP POLICY IF EXISTS "Enable select for authenticated users" ON teachers;
    
    -- Create ONLY 2 clean policies
    CREATE POLICY "Teachers can manage their profile" ON teachers
        FOR ALL USING (id = (select auth.uid()));
    
    CREATE POLICY "Service role can manage teachers" ON teachers
        FOR ALL USING (auth.role() = 'service_role');
END $$;

-- 5. CLASSES TABLE - Remove multiple duplicate policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing classes table - removing duplicate policies...';
    
    -- Drop ALL existing policies
    DROP POLICY IF EXISTS "Students can view active classes" ON classes;
    DROP POLICY IF EXISTS "Students can view enrolled classes" ON classes;
    DROP POLICY IF EXISTS "Students can view their classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can delete their own classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can delete their classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can update their own classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can update their classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can view their classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can insert their classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can manage their own classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can manage their classes" ON classes;
    DROP POLICY IF EXISTS "Enable select for authenticated users" ON classes;
    
    -- Create ONLY 2 clean policies
    CREATE POLICY "Students can view enrolled classes" ON classes
        FOR SELECT USING (
            id IN (
                SELECT class_id FROM class_enrollments 
                WHERE student_id = (select auth.uid()) AND status = 'active'
            )
        );
    
    CREATE POLICY "Teachers can manage their classes" ON classes
        FOR ALL USING (teacher_id = (select auth.uid()));
END $$;

-- 6. PRACTICE_SESSIONS TABLE - Remove multiple duplicate policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing practice_sessions table - removing duplicate policies...';
    
    -- Drop ALL existing policies
    DROP POLICY IF EXISTS "Students can manage their practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Teachers can manage student practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Teachers can update practice sessions from their students" ON practice_sessions;
    DROP POLICY IF EXISTS "Teachers can view practice sessions from their students" ON practice_sessions;
    DROP POLICY IF EXISTS "Teachers can view practice sessions for their students" ON practice_sessions;
    DROP POLICY IF EXISTS "Users can delete only their own files" ON practice_sessions;
    DROP POLICY IF EXISTS "Users can update their own practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Users can view their own practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Users can insert their own practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Students can view their own practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Students can manage their own practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Students can insert their practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Students can update their practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Students can delete their practice sessions" ON practice_sessions;
    DROP POLICY IF EXISTS "Enable select for authenticated users" ON practice_sessions;
    
    -- Create ONLY 2 clean policies with optimized auth
    CREATE POLICY "Students can manage their practice sessions" ON practice_sessions
        FOR ALL USING (student_id = (select auth.uid()));
    
    CREATE POLICY "Teachers can manage student practice sessions" ON practice_sessions
        FOR ALL USING (
            student_id IN (
                SELECT student_id FROM teacher_student_connections 
                WHERE teacher_id = (select auth.uid())
            )
        );
END $$;

-- 7. TEACHER_STUDENT_MESSAGES TABLE - Remove multiple duplicate policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing teacher_student_messages table - removing duplicate policies...';
    
    -- Drop ALL existing policies
    DROP POLICY IF EXISTS "Users can manage their messages" ON teacher_student_messages;
    DROP POLICY IF EXISTS "Teachers can message students" ON teacher_student_messages;
    DROP POLICY IF EXISTS "Teachers and students can view their conversations" ON teacher_student_messages;
    DROP POLICY IF EXISTS "Teachers can message their students" ON teacher_student_messages;
    DROP POLICY IF EXISTS "Users can update messages they sent" ON teacher_student_messages;
    DROP POLICY IF EXISTS "Users can view messages they sent or received" ON teacher_student_messages;
    DROP POLICY IF EXISTS "Users can view their own messages" ON teacher_student_messages;
    DROP POLICY IF EXISTS "Users can update their own messages" ON teacher_student_messages;
    DROP POLICY IF EXISTS "Users can insert their own messages" ON teacher_student_messages;
    DROP POLICY IF EXISTS "Users can delete their own messages" ON teacher_student_messages;
    DROP POLICY IF EXISTS "Enable select for authenticated users" ON teacher_student_messages;
    
    -- Create ONLY 2 clean policies with optimized auth
    CREATE POLICY "Users can manage their messages" ON teacher_student_messages
        FOR ALL USING (sender_id = (select auth.uid()) OR recipient_id = (select auth.uid()));
    
    CREATE POLICY "Teachers can message students" ON teacher_student_messages
        FOR INSERT WITH CHECK (
            sender_id = (select auth.uid()) AND
            recipient_id IN (
                SELECT student_id FROM teacher_student_connections 
                WHERE teacher_id = (select auth.uid())
            )
        );
END $$;

-- 8. ASSIGNMENT_SUBMISSIONS TABLE - Remove multiple duplicate policies
DO $$
BEGIN
    RAISE NOTICE 'Fixing assignment_submissions table - removing duplicate policies...';
    
    -- Drop ALL existing policies
    DROP POLICY IF EXISTS "Students can manage their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Teachers can view their assignment submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Students can view their own submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Students can insert their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Students can update their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Students can delete their submissions" ON assignment_submissions;
    DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON assignment_submissions;
    DROP POLICY IF EXISTS "Teachers can update submissions for their assignments" ON assignment_submissions;
    DROP POLICY IF EXISTS "Teachers can manage submissions for their assignments" ON assignment_submissions;
    DROP POLICY IF EXISTS "Enable select for authenticated users" ON assignment_submissions;
    
    -- Create ONLY 2 clean policies with optimized auth
    CREATE POLICY "Students can manage their submissions" ON assignment_submissions
        FOR ALL USING (student_id = (select auth.uid()));
    
    CREATE POLICY "Teachers can view assignment submissions" ON assignment_submissions
        FOR SELECT USING (
            assignment_id IN (
                SELECT id FROM assignments WHERE teacher_id = (select auth.uid())
            )
        );
END $$;

-- 9. Fix remaining auth.uid() optimization issues
DO $$
BEGIN
    RAISE NOTICE 'Fixing remaining auth.uid() optimization issues...';
    
    -- students_score table policies
    DROP POLICY IF EXISTS "Users can view their own scores" ON students_score;
    DROP POLICY IF EXISTS "Users can update their own scores" ON students_score;
    DROP POLICY IF EXISTS "Users can insert their own scores" ON students_score;
    CREATE POLICY "Users can manage their scores" ON students_score
        FOR ALL USING (student_id = (select auth.uid()));
    
    -- students_total_score table policies
    DROP POLICY IF EXISTS "Users can view their own total scores" ON students_total_score;
    DROP POLICY IF EXISTS "Users can update their own total scores" ON students_total_score;
    DROP POLICY IF EXISTS "Users can insert their own total scores" ON students_total_score;
    CREATE POLICY "Users can manage their total scores" ON students_total_score
        FOR ALL USING (student_id = (select auth.uid()));
    
    -- last_practiced_date table policies
    DROP POLICY IF EXISTS "Users can update their own practice date" ON last_practiced_date;
    DROP POLICY IF EXISTS "Users can view their own practice date" ON last_practiced_date;
    DROP POLICY IF EXISTS "Users can insert their own practice date" ON last_practiced_date;
    CREATE POLICY "Users can manage their practice date" ON last_practiced_date
        FOR ALL USING (student_id = (select auth.uid()));
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Final comprehensive performance fix completed!';
    RAISE NOTICE 'Removed massive duplicate policy problems and optimized auth patterns.';
    RAISE NOTICE 'This should dramatically reduce the warning count from 218.';
END $$; 