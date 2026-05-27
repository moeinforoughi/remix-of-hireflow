-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Create new policy that works for all roles with can_message permission
CREATE POLICY "Users can send messages" 
ON messages
FOR INSERT
WITH CHECK (
  -- Site admins can always send messages in their org
  (has_role(auth.uid(), 'site_admin'::app_role) AND org_id = get_user_org(auth.uid()))
  OR
  -- Any user with can_message permission in job_acl can send messages
  (EXISTS (
    SELECT 1 FROM job_acl
    WHERE job_acl.job_id = (
      SELECT job_id FROM applications WHERE id = messages.application_id
    )
    AND job_acl.user_id = auth.uid()
    AND job_acl.can_message = true
  ))
);