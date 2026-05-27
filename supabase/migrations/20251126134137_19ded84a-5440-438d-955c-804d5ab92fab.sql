-- Drop existing job_admin INSERT policies
DROP POLICY IF EXISTS "Job admins insert candidates" ON public.candidates;
DROP POLICY IF EXISTS "Job admins insert applications" ON public.applications;
DROP POLICY IF EXISTS "Job admins insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Job admins insert job_acl for their jobs" ON public.job_acl;

-- Recreate policies with (select auth.uid()) pattern
CREATE POLICY "Job admins insert candidates"
ON public.candidates
FOR INSERT
TO authenticated
WITH CHECK (
  has_role((select auth.uid()), 'job_admin'::app_role) 
  AND org_id = get_user_org((select auth.uid()))
);

CREATE POLICY "Job admins insert applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  has_role((select auth.uid()), 'job_admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM job_acl
    WHERE job_acl.job_id = applications.job_id
    AND job_acl.user_id = (select auth.uid())
    AND job_acl.can_view = true
  )
);

CREATE POLICY "Job admins insert jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (
  has_role((select auth.uid()), 'job_admin'::app_role) 
  AND org_id = get_user_org((select auth.uid()))
);

CREATE POLICY "Job admins insert job_acl for their jobs"
ON public.job_acl
FOR INSERT
TO authenticated
WITH CHECK (
  has_role((select auth.uid()), 'job_admin'::app_role)
  AND user_id = (select auth.uid())
);