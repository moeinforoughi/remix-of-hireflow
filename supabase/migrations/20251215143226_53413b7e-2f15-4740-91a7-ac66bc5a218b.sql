-- Create candidate_ratings table for standalone ratings
CREATE TABLE public.candidate_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  soft_skills INTEGER NOT NULL CHECK (soft_skills >= 1 AND soft_skills <= 5),
  hard_skills INTEGER NOT NULL CHECK (hard_skills >= 1 AND hard_skills <= 5),
  salary_match INTEGER NOT NULL CHECK (salary_match >= 1 AND salary_match <= 5),
  culture_fit INTEGER NOT NULL CHECK (culture_fit >= 1 AND culture_fit <= 5),
  experience INTEGER NOT NULL CHECK (experience >= 1 AND experience <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, user_id)
);

-- Enable RLS
ALTER TABLE public.candidate_ratings ENABLE ROW LEVEL SECURITY;

-- Users can see ratings in their org
CREATE POLICY "Users see org candidate ratings"
ON public.candidate_ratings
FOR SELECT
USING (org_id = get_user_org(auth.uid()));

-- Users can create ratings in their org
CREATE POLICY "Users create candidate ratings"
ON public.candidate_ratings
FOR INSERT
WITH CHECK (org_id = get_user_org(auth.uid()) AND user_id = auth.uid());

-- Users can update their own ratings
CREATE POLICY "Users update own candidate ratings"
ON public.candidate_ratings
FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own ratings
CREATE POLICY "Users delete own candidate ratings"
ON public.candidate_ratings
FOR DELETE
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_candidate_ratings_updated_at
BEFORE UPDATE ON public.candidate_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();