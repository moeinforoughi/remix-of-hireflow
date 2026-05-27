-- Allow job_admins with job access to update job status
CREATE POLICY "Job admins can update accessible jobs"
ON public.jobs
FOR UPDATE
USING (
  has_role(auth.uid(), 'job_admin'::app_role) 
  AND can_access_job(auth.uid(), id)
  AND org_id = get_user_org(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'job_admin'::app_role) 
  AND can_access_job(auth.uid(), id)
  AND org_id = get_user_org(auth.uid())
);