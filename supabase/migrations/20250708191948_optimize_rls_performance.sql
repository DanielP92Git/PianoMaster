-- Comprehensive RLS Performance Optimization
-- Fixes auth initialization plan issues and consolidates multiple permissive policies

BEGIN;

-- ===================================
-- FIX AUTH RLS INITIALIZATION PLAN ISSUES
-- Replace auth.uid() with (select auth.uid()) for better performance
-- ===================================

DO $$
BEGIN
    RAISE NOTICE 'Starting RLS performance optimization...';
    
    -- Drop existing policies that have performance issues
    DROP POLICY IF EXISTS "Students can update their own enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Students can view their own enrollments" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can manage enrollments for their classes" ON class_enrollments;
    DROP POLICY IF EXISTS "Teachers can manage their own classes" ON classes;
    DROP POLICY IF EXISTS "Teachers can send notifications to connected students" ON notifications;
    DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Consolidated notifications access" ON notifications;
    DROP POLICY IF EXISTS "Unified teacher student connections access" ON teacher_student_connections;
    
    RAISE NOTICE 'Dropped existing policies with performance issues';
    
END $$;

-- ===================================
-- CLASS_ENROLLMENTS TABLE - CONSOLIDATED POLICIES
-- ===================================

-- Single consolidated policy for class_enrollments SELECT and UPDATE
CREATE POLICY "Consolidated class enrollments access" ON class_enrollments
FOR ALL USING (
    -- Students can access their own enrollments
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can access enrollments for their classes
    EXISTS (
        SELECT 1 FROM classes c 
        WHERE c.id = class_enrollments.class_id 
        AND c.teacher_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    -- Students can update their own enrollments
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can manage enrollments for their classes
    EXISTS (
        SELECT 1 FROM classes c 
        WHERE c.id = class_enrollments.class_id 
        AND c.teacher_id = (SELECT auth.uid())
    )
);

-- ===================================
-- CLASSES TABLE - OPTIMIZED POLICY
-- ===================================

-- Optimized policy for classes table
CREATE POLICY "Teachers can manage their own classes optimized" ON classes
FOR ALL USING (
    teacher_id = (SELECT auth.uid())
)
WITH CHECK (
    teacher_id = (SELECT auth.uid())
);

-- ===================================
-- NOTIFICATIONS TABLE - CONSOLIDATED POLICIES
-- ===================================

-- Single comprehensive policy for all notifications operations
CREATE POLICY "Consolidated notifications access optimized" ON notifications
FOR ALL USING (
    -- Users can access notifications they sent or received
    recipient_id = (SELECT auth.uid()) OR sender_id = (SELECT auth.uid())
)
WITH CHECK (
    -- Users can manage their own notifications (as recipients)
    recipient_id = (SELECT auth.uid())
    OR
    -- Teachers can send notifications to their connected students
    (
        sender_id = (SELECT auth.uid()) AND (
            -- Allow if sender is teacher and recipient is their connected student
            EXISTS (
                SELECT 1 FROM teacher_student_connections tsc 
                WHERE tsc.teacher_id = (SELECT auth.uid())
                AND tsc.student_id = recipient_id 
                AND tsc.status = 'accepted'
            )
            OR
            -- Allow if sender is teacher and recipient is in their class
            EXISTS (
                SELECT 1 FROM classes c
                JOIN class_enrollments ce ON c.id = ce.class_id
                WHERE c.teacher_id = (SELECT auth.uid())
                AND ce.student_id = recipient_id
                AND ce.status = 'active'
            )
        )
    )
);

-- ===================================
-- TEACHER_STUDENT_CONNECTIONS TABLE - OPTIMIZED POLICY
-- ===================================

-- Optimized policy for teacher_student_connections
CREATE POLICY "Unified teacher student connections access optimized" ON teacher_student_connections
FOR ALL USING (
    -- Teachers can access connections where they are the teacher
    teacher_id = (SELECT auth.uid())
    OR
    -- Students can access connections where they are the student
    student_id = (SELECT auth.uid())
)
WITH CHECK (
    -- Teachers can create/update connections where they are the teacher
    teacher_id = (SELECT auth.uid())
    OR
    -- Students can update connections where they are the student
    student_id = (SELECT auth.uid())
);

-- ===================================
-- VERIFICATION AND CLEANUP
-- ===================================

DO $$
BEGIN
    -- Verify that policies were created successfully
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'class_enrollments' 
        AND policyname = 'Consolidated class enrollments access'
    ) THEN
        RAISE EXCEPTION 'Failed to create consolidated class_enrollments policy';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications' 
        AND policyname = 'Consolidated notifications access optimized'
    ) THEN
        RAISE EXCEPTION 'Failed to create consolidated notifications policy';
    END IF;
    
    RAISE NOTICE 'All RLS policies optimized successfully!';
    RAISE NOTICE 'Performance improvements:';
    RAISE NOTICE '- Fixed auth.uid() calls with (select auth.uid()) for better caching';
    RAISE NOTICE '- Consolidated multiple permissive policies into single policies';
    RAISE NOTICE '- Reduced policy execution overhead for all affected tables';
    
END $$;

COMMIT; 