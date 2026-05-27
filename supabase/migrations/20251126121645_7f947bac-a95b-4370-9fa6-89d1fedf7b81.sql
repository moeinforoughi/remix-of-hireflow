-- 1. Job admins can insert candidates in their org
CREATE POLICY "Job admins insert candidates"
ON public.candidates
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'job_admin'::app_role) 
  AND org_id = get_user_org(auth.uid())
);

-- 2. Job admins can insert applications for jobs they have access to
CREATE POLICY "Job admins insert applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'job_admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM job_acl
    WHERE job_acl.job_id = applications.job_id
    AND job_acl.user_id = auth.uid()
    AND job_acl.can_view = true
  )
);

-- 3. Job admins can create jobs in their org
CREATE POLICY "Job admins insert jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'job_admin'::app_role) 
  AND org_id = get_user_org(auth.uid())
);

-- 4. Job admins can add themselves to job_acl
CREATE POLICY "Job admins insert job_acl for their jobs"
ON public.job_acl
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'job_admin'::app_role)
  AND user_id = auth.uid()
);