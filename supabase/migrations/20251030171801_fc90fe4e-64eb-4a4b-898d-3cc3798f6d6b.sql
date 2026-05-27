-- Drop the old policy
DROP POLICY IF EXISTS "Job admins send messages" ON messages;

-- Create updated policy that allows site_admins to send messages without job_acl check
CREATE POLICY "Users can send messages" ON messages
FOR INSERT
WITH CHECK (
  -- Site admins can send to any application in their org
  (has_role(auth.uid(), 'site_admin'::app_role) AND 
   org_id = get_user_org(auth.uid()))
  OR
  -- Job admins need job_acl permission
  (has_role(auth.uid(), 'job_admin'::app_role) AND 
   EXISTS (
     SELECT 1 FROM job_acl
     WHERE job_acl.job_id = (
       SELECT applications.job_id 
       FROM applications 
       WHERE applications.id = messages.application_id
     )
     AND job_acl.user_id = auth.uid() 
     AND job_acl.can_message = true
   ))
);