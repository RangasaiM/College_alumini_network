-- Disable email confirmations in auth.users
ALTER TABLE auth.users ALTER COLUMN email_confirmed_at SET DEFAULT NOW();

-- Update existing user's email confirmation
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'rangasaimangalagiri@gmail.com'; 