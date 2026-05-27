-- Add SELECT policy for job_admin users to view candidates in their org
CREATE POLICY "Job admins can view candidates in their org"
ON public.candidates
FOR SELECT
TO authenticated
USING (
  org_id = get_user_org(auth.uid()) 
  AND has_role(auth.uid(), 'job_admin'::app_role)
);