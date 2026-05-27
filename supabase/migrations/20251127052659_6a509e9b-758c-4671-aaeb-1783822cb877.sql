-- Create a helper function to check if user can insert applications for a job
-- This bypasses RLS on the jobs table for the org_id lookup
CREATE OR REPLACE FUNCTION public.can_insert_application(_job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = _job_id
    AND is_org_admin(j.org_id)
  )
$$;

-- Update the applications INSERT policy to use the new function
DROP POLICY IF EXISTS "Admins insert applications" ON public.applications;

CREATE POLICY "Admins insert applications"
ON public.applications
FOR INSERT
WITH CHECK (can_insert_application(job_id));