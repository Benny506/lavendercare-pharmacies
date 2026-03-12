create or replace function public.reset_password_via_otp(
    p_email text,
    p_otp text,
    p_new_password text
)
returns boolean
language plpgsql
security definer
as $$
declare
    v_user_id uuid;
    v_valid boolean;
begin
    -- 1. Validate OTP again (security measure)
    select public.validate_otp(p_email, p_otp) into v_valid;
    
    if v_valid is false then
        raise exception 'Invalid or expired OTP';
    end if;

    -- 2. Get User ID
    select id into v_user_id from auth.users where email = p_email;
    
    if v_user_id is null then
        raise exception 'User not found';
    end if;

    -- 3. Update Password
    update auth.users
    set encrypted_password = crypt(p_new_password, gen_salt('bf'))
    where id = v_user_id;

    -- 4. Delete OTP to prevent reuse
    delete from public.otps where email = p_email;

    return true;
end;
$$;
