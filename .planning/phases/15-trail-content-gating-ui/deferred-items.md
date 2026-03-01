---
phase: 15-trail-content-gating-ui
discovered: 2026-03-01
---

# Deferred Items — Phase 15 Trail Content Gating UI

## Out-of-scope discoveries not fixed in this phase

### [PRE-EXISTING] Trail modal "Skills You'll Learn" shows raw note IDs in Hebrew

- **Discovered during:** Task 1 human-verify checkpoint (user observation)
- **Issue:** In Hebrew locale, the skills badges in TrailNodeModal still show `C4`, `D4`, `E4` etc. instead of the Hebrew note names `דו`, `רה`, `מי`
- **Why deferred:** Pre-existing i18n gap, not introduced by this plan. Fix requires a separate i18n pass mapping raw note keys to the `trail:noteNames` locale entries.
- **Relevant file:** `src/components/trail/TrailNodeModal.jsx` — skills badge section (line ~332), `node.skills` array contains raw note strings like `C4`
- **Suggested fix:** Apply `translateNodeName`-style mapping for skill badge labels, or translate note names at the data layer before they reach the component.
