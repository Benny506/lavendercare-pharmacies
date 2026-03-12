create or replace function public.register_pharmacy(
    p_pharmacy_name text,
    p_license_number text,
    p_email text,
    p_phone text,
    p_address text,
    p_city text,
    p_state text,
    p_zip_code text,
    p_owner_name text
)
returns json
language plpgsql
security definer
as $$
declare
    v_user_id uuid;
    v_business_entity_id uuid;
    v_profile_id uuid;
begin
    -- Get current user ID
    v_user_id := auth.uid();
    
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    -- Create business entity
    insert into public.business_entities (user_id, entity_type)
    values (v_user_id, 'pharmacy')
    returning id into v_business_entity_id;

    -- Create pharmacy profile
    insert into public.pharmacy_profile (
        business_entity_id,
        pharmacy_name,
        license_number,
        email,
        phone,
        address,
        city,
        state,
        zip_code,
        owner_name
    )
    values (
        v_business_entity_id,
        p_pharmacy_name,
        p_license_number,
        p_email,
        p_phone,
        p_address,
        p_city,
        p_state,
        p_zip_code,
        p_owner_name
    )
    returning id into v_profile_id;

    return json_build_object(
        'business_entity_id', v_business_entity_id,
        'profile_id', v_profile_id
    );
end;
$$;
