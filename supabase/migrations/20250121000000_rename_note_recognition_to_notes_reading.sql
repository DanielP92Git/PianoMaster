-- Migration: Rename Note Recognition to Notes Reading
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

-- Note: This migration ensures existing user data and progress is preserved
-- by only updating the category configuration, not user-specific data

