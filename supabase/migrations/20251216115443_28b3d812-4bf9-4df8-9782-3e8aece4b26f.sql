-- Drop the overly permissive policy that allows job_admins to see all candidates in their org
DROP POLICY IF EXISTS "Job admins can view candidates in their org" ON public.candidates;

-- The existing "Job admins see candidates for their jobs" and "Users with job access see candidates" 
-- policies will correctly restrict access based on job_acl