-- Add DELETE policy on applications table for Job Admins
CREATE POLICY "Job admins delete applications in their org" 
ON applications
FOR DELETE
USING (
  has_role(auth.uid(), 'job_admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = applications.job_id 
    AND jobs.org_id = get_user_org(auth.uid())
  )
);

-- Add DELETE policy on candidates table for Job Admins
CREATE POLICY "Job admins delete candidates in their org" 
ON candidates
FOR DELETE
USING (
  has_role(auth.uid(), 'job_admin'::app_role) 
  AND org_id = get_user_org(auth.uid())
);