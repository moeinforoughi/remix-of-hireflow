-- Add policy for job_admin users to insert candidates in their org
CREATE POLICY "Job admins insert candidates in their org"
ON public.candidates
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = get_user_org(auth.uid()) 
  AND has_role(auth.uid(), 'job_admin'::app_role)
);