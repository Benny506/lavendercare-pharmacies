-- Fix RLS policies for suppliers table
-- Drop existing policies if any (to be safe, though none were explicitly created for suppliers in the previous migration snippet, only manufacturers)
drop policy if exists "Users can view suppliers of their pharmacy" on public.suppliers;
drop policy if exists "Users can insert suppliers for their pharmacy" on public.suppliers;
drop policy if exists "Users can delete suppliers for their pharmacy" on public.suppliers;

-- Create policy for viewing suppliers
create policy "Users can view suppliers of their pharmacy" on public.suppliers
    for select using (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );

-- Create policy for inserting suppliers
create policy "Users can insert suppliers for their pharmacy" on public.suppliers
    for insert with check (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );

-- Create policy for deleting suppliers
create policy "Users can delete suppliers for their pharmacy" on public.suppliers
    for delete using (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );
