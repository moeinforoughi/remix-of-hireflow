-- Drop INSERT policies from candidates table
DROP POLICY IF EXISTS "Admins insert candidates" ON public.candidates;
DROP POLICY IF EXISTS "Service role can insert candidates" ON public.candidates;

-- Drop INSERT policies from applications table
DROP POLICY IF EXISTS "Admins insert applications" ON public.applications;
DROP POLICY IF EXISTS "Service role can insert applications" ON public.applications;

-- Drop INSERT policies from jobs table
DROP POLICY IF EXISTS "Admins insert jobs" ON public.jobs;