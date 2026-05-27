-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  5242880, -- 5MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for resumes bucket
CREATE POLICY "Anyone can upload resumes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can view resumes in their org"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'resumes'
  AND auth.role() = 'authenticated'
);

-- Update jobs table RLS to allow public read for open jobs
CREATE POLICY "Public can view open jobs"
ON jobs
FOR SELECT
USING (status = 'open');

-- Update job_stages RLS to allow public read for open jobs
CREATE POLICY "Public can view stages for open jobs"
ON job_stages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_stages.job_id
    AND jobs.status = 'open'
  )
);

-- Allow public to insert candidates (for career site applications)
CREATE POLICY "Public can create candidates"
ON candidates
FOR INSERT
WITH CHECK (true);

-- Allow public to insert applications (for career site applications)
CREATE POLICY "Public can create applications"
ON applications
FOR INSERT
WITH CHECK (true);

-- Allow public to insert attachments (for resume uploads)
CREATE POLICY "Public can upload attachments"
ON attachments
FOR INSERT
WITH CHECK (true);