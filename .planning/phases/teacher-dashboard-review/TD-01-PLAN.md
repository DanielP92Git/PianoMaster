---
phase: teacher-dashboard-review
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/layout/TeacherDashboard.jsx
  - src/components/charts/TopPerformersLeaderboard.jsx
autonomous: true
gap_closure: true
source: TD-UAT.md
gaps: [10, 11]
must_haves:
  truths:
    - "Delete confirmation modal student names are visible and readable on the dark modal background"
    - "Top performers leaderboard card text (names, values, labels) is visible on light backgrounds"
  artifacts:
    - path: "src/components/layout/TeacherDashboard.jsx"
      provides: "DeleteConfirmationModal with text-white wrapper for dark bg"
      contains: "text-white"
    - path: "src/components/charts/TopPerformersLeaderboard.jsx"
      provides: "Leaderboard cards with dark text on light backgrounds"
      contains: "text-gray-900"
  key_links:
    - from: "DeleteConfirmationModal"
      to: "Modal variant=default"
      via: "className text-white on wrapper div overrides Modal base text-gray-900"
---

<objective>
Fix two cosmetic text-visibility bugs where text is invisible due to color/background mismatches in the teacher dashboard.

Purpose: UAT Tests 10 and 11 reported invisible text — student names in the delete confirmation modal and all text in the top performers leaderboard cards.
Output: Readable text in both components.
</objective>

<context>
@.planning/phases/teacher-dashboard-review/TD-UAT.md
@src/components/layout/TeacherDashboard.jsx
@src/components/charts/TopPerformersLeaderboard.jsx
@src/components/ui/Modal.jsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix delete confirmation modal student name visibility</name>
  <files>src/components/layout/TeacherDashboard.jsx</files>
  <read_first>
    - src/components/layout/TeacherDashboard.jsx (DeleteConfirmationModal around line 880)
    - src/components/ui/Modal.jsx (variant styles — default uses bg-white/95 text-gray-900, but className prop can override bg)
  </read_first>
  <action>
    In the DeleteConfirmationModal component, the modal uses variant="default" which sets text-gray-900 as base color. When className="border-gray-600 bg-gray-900" overrides the background to dark, child elements inheriting text-gray-900 become invisible.

    Add className="text-white" to the wrapper div inside the modal (the first child div after the Modal opening tag) to ensure all child text inherits white color on the dark background.

    Change:
    ```jsx
    <div>
    ```
    To:
    ```jsx
    <div className="text-white">
    ```

  </action>
  <verify>
    <automated>grep -n "text-white" src/components/layout/TeacherDashboard.jsx | grep -i "div"</automated>
  </verify>
  <acceptance_criteria>
    - The wrapper div inside DeleteConfirmationModal contains className="text-white"
    - grep confirms text-white class on a div element in TeacherDashboard.jsx
  </acceptance_criteria>
  <done>Delete confirmation modal text (student names, labels, instructions) is visible on dark background</done>
</task>

<task type="auto">
  <name>Task 2: Fix top performers leaderboard text visibility</name>
  <files>src/components/charts/TopPerformersLeaderboard.jsx</files>
  <read_first>
    - src/components/charts/TopPerformersLeaderboard.jsx (full file — identify all text-white instances on light backgrounds)
  </read_first>
  <action>
    The TopPerformersLeaderboard renders cards on light backgrounds (bg-gradient-to-r from-yellow-50 to-orange-50 for top 3, bg-gray-50 for others) but uses text-white for all text. White text on near-white backgrounds is invisible.

    Replace throughout the component:
    - text-white -> text-gray-900 (for names, values, headings)
    - text-white/50 -> text-gray-500 (for labels, secondary text)

    Specific elements to fix:
    1. Student name: font-medium text-white -> font-medium text-gray-900
    2. Metric value: text-lg font-semibold text-white -> text-lg font-semibold text-gray-900
    3. Metric label: text-sm text-white/50 -> text-sm text-gray-500
    4. "Showing top 10" footer: text-white/50 -> text-gray-500
    5. Component title and any other text-white instances on the bg-white container

  </action>
  <verify>
    <automated>grep -c "text-white" src/components/charts/TopPerformersLeaderboard.jsx</automated>
  </verify>
  <acceptance_criteria>
    - grep "text-white" returns 0 matches in TopPerformersLeaderboard.jsx (all replaced with text-gray-*)
    - grep "text-gray-900" returns matches for name and value elements
    - grep "text-gray-500" returns matches for label and footer elements
  </acceptance_criteria>
  <done>Top performers leaderboard shows dark readable text on light card backgrounds</done>
</task>

</tasks>

<verification>
1. Navigate to /teacher as a teacher user
2. Select multiple students and click delete — confirm student names are visible in the confirmation modal
3. Switch to the Analytics tab — confirm top performers leaderboard shows readable text
4. npm run lint passes
</verification>

<success_criteria>

- Delete confirmation modal text is visible and readable
- Top performers leaderboard text is visible and readable
- No lint errors introduced
  </success_criteria>
