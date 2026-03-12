-- Enable RLS for drugs
alter table public.drugs enable row level security;

create policy "Users can view drugs of their pharmacy" on public.drugs
    for select using (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );

create policy "Users can insert drugs for their pharmacy" on public.drugs
    for insert with check (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );

create policy "Users can delete drugs for their pharmacy" on public.drugs
    for delete using (
        pharmacy_id in (
            select id from public.pharmacy_profile 
            where business_entity_id in (
                select id from public.business_entities where user_id = auth.uid()
            )
        )
    );

-- Enable RLS for drug_formulations
alter table public.drug_formulations enable row level security;

create policy "Users can view drug formulations of their pharmacy" on public.drug_formulations
    for select using (
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

create policy "Users can insert drug formulations for their pharmacy" on public.drug_formulations
    for insert with check (
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

create policy "Users can delete drug formulations for their pharmacy" on public.drug_formulations
    for delete using (
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
