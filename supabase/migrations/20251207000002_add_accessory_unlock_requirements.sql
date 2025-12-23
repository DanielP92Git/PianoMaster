-- Add unlock requirements for accessories
-- Generated on 2025-12-07

begin;

-- Add unlock_requirement column to accessories table
alter table public.accessories
    add column if not exists unlock_requirement jsonb default null;

comment on column public.accessories.unlock_requirement is 'Requirements to unlock this accessory, e.g., {"type": "achievement", "id": "streak_7"} or {"type": "games_played", "count": 10}';

-- Example unlock requirement types:
-- {"type": "achievement", "id": "streak_7"} - Requires specific achievement
-- {"type": "games_played", "count": 10} - Requires X games played
-- {"type": "points_earned", "amount": 1000} - Requires X total points earned
-- {"type": "streak", "days": 7} - Requires X day streak
-- {"type": "perfect_games", "count": 3} - Requires X perfect scores
-- {"type": "level", "level": 5} - Requires player level X
-- null - No requirement, available immediately

commit;

