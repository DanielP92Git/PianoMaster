---
phase: quick-fix
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/games/sight-reading-game/components/SightReadingLayout.jsx
autonomous: true
requirements: [UI-FIX-01]
must_haves:
  truths:
    - "Feedback dock width matches the notation card max-w-5xl constraint"
    - "There is a visible gap between the notation card bottom edge and the feedback panel top edge"
    - "Horizontal padding on feedback dock matches the card container padding"
  artifacts:
    - path: "src/components/games/sight-reading-game/components/SightReadingLayout.jsx"
      provides: "Width-constrained and spaced feedback dock"
      contains: "max-w-5xl"
  key_links:
    - from: "SightReadingLayout feedback dock"
      to: "FeedbackSummary component"
      via: "bottomDockContent rendered inside width-constrained wrapper"
      pattern: "max-w-5xl.*bottomDockContent"
---

<objective>
Fix the Sight Reading feedback panel so its width matches the notation card and there is a visible gap between them.

Purpose: The feedback dock currently spans the full viewport width while the notation card is constrained to max-w-5xl. They also visually touch with no spacing. This creates a jarring layout mismatch.
Output: SightReadingLayout.jsx with width-matched, properly-spaced feedback dock.
</objective>

<execution_context>
@C:/Users/pagis/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/pagis/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/games/sight-reading-game/components/SightReadingLayout.jsx
@src/components/games/sight-reading-game/components/FeedbackSummary.jsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Constrain feedback dock width and add gap</name>
  <files>src/components/games/sight-reading-game/components/SightReadingLayout.jsx</files>
  <action>
In SightReadingLayout.jsx, modify the feedback dock section (the `hasDockedBottom` block starting around line 164):

1. **Width-constrain the feedback dock content.** The outer fixed container (line 166, `className="fixed inset-x-0 bottom-0 z-40"`) must remain full-width for proper fixed positioning. Inside it, add centering and a max-width wrapper:

   Change the inner content wrapper (currently line 183-189, `className="h-full w-full pb-[env(safe-area-inset-bottom)]"`) to:
   ```
   <div className="flex h-full items-center justify-center px-2 sm:px-0 landscape:px-4 pb-[env(safe-area-inset-bottom)]" style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}>
     <div className="h-full w-full max-w-5xl">
       {bottomDockContent}
     </div>
   </div>
   ```

   The `px-2 sm:px-0 landscape:px-4` matches the card's parent container padding (line 121). The `max-w-5xl` matches the card's own max-width (line 128). The `flex items-center justify-center` centers the constrained content.

2. **Add a gap between card and feedback dock.** In the `paddingBottom` style on the main content area (line 123-125), add 8px (0.5rem) of extra space so the card does not visually touch the feedback dock:

   Change from:
   ```
   paddingBottom: "calc(var(--sr-kb-height) + env(safe-area-inset-bottom))"
   ```
   To:
   ```
   paddingBottom: "calc(var(--sr-kb-height) + env(safe-area-inset-bottom) + 0.5rem)"
   ```

   This only applies when `hasDockedBottom` is true (both keyboard and feedback phases), so the extra 0.5rem gap is always appropriate when something is docked below.

Important: Do NOT modify the keyboard dock behavior -- the keyboard should also get the width constraint since it shares the same wrapper. This is fine because KlavierKeyboard already handles its own sizing internally. If there are visual issues with the keyboard being constrained, that is a separate concern.

Do NOT touch FeedbackSummary.jsx -- it already has `w-full` and `rounded-2xl bg-white/95` which will work correctly within the constrained wrapper.
  </action>
  <verify>
    <automated>cd "C:/Users/pagis/OneDrive/WebDev/Projects/MainPianoApp2/PianoApp2" && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>
    - Feedback dock inner content is constrained to max-w-5xl, centered horizontally with matching padding
    - 0.5rem gap exists between the notation card bottom and the feedback dock top
    - Build succeeds with no errors
  </done>
</task>

</tasks>

<verification>
1. `npm run build` succeeds
2. Visual check: open Sight Reading game, complete a pattern, confirm feedback panel width matches notation card width and there is a small gap between them
</verification>

<success_criteria>
- Feedback panel width matches notation card (both max-w-5xl)
- Visible gap between card bottom edge and feedback panel top edge
- No layout regression on mobile, landscape, or desktop viewports
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/1-fix-sight-reading-feedback-panel-spacing/1-SUMMARY.md`
</output>
