-- Add accessories tables to support avatar customization
-- Generated on 2025-12-06

begin;

create table if not exists public.accessories (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    slug text generated always as (
        regexp_replace(lower(name), '[^a-z0-9]+', '_', 'g')
    ) stored,
    category text not null check (category in ('hat', 'headgear', 'eyes', 'face', 'body', 'background', 'other')),
    image_url text not null,
    price_points integer not null check (price_points >= 0),
    unlock_level integer check (unlock_level >= 0),
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
);

comment on table public.accessories is 'Catalog of purchasable avatar accessories';
comment on column public.accessories.metadata is 'Optional arbitrary data such as rarity, animation, etc.';

create unique index if not exists accessories_slug_key on public.accessories(slug);

create table if not exists public.user_accessories (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references public.students(id) on delete cascade,
    accessory_id uuid not null references public.accessories(id) on delete cascade,
    slot text not null default 'auto',
    is_equipped boolean not null default false,
    purchased_at timestamptz not null default now(),
    equipped_at timestamptz,
    constraint user_accessories_user_accessory_key unique (user_id, accessory_id)
);

comment on table public.user_accessories is 'Join table tracking which accessories a student owns';

create index if not exists user_accessories_user_id_idx on public.user_accessories(user_id);
create index if not exists user_accessories_accessory_id_idx on public.user_accessories(accessory_id);
create index if not exists user_accessories_equipped_idx on public.user_accessories(user_id, is_equipped);

alter table public.students
    add column if not exists equipped_accessories jsonb not null default '[]'::jsonb;

comment on column public.students.equipped_accessories is 'Client-side cache of equipped accessory slots for faster reads.';

create table if not exists public.student_point_transactions (
    id uuid default gen_random_uuid() primary key,
    student_id uuid not null references public.students(id) on delete cascade,
    delta integer not null,
    reason text,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists student_point_transactions_student_id_idx
    on public.student_point_transactions(student_id);

comment on table public.student_point_transactions is 'Ledger of point earnings/spending; negative delta represents spending.';

commit;

