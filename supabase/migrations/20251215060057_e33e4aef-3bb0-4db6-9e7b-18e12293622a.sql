-- Drop the existing policy that doesn't filter by organization
DROP POLICY IF EXISTS "Admins manage offers" ON public.offers;

-- Create new policy with organization filtering for site_admins
CREATE POLICY "Admins manage offers" ON public.offers
FOR ALL
USING (
  has_role(auth.uid(), 'site_admin'::app_role) AND 
  EXISTS (
    SELECT 1 FROM applications a 
    JOIN jobs j ON a.job_id = j.id 
    WHERE a.id = offers.application_id 
    AND j.org_id = get_user_org(auth.uid())
  )
);