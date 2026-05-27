-- Allow users with job access to update application status (move pipeline)
CREATE POLICY "Users with job access can move pipeline" 
ON public.applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM job_acl acl
    WHERE acl.job_id = applications.job_id 
    AND acl.user_id = auth.uid() 
    AND acl.can_view = true
  )
);
