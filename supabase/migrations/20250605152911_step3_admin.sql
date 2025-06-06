-- Step 3: Create admin user
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user's ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'rangasaimangalagiri@gmail.com';

    -- Insert the admin user if we found the ID
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.users (
            id,
            email,
            name,
            role,
            is_approved
        ) VALUES (
            v_user_id,
            'rangasaimangalagiri@gmail.com',
            'Ranga Sai',
            'admin',
            true
        ) ON CONFLICT (id) DO UPDATE 
        SET role = 'admin',
            is_approved = true;
    END IF;
END $$; 