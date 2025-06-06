-- Update specific user to admin role
UPDATE users
SET role = 'admin',
    is_approved = true
WHERE email = 'rangasaimangalagiri@gmail.com';  -- Replace [YOUR-EMAIL] with the email you used to sign up 