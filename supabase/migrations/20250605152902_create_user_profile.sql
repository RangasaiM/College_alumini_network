-- First, check if user already exists to avoid duplicates
DO $$
DECLARE
    auth_uid UUID;
BEGIN
    -- Get the auth.uid for the email
    SELECT id INTO auth_uid
    FROM auth.users
    WHERE email = 'rangasaimangalagiri@gmail.com';

    -- Only insert if user doesn't exist in public.users
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth_uid
    ) THEN
        -- Insert the user profile
        INSERT INTO public.users (
            id,
            email,
            name,
            role,
            is_approved,
            created_at
        ) VALUES (
            auth_uid,
            'rangasaimangalagiri@gmail.com',
            'Ranga Sai',  -- You can change this name if needed
            'admin',      -- Setting as admin as per previous requirement
            true,        -- Auto-approving since this is an admin account
            NOW()
        );
    END IF;
END $$; 