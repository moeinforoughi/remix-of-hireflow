-- Fix RLS policies for secure public application submission
-- Part 1: Drop existing policies that conflict

-- Remove overly permissive policies
DROP POLICY IF EXISTS "Public can upload attachments" ON attachments;
DROP POLICY IF EXISTS "Public can create candidates" ON candidates;
DROP POLICY IF EXISTS "Public can create applications" ON applications;
DROP POLICY IF EXISTS "Anyone can insert responses" ON application_responses;
DROP POLICY IF EXISTS "Anyone can view their own invitation by token" ON user_invitations;

-- Drop existing authenticated policies that we'll recreate
DROP POLICY IF EXISTS "Authenticated users upload org attachments" ON attachments;
DROP POLICY IF EXISTS "Site admins insert candidates" ON candidates;

-- Drop existing service role policies if they exist
DROP POLICY IF EXISTS "Service role can insert candidates" ON candidates;
DROP POLICY IF EXISTS "Service role can insert applications" ON applications;
DROP POLICY IF EXISTS "Service role can insert attachments" ON attachments;
DROP POLICY IF EXISTS "Service role can insert responses" ON application_responses;

-- Drop old invitation policy
DROP POLICY IF EXISTS "View invitation by token via RPC" ON user_invitations;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Org members can view resumes" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage resumes" ON storage.objects;

-- Part 2: Create new secure policies

-- Authenticated users
CREATE POLICY "Authenticated users upload org attachments" ON attachments
FOR INSERT TO authenticated
WITH CHECK (org_id = get_user_org(auth.uid()));

-- Service role policies (for edge functions)
CREATE POLICY "Service role can insert candidates" ON candidates
FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can insert applications" ON applications
FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can insert attachments" ON attachments
FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can insert responses" ON application_responses
FOR INSERT TO service_role
WITH CHECK (true);

-- Secure invitation viewing - requires edge function validation
CREATE POLICY "Invitations viewable via secure function only" ON user_invitations
FOR SELECT
USING (
  status = 'pending' 
  AND expires_at > now()
  AND auth.role() = 'service_role'
);

-- Storage bucket policies for resumes
CREATE POLICY "Org members can view resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Org members can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Service role can manage resumes"
ON storage.objects FOR ALL
USING (bucket_id = 'resumes' AND auth.role() = 'service_role');