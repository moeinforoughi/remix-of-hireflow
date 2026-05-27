-- Allow users with job access to see candidates for applications in those jobs
CREATE POLICY "Users with job access see candidates" ON public.candidates
FOR SELECT USING (
  EXISTS (
    SELECT 1 
    FROM applications a
    JOIN job_acl acl ON acl.job_id = a.job_id
    WHERE a.candidate_id = candidates.id
    AND acl.user_id = auth.uid()
    AND acl.can_view = true
  )
);