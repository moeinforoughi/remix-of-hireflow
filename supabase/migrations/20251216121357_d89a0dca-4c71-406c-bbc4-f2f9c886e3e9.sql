-- Drop the vulnerable RLS policy that gives job_admin blanket access to all applications
DROP POLICY IF EXISTS "Users see applications for accessible jobs" ON public.applications;

-- Create the corrected RLS policy
-- Site admins see all applications in their org
-- All other users (job_admin, basic) must have explicit job_acl access
CREATE POLICY "Users see applications for accessible jobs" 
ON public.applications
FOR SELECT
USING (
  (has_role(auth.uid(), 'site_admin'::app_role) AND (EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = applications.job_id 
    AND jobs.org_id = get_user_org(auth.uid())
  )))
  OR 
  can_access_job(auth.uid(), job_id)
);