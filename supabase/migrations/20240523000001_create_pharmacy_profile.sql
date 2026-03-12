create table if not exists public.pharmacy_profile (
    id uuid not null default gen_random_uuid(),
    business_entity_id uuid not null references public.business_entities(id) on delete cascade,
    pharmacy_name text not null,
    license_number text not null,
    email text not null,
    phone text not null,
    address text not null,
    city text not null,
    state text not null,
    zip_code text not null,
    owner_name text not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    primary key (id),
    unique (business_entity_id)
);

-- Enable RLS
alter table public.pharmacy_profile enable row level security;

-- Policies can be added later as needed, but for now we create the structure.
