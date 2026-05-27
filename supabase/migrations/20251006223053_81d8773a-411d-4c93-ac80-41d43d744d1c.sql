-- Create table for custom application questions
CREATE TABLE IF NOT EXISTS public.application_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'textarea', 'yes_no', 'multiple_choice')),
  options TEXT[], -- For multiple choice questions
  is_required BOOLEAN NOT NULL DEFAULT false,
  order_idx INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing applicant responses
CREATE TABLE IF NOT EXISTS public.application_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.application_questions(id) ON DELETE CASCADE,
  response_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_questions
CREATE POLICY "Anyone can view questions for open jobs"
  ON public.application_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = application_questions.job_id
      AND jobs.status = 'open'
    )
  );

CREATE POLICY "Org members can manage questions"
  ON public.application_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      JOIN public.profiles ON profiles.org_id = jobs.org_id
      WHERE jobs.id = application_questions.job_id
      AND profiles.id = auth.uid()
    )
  );

-- RLS Policies for application_responses
CREATE POLICY "Anyone can insert responses"
  ON public.application_responses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Org members can view responses"
  ON public.application_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications
      JOIN public.jobs ON jobs.id = applications.job_id
      JOIN public.profiles ON profiles.org_id = jobs.org_id
      WHERE applications.id = application_responses.application_id
      AND profiles.id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_application_questions_updated_at
  BEFORE UPDATE ON public.application_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create indexes
CREATE INDEX idx_application_questions_job_id ON public.application_questions(job_id);
CREATE INDEX idx_application_questions_order ON public.application_questions(job_id, order_idx);
CREATE INDEX idx_application_responses_application_id ON public.application_responses(application_id);
CREATE INDEX idx_application_responses_question_id ON public.application_responses(question_id);