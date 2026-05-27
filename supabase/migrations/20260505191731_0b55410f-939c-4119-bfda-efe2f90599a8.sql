
-- 1. Documents bucket: scope to org folder (path prefix = org_id)
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

CREATE POLICY "Org members can view their documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = public.get_user_org(auth.uid())::text
);

CREATE POLICY "Org members can upload to their org documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = public.get_user_org(auth.uid())::text
);

CREATE POLICY "Org members can update their org documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = public.get_user_org(auth.uid())::text
);

CREATE POLICY "Org members can delete their org documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = public.get_user_org(auth.uid())::text
);

-- 2. Logos bucket: scope update/delete to org folder
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;

CREATE POLICY "Site admins upload their org logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = public.get_user_org(auth.uid())::text
  AND public.has_role(auth.uid(), 'site_admin'::app_role)
);

CREATE POLICY "Site admins update their org logo"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = public.get_user_org(auth.uid())::text
  AND public.has_role(auth.uid(), 'site_admin'::app_role)
);

CREATE POLICY "Site admins delete their org logo"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = public.get_user_org(auth.uid())::text
  AND public.has_role(auth.uid(), 'site_admin'::app_role)
);

-- 3. job_acl: prevent self-grant cross-org escalation
DROP POLICY IF EXISTS "Admins insert job_acl" ON public.job_acl;

CREATE POLICY "Admins insert job_acl in their org"
ON public.job_acl FOR INSERT TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'site_admin'::app_role) OR public.has_role(auth.uid(), 'job_admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_acl.job_id
      AND j.org_id = public.get_user_org(auth.uid())
  )
);

-- 4. application_responses: require job-level access
DROP POLICY IF EXISTS "Org members can view responses" ON public.application_responses;

CREATE POLICY "Users with job access view responses"
ON public.application_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_responses.application_id
      AND (
        public.has_role(auth.uid(), 'site_admin'::app_role)
        OR public.can_access_job(auth.uid(), a.job_id)
      )
  )
);

-- 5. application_questions: restrict writes to admins
DROP POLICY IF EXISTS "Org members can manage questions" ON public.application_questions;

CREATE POLICY "Admins manage application questions"
ON public.application_questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = application_questions.job_id
      AND j.org_id = public.get_user_org(auth.uid())
      AND (
        public.has_role(auth.uid(), 'site_admin'::app_role)
        OR (public.has_role(auth.uid(), 'job_admin'::app_role) AND public.can_access_job(auth.uid(), j.id))
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = application_questions.job_id
      AND j.org_id = public.get_user_org(auth.uid())
      AND (
        public.has_role(auth.uid(), 'site_admin'::app_role)
        OR (public.has_role(auth.uid(), 'job_admin'::app_role) AND public.can_access_job(auth.uid(), j.id))
      )
  )
);

CREATE POLICY "Org members view application questions"
ON public.application_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = application_questions.job_id
      AND j.org_id = public.get_user_org(auth.uid())
  )
);
