
-- Add RLS policies for pharmacy_profile to allow users to view their own profile
-- This is required for other RLS policies (like inventory_batches) that reference pharmacy_profile

-- Drop existing policy if it exists to avoid conflicts
drop policy if exists "Users can view their own pharmacy profile" on public.pharmacy_profile;

create policy "Users can view their own pharmacy profile" on public.pharmacy_profile
  for select using (
    business_entity_id in (
      select id from public.business_entities where user_id = auth.uid()
    )
  );

-- Also ensure business_entities has a policy if it has RLS enabled
-- We'll assume business_entities might be in another schema or managed elsewhere, 
-- but if it's in public and has RLS, it needs a policy.
-- Safely attempt to create a policy for business_entities if it exists in public
do $$
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'business_entities') then
    -- Enable RLS just in case
    alter table public.business_entities enable row level security;
    
    -- Drop existing policy
    drop policy if exists "Users can view their own business entity" on public.business_entities;
    
    -- Create policy
    create policy "Users can view their own business entity" on public.business_entities
      for select using (
        user_id = auth.uid()
      );
  end if;
end
$$;
