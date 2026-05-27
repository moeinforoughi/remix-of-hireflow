-- Drop the existing UPDATE policy for job admins
DROP POLICY IF EXISTS "Job admins move pipeline" ON public.applications;

-- Create new UPDATE policy that allows job_admins to update applications in their org
CREATE POLICY "Job admins move pipeline" 
ON public.applications 
FOR UPDATE 
USING (
  (has_role(auth.uid(), 'job_admin'::app_role) AND EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = applications.job_id 
    AND jobs.org_id = get_user_org(auth.uid())
  ))
  OR 
  (EXISTS (
    SELECT 1 FROM job_acl 
    WHERE job_acl.job_id = applications.job_id 
    AND job_acl.user_id = auth.uid() 
    AND job_acl.can_move_pipeline = true
  ))
);