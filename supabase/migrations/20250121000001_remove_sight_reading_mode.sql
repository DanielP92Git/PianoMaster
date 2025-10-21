-- Migration: Remove Sight Reading Challenge mode
-- This mode has no games yet, so we're removing it from the categories

-- Delete the sight reading mode from games_categories
DELETE FROM games_categories 
WHERE type = 'sight-reading-mode' 
   OR type = 'sight-reading'
   OR name LIKE '%Sight Reading%';

-- Note: This will not affect any historical data if users somehow accessed this mode
-- It only removes it from the available game modes list

