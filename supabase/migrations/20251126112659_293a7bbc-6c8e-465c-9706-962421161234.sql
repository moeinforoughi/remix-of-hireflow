-- Add required_skills column to jobs table
ALTER TABLE jobs ADD COLUMN required_skills text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN jobs.required_skills IS 'Array of required skills for the job position';