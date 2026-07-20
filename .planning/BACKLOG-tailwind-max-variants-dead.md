---
status: backlog
origin: spotted during COPPA Tranche 1 (PR #18) — dev-server warning, then verified by production build
captured: 2026-07-21
severity: live defect (silent — no error, no test failure)
---

# BACKLOG — `max-*` Tailwind variants emit no CSS

`tailwind.config.js` disables the entire `max-*` / `min-*` variant family. **39 utility
classes across 9 files currently produce no CSS at all.** There is no error, no build
failure, and no test catches it — the classes are simply absent from the stylesheet.

## Root cause

`tailwind.config.js`, `theme.extend.screens`:

```js
screens: {
  short: { raw: "(max-height: 700px)" },
}
```

Tailwind refuses to generate `max-*`/`min-*` variants when **any** entry in `screens`
is an object. It says so on every dev-server start:

> warn - The `min-*` and `max-*` variants are not supported with a `screens`
> configuration containing objects.

The irony: `short:` itself works fine. Its mere presence breaks everything else.

## Verified, not assumed

Fresh `npm run build` on `main` + this branch, grepping the emitted CSS:

| Check                                      | Expected if healthy | Actual |
| ------------------------------------------ | ------------------- | ------ |
| `not all and` (how Tailwind emits `max-*`) | > 0                 | **0**  |
| `max-height: 700px` (the `short` variant)  | 1                   | 1 ✅   |
| `min-width: …px` breakpoints               | many                | 21 ✅  |

An earlier check against a stale worktree `dist/` appeared to confirm this but was
worthless — that build predated the files in question. The table above is from a
current build.

## Affected

39 occurrences: `max-[700px]:` ×21, `max-md:` ×13, `max-lg:` ×5.

```
src/components/games/shared/hud/topbar/GameTopBar.jsx
src/components/games/shared/hud/topbar/TopBarExitButton.jsx
src/components/games/shared/hud/topbar/TopBarIconButton.jsx
src/components/games/shared/hud/topbar/TopBarToolGroup.jsx
src/components/games/rhythm-games/renderers/CountSubdivisionQuestion.jsx
src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx
src/components/games/rhythm-games/renderers/VisualRecognitionQuestion.jsx
  + 2 co-located test files asserting on these classes
```

The 6 auth files using `short:` (`AuthShell`, `AuthSheet`, `LoginForm`, `SignupForm`,
`RoleSelection`, `ResetPasswordPage`) are **unaffected** — that variant works.

## Why this matters more than the count suggests

The documented fix for the "bare `landscape:` silently beats `lg:`" bug was to scope it
as **`max-lg:landscape:`**. That fix has never emitted a single byte of CSS. It was
applied in the `topbar/` files — which is exactly where `max-lg:` appears.

So the GameTopBar sizing bug that was investigated, fixed, and closed is **still live**,
and the same silent-failure mode that hid the original bug also hid the failure of its
fix. Any device-measurement pass on the top bar should be redone after this lands.

## Recommended fix

Move `short` out of `screens` and register it as a plugin variant, which is not subject
to the `screens` restriction:

```js
// tailwind.config.js
plugins: [
  plugin(({ addVariant }) => {
    addVariant("short", "@media (max-height: 700px)");
  }),
],
```

Then delete `extend.screens.short`. This keeps all 6 existing `short:` usages working
verbatim and restores the `max-*` family in one move.

Alternatives considered: replacing the 39 `max-*` usages with `min-*` equivalents
(inverts a lot of logic, touches 9 files, high regression risk), or dropping `short`
entirely (breaks the auth shell's short-phone handling).

## Definition of done

1. `npm run dev` starts with **no** Tailwind warning.
2. Fresh build's CSS contains `not all and` occurrences > 0.
3. `short:` still emits `max-height: 700px`.
4. Visual re-check of GameTopBar at `<1024px` landscape — the `max-lg:landscape:`
   sizing now actually applies, so heights will change from today's rendering. This is
   the point, but it means the top bar needs re-measuring, not just re-testing.
5. Consider a build-time guard so a future object in `screens` fails loudly.
