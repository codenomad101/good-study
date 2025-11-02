-- Migration to add correctOption column to practice_questions table
-- Run this before importing the updated JSON data

-- Add the new column
ALTER TABLE practice_questions 
ADD COLUMN correct_option INTEGER;

-- Add a comment to explain the column
COMMENT ON COLUMN practice_questions.correct_option IS 'Numeric option ID (1, 2, 3, 4) for the correct answer';

-- Optional: Add a check constraint to ensure valid values
ALTER TABLE practice_questions 
ADD CONSTRAINT check_correct_option_range 
CHECK (correct_option IS NULL OR (correct_option >= 1 AND correct_option <= 4));

-- Show the updated table structure
\d practice_questions;
