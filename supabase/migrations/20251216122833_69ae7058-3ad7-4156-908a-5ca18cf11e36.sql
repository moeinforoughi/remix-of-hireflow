-- Allow users with job access to update candidates for their assigned jobs
CREATE POLICY "Users with job access can update candidates" 
ON public.candidates
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM applications a
    JOIN job_acl acl ON acl.job_id = a.job_id
    WHERE a.candidate_id = candidates.id 
    AND acl.user_id = auth.uid() 
    AND acl.can_view = true
  )
);