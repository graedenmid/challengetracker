-- Add metadata column to challenges table to store goal-specific settings
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Update type and frequency columns in challenges table to accept new values
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_type_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_type_check 
    CHECK (type IN ('HABIT', 'GOAL', 'CHALLENGE'));

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_frequency_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_frequency_check 
    CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'NONE'));

COMMENT ON COLUMN challenges.metadata IS 'JSON field to store extra properties like goal tasks, split goal settings, etc.'; 