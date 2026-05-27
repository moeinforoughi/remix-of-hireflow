-- Create enum for task status
CREATE TYPE task_status AS ENUM ('pending', 'completed');

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  label TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  status task_status NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users see org tasks"
ON public.tasks
FOR SELECT
USING (org_id = get_user_org(auth.uid()));

CREATE POLICY "Users create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (org_id = get_user_org(auth.uid()));

CREATE POLICY "Users update org tasks"
ON public.tasks
FOR UPDATE
USING (org_id = get_user_org(auth.uid()));

CREATE POLICY "Users delete org tasks"
ON public.tasks
FOR DELETE
USING (org_id = get_user_org(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();