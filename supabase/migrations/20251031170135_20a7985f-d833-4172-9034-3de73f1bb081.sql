-- Add INSERT policy for site admins to create candidates
CREATE POLICY "Site admins insert candidates"
ON public.candidates
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'site_admin') 
  AND org_id = get_user_org(auth.uid())
);