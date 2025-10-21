# Manual Database Migration Instructions

## Issue

The automated `npx supabase db push` command is failing because there's a conflicting migration for user_preferences that already exists in the database.

## Solution: Apply the Migration Manually

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your PianoApp2 project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Migration SQL

Copy and paste this SQL into the SQL Editor and click "Run":

```sql
-- Migration 1: Rename Note Recognition to Notes Reading
-- Updates the games_categories table to reflect the new naming convention

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

-- Migration 2: Remove Sight Reading Challenge mode
-- This mode has no games yet, so we're removing it from the categories

DELETE FROM games_categories
WHERE type = 'sight-reading-mode'
   OR type = 'sight-reading'
   OR name LIKE '%Sight Reading%';
```

### Step 3: Verify the Changes

After running the migration, verify it worked by running this query:

```sql
-- Check all game categories
SELECT id, type, name, description
FROM games_categories
ORDER BY name;
```

You should see:

- **Notes Reading**:
  - `type`: `notes-reading-mode`
  - `name`: `Notes Reading`
- **Rhythm Master**:
  - `type`: `rhythm-mode`
  - `name`: `Rhythm Master`
- **Sight Reading Challenge should NOT appear** (it's been removed)

### Step 4: Test the Application

1. Refresh your application (F5 or Ctrl+R)
2. Navigate to Practice Modes page
3. You should see **only 2 cards**:
   - **Rhythm Master**
   - **Notes Reading** (renamed from "Note Recognition")
4. The "Sight Reading Challenge" card should be gone
5. Click the "Notes Reading" card - it should navigate to `/notes-reading-mode` without errors

### Alternative: Using psql (if you have direct database access)

If you have `psql` installed and database credentials:

```bash
psql "postgresql://username:password@your-project-ref.supabase.co:5432/postgres" -c "
UPDATE games_categories SET type = 'notes-reading-mode' WHERE type = 'note-recognition-mode';
UPDATE games_categories SET name = 'Notes Reading' WHERE name = 'Note Recognition';
UPDATE games_categories SET description = REPLACE(description, 'Note Recognition', 'Notes Reading') WHERE description LIKE '%Note Recognition%';
"
```

## Expected Result

After applying the migration:

- ✅ No more "No routes matched location" errors
- ✅ Card displays "Notes Reading" instead of "Note Recognition"
- ✅ URL changes to `/notes-reading-mode`
- ✅ All sub-routes work correctly

## If Something Goes Wrong

To rollback the changes, run:

```sql
UPDATE games_categories SET type = 'note-recognition-mode' WHERE type = 'notes-reading-mode';
UPDATE games_categories SET name = 'Note Recognition' WHERE name = 'Notes Reading';
UPDATE games_categories SET description = REPLACE(description, 'Notes Reading', 'Note Recognition') WHERE description LIKE '%Notes Reading%';
```

## Note About the Migration File

The migration file exists at:
`supabase/migrations/20250121000000_rename_note_recognition_to_notes_reading.sql`

While we couldn't apply it automatically due to a conflict with an older migration, the SQL inside is correct and can be run manually as shown above.
