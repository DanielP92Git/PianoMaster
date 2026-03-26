# Quick Task 260326-wo7: Add note staff image and mini keyboard to TrailNodeModal - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Task Boundary

Add visual previews to TrailNodeModal for Discovery nodes (nodes with `focusNotes`). Show:
1. The existing SVG staff image of each focus note (from `TREBLE_NOTES`/`BASS_NOTES` ImageComponent)
2. A static mini keyboard highlighting which piano keys the student will learn

</domain>

<decisions>
## Implementation Decisions

### Visual Elements
- Show BOTH staff image AND mini keyboard for Discovery nodes
- Staff images use existing SVG assets from gameSettings.js (`TREBLE_NOTES`/`BASS_NOTES` with `ImageComponent`)
- Mini keyboard is a new static CSS/Tailwind component (~1 octave, div-based)

### Scope
- Only Discovery nodes (nodes with `focusNotes`) show the visual preview
- Practice, Speed, Boss, and other node types do NOT show the preview

### Keyboard Implementation
- Static CSS/Tailwind div-based keyboard (NOT KlavierKeyboard)
- Lightweight, no dependencies, matches dark modal theme
- ~1 octave with highlighted focus note keys
- Force `dir="ltr"` for RTL compatibility

</decisions>

<specifics>
## Specific Ideas

- Place the preview section between skills bubbles and progress/exercise sections in the modal
- Focus notes get bright category-colored highlights on the keyboard
- The octave displayed should be determined from the focusNotes pitches
- Modal uses dark theme: `bg-slate-800/95` with category-colored accents

</specifics>
