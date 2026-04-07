ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number TEXT;

-- Verify the column was added
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mobile_number') THEN
        RAISE EXCEPTION 'Column mobile_number was not added';
    END IF;
END $$;
