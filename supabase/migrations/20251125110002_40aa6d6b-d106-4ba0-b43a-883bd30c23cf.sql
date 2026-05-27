-- Add new columns to jobs table for detailed job sections
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS salary_range text,
ADD COLUMN IF NOT EXISTS about_us text,
ADD COLUMN IF NOT EXISTS role_overview text,
ADD COLUMN IF NOT EXISTS what_you_will_do text,
ADD COLUMN IF NOT EXISTS nice_to_have text,
ADD COLUMN IF NOT EXISTS benefits text;