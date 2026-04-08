---
phase: teacher-dashboard-review
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/teacher/AssignmentManagement.jsx
autonomous: true
gap_closure: true
source: TD-UAT.md
gaps: [16]
must_haves:
  truths:
    - "Each assignment card has an edit button (Pencil icon) in its action row"
    - "Clicking edit opens a modal pre-filled with the assignment's existing data"
    - "Saving edits calls updateAssignment API and refreshes the assignment list"
  artifacts:
    - path: "src/components/teacher/AssignmentManagement.jsx"
      provides: "Edit button, edit modal state, update mutation, dual-mode CreateAssignmentModal"
      contains: "handleEditAssignment"
  key_links:
    - from: "Pencil edit button onClick"
      to: "handleEditAssignment"
      via: "sets editingAssignment state and opens showEditModal"
    - from: "CreateAssignmentModal (edit mode)"
      to: "updateAssignmentMutation"
      via: "onUpdateAssignment prop calls handleUpdateAssignment which triggers mutation"
    - from: "updateAssignmentMutation"
      to: "updateAssignment API"
      via: "useMutation wrapping apiTeacher.updateAssignment"
---

<objective>
Add the missing Edit Assignment functionality (Test 16). The backend updateAssignment() already exists in apiTeacher.js but no edit UI was implemented.

Purpose: Teachers need to modify assignments after creation. The API exists but the UI was never wired up.
Output: Full edit flow — button, pre-filled modal, save via API, cache invalidation.
</objective>

<context>
@.planning/phases/teacher-dashboard-review/TD-UAT.md
@src/components/teacher/AssignmentManagement.jsx
@src/services/apiTeacher.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extend CreateAssignmentModal to support edit mode</name>
  <files>src/components/teacher/AssignmentManagement.jsx</files>
  <read_first>
    - src/components/teacher/AssignmentManagement.jsx (CreateAssignmentModal component, lines 35-170)
    - src/services/apiTeacher.js (updateAssignment function signature)
  </read_first>
  <action>
    Extend CreateAssignmentModal to serve as both create and edit modal:

    1. Add props: onUpdateAssignment (callback), assignment = null (existing assignment object for edit mode)

    2. Update the useEffect (isOpen dependency) to branch on assignment prop:
       - If assignment is truthy: pre-fill formData from assignment fields, mapping snake_case DB fields to camelCase form state:
         - assignment.title -> title
         - assignment.description -> description
         - assignment.instructions -> instructions
         - assignment.assignment_type -> assignmentType
         - assignment.due_date (split 'T' to get date part) -> dueDate
         - assignment.points_possible -> pointsPossible
         - assignment.assign_to -> assignTo
         - assignment.requirements?.* -> requirements.*
       - If assignment is falsy: reset to defaults (existing behavior)

    3. Update handleSubmit to dispatch correctly:
       - If assignment: call onUpdateAssignment(assignment.id, formData)
       - Else: call onCreateAssignment(formData)

    4. Update modal title: assignment ? "Edit Assignment" : "Create New Assignment"

    5. Update submit button text: assignment ? "Save Changes" : "Create Assignment"

  </action>
  <verify>
    <automated>grep -n "Edit Assignment" src/components/teacher/AssignmentManagement.jsx</automated>
  </verify>
  <acceptance_criteria>
    - grep "assignment ?" returns matches showing conditional create/edit branching
    - grep "onUpdateAssignment" returns matches in props and handleSubmit
    - grep "Edit Assignment" returns match in modal title conditional
    - grep "Save Changes" returns match in submit button conditional
  </acceptance_criteria>
  <done>CreateAssignmentModal supports both create mode (empty form) and edit mode (pre-filled from assignment prop)</done>
</task>

<task type="auto">
  <name>Task 2: Add edit button, state, mutation, and modal instance</name>
  <files>src/components/teacher/AssignmentManagement.jsx</files>
  <read_first>
    - src/components/teacher/AssignmentManagement.jsx (AssignmentManagement component, lines 562+)
    - src/services/apiTeacher.js (updateAssignment function)
  </read_first>
  <action>
    In the AssignmentManagement component:

    1. Add imports: Pencil from lucide-react, updateAssignment from apiTeacher.js

    2. Add state:
       - const [showEditModal, setShowEditModal] = useState(false);
       - const [editingAssignment, setEditingAssignment] = useState(null);

    3. Add update mutation:
       ```jsx
       const updateAssignmentMutation = useMutation({
         mutationFn: ({ assignmentId, updates }) => updateAssignment(assignmentId, updates),
         onSuccess: () => {
           queryClient.invalidateQueries({ queryKey: ["teacherAssignments"] });
           setShowEditModal(false);
           setEditingAssignment(null);
           toast.success("Assignment updated successfully!");
         },
         onError: (error) => {
           console.error("Update assignment error:", error);
           toast.error("Failed to update assignment. Please try again.");
         },
       });
       ```

    4. Add handlers:
       ```jsx
       const handleEditAssignment = (assignment) => {
         setEditingAssignment(assignment);
         setShowEditModal(true);
       };

       const handleUpdateAssignment = (assignmentId, formData) => {
         updateAssignmentMutation.mutate({
           assignmentId,
           updates: {
             title: formData.title,
             description: formData.description,
             instructions: formData.instructions,
             assignment_type: formData.assignmentType,
             due_date: formData.dueDate || null,
             points_possible: formData.pointsPossible,
             assign_to: formData.assignTo,
             requirements: formData.requirements,
           },
         });
       };
       ```

    5. Add Pencil edit button between Eye (view) and Trash2 (delete) in each assignment card's action row:
       ```jsx
       <button
         onClick={() => handleEditAssignment(assignment)}
         className="rounded-lg p-1 text-white/40 transition-colors hover:bg-yellow-500/20 hover:text-yellow-300"
         title="Edit"
       >
         <Pencil className="h-3.5 w-3.5" />
       </button>
       ```

    6. Add edit modal instance after existing modals:
       ```jsx
       <CreateAssignmentModal
         isOpen={showEditModal}
         onClose={() => { setShowEditModal(false); setEditingAssignment(null); }}
         onCreateAssignment={handleCreateAssignment}
         onUpdateAssignment={handleUpdateAssignment}
         isLoading={updateAssignmentMutation.isPending}
         students={students}
         assignment={editingAssignment}
       />
       ```

  </action>
  <verify>
    <automated>grep -c "handleEditAssignment\|handleUpdateAssignment\|updateAssignmentMutation\|Pencil\|showEditModal" src/components/teacher/AssignmentManagement.jsx</automated>
  </verify>
  <acceptance_criteria>
    - grep "Pencil" returns matches (import and JSX usage)
    - grep "handleEditAssignment" returns matches (handler definition and onClick usage)
    - grep "updateAssignmentMutation" returns matches (mutation definition and isPending usage)
    - grep "showEditModal" returns matches (state and modal isOpen binding)
    - Each assignment card shows 3 action buttons: Eye (view), Pencil (edit), Trash2 (delete)
  </acceptance_criteria>
  <done>Edit button visible on every assignment card, clicking it opens pre-filled modal, saving calls API and refreshes list</done>
</task>

</tasks>

<verification>
1. Navigate to /teacher and go to the Assignments tab
2. Confirm each assignment card shows three action buttons: view (eye), edit (pencil), delete (trash)
3. Click the edit (pencil) button — confirm modal opens with pre-filled data
4. Change title and description, click "Save Changes" — confirm success toast and list updates
5. Click "Create Assignment" — confirm create modal opens empty (not pre-filled)
6. npm run lint passes
</verification>

<success_criteria>

- Edit button (Pencil icon) visible on every assignment card
- Edit modal pre-fills from existing assignment data
- Save Changes calls updateAssignment API and refreshes the list
- Create Assignment flow still works independently
- No lint errors
  </success_criteria>
