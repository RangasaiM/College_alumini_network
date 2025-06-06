-- Reset password for admin user
UPDATE auth.users
SET encrypted_password = crypt('Admin@123', gen_salt('bf'))
WHERE email = 'rangasaimangalagiri@gmail.com';

-- Ensure email is confirmed
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmation_sent_at = NOW(),
    is_sso_user = false,
    raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    raw_user_meta_data = '{}'::jsonb
WHERE email = 'rangasaimangalagiri@gmail.com';

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public; 