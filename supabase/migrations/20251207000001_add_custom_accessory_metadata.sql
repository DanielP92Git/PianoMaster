-- Add custom_metadata column to user_accessories for per-user positioning
-- Generated on 2025-12-07

begin;

alter table public.user_accessories
    add column if not exists custom_metadata jsonb default '{}'::jsonb;

comment on column public.user_accessories.custom_metadata is 'User-specific customization like position overrides (offsetX, offsetY)';

commit;

