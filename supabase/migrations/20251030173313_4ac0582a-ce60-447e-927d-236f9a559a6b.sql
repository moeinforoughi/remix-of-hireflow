-- Add DELETE policy for candidates table
CREATE POLICY "Site admins delete candidates" ON candidates
FOR DELETE
USING (
  has_role(auth.uid(), 'site_admin'::app_role) 
  AND org_id = get_user_org(auth.uid())
);