# Database Migration: Note Recognition to Notes Reading

## Overview

This document describes the database migration required to complete the renaming from "Note Recognition" to "Notes Reading".

## Problem

After renaming the code files and routes, the application was still trying to navigate to `/note-recognition-mode` because the database `games_categories` table still contained the old values.

**Error encountered:**

```
No routes matched location "/note-recognition-mode"
```

## Solution

Created migration file: `supabase/migrations/20250121000000_rename_note_recognition_to_notes_reading.sql`

## Migration Details

### Table: `games_categories`

**Columns Updated:**

1. `type` - The URL path/identifier (e.g., "note-recognition-mode" → "notes-reading-mode")
2. `name` - The display name (e.g., "Note Recognition" → "Notes Reading")
3. `description` - Any descriptive text containing the old name

### SQL Changes

```sql
-- Update the type column (URL path)
UPDATE games_categories
SET type = 'notes-reading-mode'
WHERE type = 'note-recognition-mode';

-- Update the name column (display name)
UPDATE games_categories
SET name = 'Notes Reading'
WHERE name = 'Note Recognition';

-- Update the description if it contains the old name
UPDATE games_categories
SET description = REPLACE(description, 'Note Recognition', 'Notes Reading')
WHERE description LIKE '%Note Recognition%';
```

## How to Apply Migration

### Option 1: Supabase CLI (Recommended)

```bash
# Navigate to project root
cd C:\Users\pagis\OneDrive\WebDev\Projects\PianoApp2

# Apply pending migrations
npx supabase db push

# Or if using local development
npx supabase migration up
```

### Option 2: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL commands from the migration file manually

### Option 3: Direct SQL Execution

If you have direct database access, execute the SQL commands in the migration file directly against your database.

## Verification Steps

After applying the migration:

1. **Check Database:**

   ```sql
   SELECT type, name, description
   FROM games_categories
   WHERE type LIKE '%reading%' OR name LIKE '%Reading%';
   ```

2. **Test Application:**
   - Navigate to Practice Modes page
   - Click on "Notes Reading" card
   - Verify URL is `/notes-reading-mode`
   - Verify no console errors

3. **Check All Routes:**
   - `/notes-reading-mode` - Should load Notes Reading mode selection
   - `/notes-reading-mode/memory-game` - Should load Memory Game
   - `/notes-reading-mode/notes-reading-game` - Should load Notes Reading Game

## Impact on Existing Data

### ✅ Preserved

- User progress and scores
- Achievement data
- Practice session history
- User preferences

### ⚠️ Affected

- Game category type/name in `games_categories` table
- Any cached data in client applications (will refresh on next load)

### ❌ Breaking Changes

- Old URLs `/note-recognition-mode/*` will return 404
- Bookmarks using old URLs need updating
- External links need updating

## Rollback Plan

If you need to revert the changes:

```sql
-- Rollback: Revert to old naming
UPDATE games_categories
SET type = 'note-recognition-mode'
WHERE type = 'notes-reading-mode';

UPDATE games_categories
SET name = 'Note Recognition'
WHERE name = 'Notes Reading';

UPDATE games_categories
SET description = REPLACE(description, 'Notes Reading', 'Note Recognition')
WHERE description LIKE '%Notes Reading%';
```

## Related Code Changes

This migration completes the renaming that was done in the codebase:

- Component files renamed
- Routes updated in App.jsx
- Display text updated across all components
- URLs updated in navigation

See `NOTE_RECOGNITION_TO_NOTES_READING_RENAME.md` for full code changes.

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Database query confirms new values
- [ ] Practice Modes page loads without errors
- [ ] Notes Reading card displays correct name
- [ ] Clicking card navigates to correct URL
- [ ] All sub-routes work (memory-game, notes-reading-game)
- [ ] No console errors
- [ ] User progress still accessible
- [ ] Achievements display correctly

## Additional Considerations

### Future Database Updates

If you add new game modes, use the new naming convention:

- URL paths: kebab-case with descriptive names (e.g., "notes-reading-mode")
- Display names: Title Case with clear descriptions (e.g., "Notes Reading")

### API Caching

Some API responses might be cached. If issues persist after migration:

1. Clear browser cache
2. Check for service worker cache
3. Restart development server
4. Force refresh (Ctrl+Shift+R)

### Production Deployment

When deploying to production:

1. Apply migration during low-traffic period
2. Monitor error logs for 404s
3. Update any external documentation
4. Notify users if bookmarks need updating
5. Consider adding temporary redirects for old URLs

## Support for Old URLs (Optional)

If you want to maintain backwards compatibility, add redirect routes in `App.jsx`:

```jsx
// Add these routes for backwards compatibility
<Route
  path="/note-recognition-mode"
  element={<Navigate to="/notes-reading-mode" replace />}
/>
<Route
  path="/note-recognition-mode/memory-game"
  element={<Navigate to="/notes-reading-mode/memory-game" replace />}
/>
<Route
  path="/note-recognition-mode/note-recognition-game"
  element={<Navigate to="/notes-reading-mode/notes-reading-game" replace />}
/>
```

## Conclusion

This migration is required to complete the renaming from "Note Recognition" to "Notes Reading" and resolve the routing errors. Apply the migration file to update the database and test thoroughly.
