-- Check if increment_value column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'increment_value'
  ) THEN
    -- If the column doesn't exist but the old one does, rename it
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'challenges' AND column_name = 'increment_per_day'
    ) THEN
      -- Rename the column
      ALTER TABLE challenges RENAME COLUMN increment_per_day TO increment_value;
      RAISE NOTICE 'Column renamed from increment_per_day to increment_value';
    ELSE
      -- If neither column exists, create the new one
      ALTER TABLE challenges ADD COLUMN increment_value INT DEFAULT 1;
      RAISE NOTICE 'Created new column increment_value';
    END IF;
  ELSE
    RAISE NOTICE 'Column increment_value already exists';
  END IF;
END
$$; 