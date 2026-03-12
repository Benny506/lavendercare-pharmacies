-- Create manufacturers table
create table public.manufacturers (
    id uuid not null default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacy_profile(id) on delete cascade, -- Pharmacy-specific manufacturers
    name text not null,
    contact_info text,
    created_at timestamptz not null default now(),
    primary key (id)
);

-- Create suppliers table
create table public.suppliers (
    id uuid not null default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacy_profile(id) on delete cascade, -- Pharmacy-specific suppliers
    name text not null,
    contact_info text,
    created_at timestamptz not null default now(),
    primary key (id)
);

-- Create drugs table
create table public.drugs (
    id uuid not null default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacy_profile(id) on delete cascade, -- Pharmacy-specific drugs
    manufacturer_id uuid references public.manufacturers(id) on delete restrict,
    name text not null,
    generic_name text,
    description text,
    created_at timestamptz not null default now(),
    primary key (id)
);

-- Create drug_formulations table
create table public.drug_formulations (
    id uuid not null default gen_random_uuid(),
    drug_id uuid not null references public.drugs(id) on delete cascade, -- Cascade delete formulation if drug is deleted
    strength text, -- e.g. 500mg
    form text, -- e.g. Tablet, Syrup
    created_at timestamptz not null default now(),
    primary key (id)
);

-- Create inventory_batches table
create table public.inventory_batches (
    id uuid not null default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacy_profile(id) on delete cascade, -- Inventory belongs to a pharmacy
    formulation_id uuid not null references public.drug_formulations(id) on delete restrict,
    supplier_id uuid references public.suppliers(id) on delete restrict,
    batch_number text not null,
    expiry_date date not null,
    quantity_initial integer not null default 0,
    quantity_remaining integer not null default 0,
    unit_price numeric(10, 2) not null default 0,
    created_at timestamptz not null default now(),
    primary key (id),
    constraint quantity_non_negative check (quantity_remaining >= 0),
    constraint unique_batch_formulation unique (batch_number, formulation_id)
);

-- Create stock_movements table
create table public.stock_movements (
    id uuid not null default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacy_profile(id) on delete cascade, -- Movement happens in a pharmacy
    batch_id uuid not null references public.inventory_batches(id) on delete restrict,
    movement_type text not null, -- e.g. 'IN', 'OUT', 'ADJUSTMENT'
    quantity integer not null, -- Can be negative for OUT
    reason text,
    created_at timestamptz not null default now(),
    primary key (id)
);

-- Create indexes
create index idx_manufacturers_pharmacy on public.manufacturers(pharmacy_id);
create index idx_suppliers_pharmacy on public.suppliers(pharmacy_id);
create index idx_drugs_pharmacy on public.drugs(pharmacy_id);
create index idx_drugs_manufacturer on public.drugs(manufacturer_id);
create index idx_drug_formulations_drug on public.drug_formulations(drug_id);
create index idx_inventory_batches_pharmacy on public.inventory_batches(pharmacy_id);
create index idx_inventory_batches_formulation on public.inventory_batches(formulation_id);
create index idx_inventory_batches_expiry on public.inventory_batches(expiry_date);
create index idx_stock_movements_pharmacy on public.stock_movements(pharmacy_id);
create index idx_stock_movements_batch on public.stock_movements(batch_id);

-- Enable Row Level Security (RLS) on all tables
alter table public.manufacturers enable row level security;
alter table public.suppliers enable row level security;
alter table public.drugs enable row level security;
alter table public.drug_formulations enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.stock_movements enable row level security;

-- Create generic RLS policies assuming auth.uid() maps to a user who belongs to a pharmacy via pharmacy_profile
-- Note: This is a placeholder policy pattern. In a real app, we'd check if auth.uid() is associated with the pharmacy_id.
-- For now, we'll allow authenticated users to view/modify data if they belong to the pharmacy (simplified).

-- Policy for manufacturers
create policy "Users can view manufacturers of their pharmacy" on public.manufacturers
    for select using (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );

create policy "Users can insert manufacturers for their pharmacy" on public.manufacturers
    for insert with check (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );

-- (Repeat similar policies for other tables or use a helper function in future)
-- For brevity in this migration, we'll focus on the schema creation as requested.
