---
phase: teacher-dashboard-review
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/teacher/AssignmentManagement.jsx
autonomous: true
gap_closure: true
source: TD-UAT.md
gaps: [15]
must_haves:
  truths:
    - "Create Assignment form retains all entered data while the user is filling it out"
    - "Form only resets when the modal opens fresh (isOpen transitions false to true)"
  artifacts:
    - path: "src/components/teacher/AssignmentManagement.jsx"
      provides: "CreateAssignmentModal with stable useEffect dependency"
      contains: "eslint-disable-next-line react-hooks/exhaustive-deps"
  key_links:
    - from: "CreateAssignmentModal useEffect"
      to: "isOpen prop"
      via: "dependency array contains only [isOpen], not [isOpen, students]"
---

<objective>
Fix the major bug where the Create Assignment form resets while the user is filling it out (Test 15).

Purpose: The students array in the useEffect dependency causes form state to reset every 2 minutes when TeacherDashboard refetches students. Removing it from the dependency array prevents unwanted resets.
Output: Stable form that only resets on modal open, not on background data refetch.
</objective>

<context>
@.planning/phases/teacher-dashboard-review/TD-UAT.md
@src/components/teacher/AssignmentManagement.jsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove students from useEffect dependency array</name>
  <files>src/components/teacher/AssignmentManagement.jsx</files>
  <read_first>
    - src/components/teacher/AssignmentManagement.jsx (CreateAssignmentModal useEffect around line 62-102)
  </read_first>
  <action>
    In CreateAssignmentModal, the useEffect that resets form state has students in its dependency array. The parent TeacherDashboard refetches students every 2 minutes (refetchInterval: 120000), producing a new array reference that triggers this useEffect and resets the form.

    The students prop is only used in the JSX select dropdown to populate "Assign to Student" options. It does NOT affect form initialization — the default assignTo is always "all". The form reset should only fire when isOpen transitions from false to true.

    Change the dependency array from:
    ```jsx
    }, [isOpen, students]);
    ```
    To:
    ```jsx
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);
    ```

    The eslint-disable comment documents that students is intentionally omitted — it is not needed for form initialization logic.

  </action>
  <verify>
    <automated>grep -A1 "eslint-disable-next-line react-hooks/exhaustive-deps" src/components/teacher/AssignmentManagement.jsx | grep "isOpen"</automated>
  </verify>
  <acceptance_criteria>
    - useEffect dependency array is [isOpen] only (no students)
    - eslint-disable-next-line comment is present on the line before the dependency array
    - npm run lint passes without errors
  </acceptance_criteria>
  <done>Create Assignment form retains all entered data during the 2+ minute refetch interval — no unwanted resets</done>
</task>

</tasks>

<verification>
1. Navigate to /teacher and go to the Assignments tab
2. Click "Create Assignment" to open the modal
3. Start filling in the form (title, description, type, etc.)
4. Wait at least 2.5 minutes without submitting
5. Confirm the form retains all entered data — no fields reset
6. Submit the assignment — confirm it creates successfully
7. npm run lint passes
</verification>

<success_criteria>

- Form data persists while user is typing, even across background student refetches
- Form only resets when modal opens fresh
- No lint errors
  </success_criteria>
