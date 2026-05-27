-- Drop existing policy and recreate with Job Admin org-level access
DROP POLICY IF EXISTS "Users see applications for accessible jobs" ON applications;

CREATE POLICY "Users see applications for accessible jobs" ON applications
FOR SELECT USING (
  -- Site admins see all in their org
  (has_role(auth.uid(), 'site_admin'::app_role) AND EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = applications.job_id 
    AND jobs.org_id = get_user_org(auth.uid())
  ))
  OR
  -- Job admins see all in their org
  (has_role(auth.uid(), 'job_admin'::app_role) AND EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = applications.job_id 
    AND jobs.org_id = get_user_org(auth.uid())
  ))
  OR
  -- Users with explicit job access via job_acl
  can_access_job(auth.uid(), job_id)
);