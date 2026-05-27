-- Add 'no_show' status to interview_status enum
ALTER TYPE interview_status ADD VALUE IF NOT EXISTS 'no_show';