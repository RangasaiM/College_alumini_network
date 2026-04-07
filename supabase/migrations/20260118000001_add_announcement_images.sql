ALTER TABLE announcements ADD COLUMN IF NOT EXISTS images TEXT[];

-- Verify the column was added
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'images') THEN
        RAISE EXCEPTION 'Column images was not added';
    END IF;
END $$;
