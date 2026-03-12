-- Add is_visible column to drug_formulations table
alter table public.drug_formulations 
add column if not exists is_visible boolean default true;

-- Update RLS policies to allow update of is_visible
-- The existing update policy for drug_formulations should already cover this, 
-- but we verify it applies to all columns including the new one.
-- Policy: "Users can update drug formulations of their pharmacy"

-- No new policy needed if the existing one is:
-- create policy "Users can update drug formulations of their pharmacy" on public.drug_formulations for update ...
