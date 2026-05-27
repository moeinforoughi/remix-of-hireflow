-- Allow users with job access to insert applications (apply candidates to jobs)
CREATE POLICY "Users with job access can insert applications" 
ON public.applications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM job_acl acl
    WHERE acl.job_id = applications.job_id 
    AND acl.user_id = auth.uid() 
    AND acl.can_view = true
  )
);
