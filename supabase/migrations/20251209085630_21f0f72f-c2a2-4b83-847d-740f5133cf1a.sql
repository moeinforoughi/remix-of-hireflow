-- Add UPDATE policy on candidates table for Job Admins
CREATE POLICY "Job admins update candidates in their org" 
ON candidates
FOR UPDATE
USING (
  has_role(auth.uid(), 'job_admin'::app_role) 
  AND org_id = get_user_org(auth.uid())
);