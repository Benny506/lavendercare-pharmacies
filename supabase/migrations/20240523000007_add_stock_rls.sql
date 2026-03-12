-- Enable RLS for inventory_batches
alter table public.inventory_batches enable row level security;

create policy "Users can view inventory batches of their pharmacy" on public.inventory_batches
    for select using (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );

create policy "Users can insert inventory batches for their pharmacy" on public.inventory_batches
    for insert with check (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );

create policy "Users can update inventory batches for their pharmacy" on public.inventory_batches
    for update using (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );

create policy "Users can delete inventory batches for their pharmacy" on public.inventory_batches
    for delete using (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );

-- Enable RLS for stock_movements
alter table public.stock_movements enable row level security;

create policy "Users can view stock movements of their pharmacy" on public.stock_movements
    for select using (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );

create policy "Users can insert stock movements for their pharmacy" on public.stock_movements
    for insert with check (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );
