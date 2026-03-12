-- Create drug_formulation_images table
create table if not exists public.drug_formulation_images (
  id uuid primary key default gen_random_uuid(),
  formulation_id uuid not null references public.drug_formulations(id) on delete cascade,
  image_url text not null,
  created_at timestamptz default now()
);

-- Enable RLS on drug_formulation_images
alter table public.drug_formulation_images enable row level security;

-- Create policy for viewing drug_formulation_images (everyone in the pharmacy can view)
create policy "Users can view drug formulation images of their pharmacy" on public.drug_formulation_images
  for select using (
    formulation_id in (
      select id from public.drug_formulations
      where drug_id in (
        select id from public.drugs
        where pharmacy_id in (
          select id from public.pharmacy_profile
          where business_entity_id in (
            select id from public.business_entities where user_id = auth.uid()
          )
        )
      )
    )
  );

-- Create policy for creating drug_formulation_images
create policy "Users can create drug formulation images for their pharmacy" on public.drug_formulation_images
  for insert with check (
    formulation_id in (
      select id from public.drug_formulations
      where drug_id in (
        select id from public.drugs
        where pharmacy_id in (
          select id from public.pharmacy_profile
          where business_entity_id in (
            select id from public.business_entities where user_id = auth.uid()
          )
        )
      )
    )
  );

-- Create policy for deleting drug_formulation_images
create policy "Users can delete drug formulation images of their pharmacy" on public.drug_formulation_images
  for delete using (
    formulation_id in (
      select id from public.drug_formulations
      where drug_id in (
        select id from public.drugs
        where pharmacy_id in (
          select id from public.pharmacy_profile
          where business_entity_id in (
            select id from public.business_entities where user_id = auth.uid()
          )
        )
      )
    )
  );

-- Storage bucket setup
insert into storage.buckets (id, name, public)
values ('drug_images', 'drug_images', true)
on conflict (id) do nothing;

-- Storage policies
-- Allow authenticated users to upload files to 'drug_images' bucket
create policy "Authenticated users can upload drug images"
on storage.objects for insert
with check (
  bucket_id = 'drug_images' and
  auth.role() = 'authenticated'
);

-- Allow public access to view files in 'drug_images' bucket
create policy "Public access to view drug images"
on storage.objects for select
using ( bucket_id = 'drug_images' );

-- Allow authenticated users to delete files in 'drug_images' bucket
create policy "Authenticated users can delete drug images"
on storage.objects for delete
using (
  bucket_id = 'drug_images' and
  auth.role() = 'authenticated'
);
