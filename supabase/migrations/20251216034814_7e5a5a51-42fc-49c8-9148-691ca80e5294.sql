-- Drop existing insert policy
DROP POLICY IF EXISTS "Admins insert approvals" ON public.approvals;

-- Create new policy that allows both site_admins and job_admins with offer access
CREATE POLICY "Users with offer access insert approvals" 
ON public.approvals 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'site_admin'::app_role)
  OR (
    has_role(auth.uid(), 'job_admin'::app_role) 
    AND EXISTS (
      SELECT 1 FROM offers o
      JOIN applications a ON a.id = o.application_id
      JOIN job_acl acl ON acl.job_id = a.job_id
      WHERE o.id = offer_id
      AND acl.user_id = auth.uid()
      AND acl.can_view_offer = true
    )
  )
);