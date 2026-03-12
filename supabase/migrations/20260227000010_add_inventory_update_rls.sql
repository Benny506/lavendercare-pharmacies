drop policy if exists "Users can update manufacturers of their pharmacy" on public.manufacturers;
create policy "Users can update manufacturers of their pharmacy" on public.manufacturers
  for update
  using (
    pharmacy_id in (
      select id from public.pharmacy_profile
      where business_entity_id in (
        select id from public.business_entities where user_id = auth.uid()
      )
    )
  )
  with check (
    pharmacy_id in (
      select id from public.pharmacy_profile
      where business_entity_id in (
        select id from public.business_entities where user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can update suppliers of their pharmacy" on public.suppliers;
create policy "Users can update suppliers of their pharmacy" on public.suppliers
  for update
  using (
    pharmacy_id in (
      select id from public.pharmacy_profile
      where business_entity_id in (
        select id from public.business_entities where user_id = auth.uid()
      )
    )
  )
  with check (
    pharmacy_id in (
      select id from public.pharmacy_profile
      where business_entity_id in (
        select id from public.business_entities where user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can update drugs of their pharmacy" on public.drugs;
create policy "Users can update drugs of their pharmacy" on public.drugs
  for update
  using (
    pharmacy_id in (
      select id from public.pharmacy_profile
      where business_entity_id in (
        select id from public.business_entities where user_id = auth.uid()
      )
    )
  )
  with check (
    pharmacy_id in (
      select id from public.pharmacy_profile
      where business_entity_id in (
        select id from public.business_entities where user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can update drug formulations of their pharmacy" on public.drug_formulations;
create policy "Users can update drug formulations of their pharmacy" on public.drug_formulations
  for update
  using (
    drug_id in (
      select id from public.drugs
      where pharmacy_id in (
        select id from public.pharmacy_profile
        where business_entity_id in (
          select id from public.business_entities where user_id = auth.uid()
        )
      )
    )
  )
  with check (
    drug_id in (
      select id from public.drugs
      where pharmacy_id in (
        select id from public.pharmacy_profile
        where business_entity_id in (
          select id from public.business_entities where user_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "Users can update inventory batches of their pharmacy" on public.inventory_batches;
create policy "Users can update inventory batches of their pharmacy" on public.inventory_batches
  for update
  using (
    pharmacy_id in (
      select id from public.pharmacy_profile
      where business_entity_id in (
        select id from public.business_entities where user_id = auth.uid()
      )
    )
  )
  with check (
    pharmacy_id in (
      select id from public.pharmacy_profile
      where business_entity_id in (
        select id from public.business_entities where user_id = auth.uid()
      )
    )
  );
