-- Create storage policies for resumes bucket
CREATE POLICY "Authenticated users can upload resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = get_user_org(auth.uid())::text
);

CREATE POLICY "Users can view their org resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = get_user_org(auth.uid())::text
);

CREATE POLICY "Users can delete their org resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = get_user_org(auth.uid())::text
);

-- Public can upload resumes (for careers site)
CREATE POLICY "Public can upload resumes for careers"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'resumes');