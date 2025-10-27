-- Migration: Rename Notes Reading to Notes Master
-- Updates the games_categories table to reflect the new naming convention
-- From: "Notes Reading" / "notes-reading-mode"
-- To: "Notes Master" / "notes-master-mode"

-- Update the type column (URL path)
UPDATE games_categories 
SET type = 'notes-master-mode' 
WHERE type = 'notes-reading-mode';

-- Update the name column (display name)
UPDATE games_categories 
SET name = 'Notes Master' 
WHERE name = 'Notes Reading';

-- Update the description if it contains the old name
UPDATE games_categories 
SET description = REPLACE(description, 'Notes Reading', 'Notes Master')
WHERE description LIKE '%Notes Reading%';

-- Note: This migration ensures existing user data and progress is preserved
-- by only updating the category configuration, not user-specific data

