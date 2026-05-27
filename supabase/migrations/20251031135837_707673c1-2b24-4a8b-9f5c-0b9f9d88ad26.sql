-- Drop the unique constraint that prevents multiple scorecards per user per interview
ALTER TABLE scorecards DROP CONSTRAINT IF EXISTS scorecards_interview_id_user_id_key;