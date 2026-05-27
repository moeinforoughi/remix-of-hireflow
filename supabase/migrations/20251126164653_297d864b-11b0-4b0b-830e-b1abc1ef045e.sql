-- Add INSERT policy for candidates
CREATE POLICY "Admins insert candidates"
ON public.candidates
FOR INSERT
WITH CHECK (is_org_admin(org_id));

-- Add INSERT policy for applications  
CREATE POLICY "Admins insert applications"
ON public.applications
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM jobs 
  WHERE jobs.id = applications.job_id 
  AND is_org_admin(jobs.org_id)
));

-- Add INSERT policy for jobs
CREATE POLICY "Admins insert jobs"
ON public.jobs
FOR INSERT
WITH CHECK (is_org_admin(org_id));