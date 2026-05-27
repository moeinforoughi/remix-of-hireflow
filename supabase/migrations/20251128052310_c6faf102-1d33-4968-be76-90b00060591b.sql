-- Allow site admins to update profiles in their organization
CREATE POLICY "Site admins update org profiles" 
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'site_admin'::app_role) 
  AND org_id = get_user_org(auth.uid())
);