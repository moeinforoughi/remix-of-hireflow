-- Create candidate_comments table for storing comments/notes on candidates
CREATE TABLE public.candidate_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.candidate_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments for candidates in their org
CREATE POLICY "Users see org candidate comments"
ON public.candidate_comments
FOR SELECT
USING (org_id = get_user_org(auth.uid()));

-- Users can create comments in their org
CREATE POLICY "Users create org candidate comments"
ON public.candidate_comments
FOR INSERT
WITH CHECK (org_id = get_user_org(auth.uid()) AND user_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "Users update own comments"
ON public.candidate_comments
FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users delete own comments"
ON public.candidate_comments
FOR DELETE
USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_candidate_comments_candidate_id ON public.candidate_comments(candidate_id);
CREATE INDEX idx_candidate_comments_created_at ON public.candidate_comments(created_at DESC);