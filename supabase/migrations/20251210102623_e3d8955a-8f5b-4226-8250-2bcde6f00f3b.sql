-- Allow Job Admins with offer access to create offers
CREATE POLICY "Job admins with offer access can create offers"
ON public.offers
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'job_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM applications a
    JOIN job_acl acl ON acl.job_id = a.job_id
    WHERE a.id = offers.application_id
    AND acl.user_id = auth.uid()
    AND acl.can_view_offer = true
  )
);

-- Allow Job Admins with offer access to update offers they have access to
CREATE POLICY "Job admins with offer access can update offers"
ON public.offers
FOR UPDATE
USING (
  has_role(auth.uid(), 'job_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM applications a
    JOIN job_acl acl ON acl.job_id = a.job_id
    WHERE a.id = offers.application_id
    AND acl.user_id = auth.uid()
    AND acl.can_view_offer = true
  )
);