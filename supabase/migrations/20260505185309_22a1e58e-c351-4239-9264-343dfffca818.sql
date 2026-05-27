
-- 1. Notifications: restrict INSERT
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Users or service can create notifications"
ON public.notifications
FOR INSERT
TO authenticated, service_role
WITH CHECK (
  auth.role() = 'service_role' OR user_id = auth.uid()
);

-- 2. Storage: remove broad resumes upload + read policies
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload resumes for careers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view resumes in their org" ON storage.objects;

-- 3. Documents bucket: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Users can view documents" ON storage.objects;
CREATE POLICY "Authenticated users can view documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- 4. Scorecards: org-scope admin read
DROP POLICY IF EXISTS "Admins see submitted scorecards" ON public.scorecards;
CREATE POLICY "Admins see submitted scorecards in their org"
ON public.scorecards
FOR SELECT
USING (
  submitted_at IS NOT NULL
  AND (has_role(auth.uid(), 'site_admin'::app_role) OR has_role(auth.uid(), 'job_admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM interviews i
    JOIN applications a ON a.id = i.application_id
    JOIN jobs j ON j.id = a.job_id
    WHERE i.id = scorecards.interview_id
      AND j.org_id = get_user_org(auth.uid())
  )
);

-- 5. Interviews: org-scope admin update/delete
DROP POLICY IF EXISTS "Admins delete interviews" ON public.interviews;
DROP POLICY IF EXISTS "Admins update interviews" ON public.interviews;
DROP POLICY IF EXISTS "Admins insert interviews" ON public.interviews;

CREATE POLICY "Admins delete interviews in their org"
ON public.interviews
FOR DELETE
USING (
  (has_role(auth.uid(), 'site_admin'::app_role) OR has_role(auth.uid(), 'job_admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE a.id = interviews.application_id
      AND j.org_id = get_user_org(auth.uid())
  )
);

CREATE POLICY "Admins update interviews in their org"
ON public.interviews
FOR UPDATE
USING (
  (has_role(auth.uid(), 'site_admin'::app_role) OR has_role(auth.uid(), 'job_admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE a.id = interviews.application_id
      AND j.org_id = get_user_org(auth.uid())
  )
);

CREATE POLICY "Admins insert interviews in their org"
ON public.interviews
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'site_admin'::app_role) OR has_role(auth.uid(), 'job_admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE a.id = interviews.application_id
      AND j.org_id = get_user_org(auth.uid())
  )
);
