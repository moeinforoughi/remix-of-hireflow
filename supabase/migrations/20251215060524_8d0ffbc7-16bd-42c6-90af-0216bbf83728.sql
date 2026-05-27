-- Tighten SELECT policy so site_admins only see offers in their own org
DROP POLICY IF EXISTS "Users see offers for accessible applications" ON public.offers;

CREATE POLICY "Users see offers for accessible applications" ON public.offers
FOR SELECT
USING (
  -- Site admins: only offers belonging to their organization
  (
    has_role(auth.uid(), 'site_admin'::app_role) AND
    EXISTS (
      SELECT 1
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.id = offers.application_id
        AND j.org_id = get_user_org(auth.uid())
    )
  )
  OR
  -- Other users: offers for applications where they have explicit offer access
  EXISTS (
    SELECT 1
    FROM applications a
    JOIN job_acl acl ON acl.job_id = a.job_id
    WHERE a.id = offers.application_id
      AND acl.user_id = auth.uid()
      AND acl.can_view_offer = true
  )
);