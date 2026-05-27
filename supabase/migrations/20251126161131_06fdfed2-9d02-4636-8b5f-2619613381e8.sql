-- Step 1: Re-enable RLS on all three tables
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Step 2: Create unified helper function for admin check
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('site_admin', 'job_admin')
    AND p.org_id = _org_id
  );
$$;

-- Step 3: Drop existing separate INSERT policies
DROP POLICY IF EXISTS "Job admins insert candidates" ON public.candidates;
DROP POLICY IF EXISTS "Site admins insert candidates" ON public.candidates;
DROP POLICY IF EXISTS "Job admins insert applications" ON public.applications;
DROP POLICY IF EXISTS "Job admins insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Job admins insert job_acl for their jobs" ON public.job_acl;

-- Step 4: Create combined INSERT policies

-- For candidates
CREATE POLICY "Admins insert candidates"
ON public.candidates
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_org_admin(org_id)
);

-- For jobs
CREATE POLICY "Admins insert jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_org_admin(org_id)
);

-- For applications (simplified - no job_acl requirement)
CREATE POLICY "Admins insert applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = applications.job_id
    AND public.is_org_admin(j.org_id)
  )
);

-- For job_acl (allow admins to add themselves)
CREATE POLICY "Admins insert job_acl"
ON public.job_acl
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND (has_role(auth.uid(), 'site_admin'::app_role) OR has_role(auth.uid(), 'job_admin'::app_role))
);