-- Extend job_status enum to include approval states
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'pending_approval';

-- Create job_approvals table
CREATE TABLE IF NOT EXISTS public.job_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  approver_user_id UUID NOT NULL REFERENCES profiles(id),
  state approval_state DEFAULT 'pending',
  acted_at TIMESTAMP WITH TIME ZONE,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(job_id, approver_user_id)
);

-- Enable RLS on job_approvals
ALTER TABLE public.job_approvals ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_approvals
CREATE POLICY "Admins insert job approvals"
  ON public.job_approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'site_admin'));

CREATE POLICY "Users see own job approvals"
  ON public.job_approvals
  FOR SELECT
  TO authenticated
  USING (approver_user_id = auth.uid() OR has_role(auth.uid(), 'site_admin'));

CREATE POLICY "Users update own job approvals"
  ON public.job_approvals
  FOR UPDATE
  TO authenticated
  USING (approver_user_id = auth.uid());

-- Function to update job status based on approvals
CREATE OR REPLACE FUNCTION public.update_job_status_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_approvals INT;
  approved_count INT;
  rejected_count INT;
BEGIN
  -- Count total approvals for this job
  SELECT COUNT(*) INTO total_approvals
  FROM job_approvals
  WHERE job_id = NEW.job_id;
  
  -- Count approved approvals
  SELECT COUNT(*) INTO approved_count
  FROM job_approvals
  WHERE job_id = NEW.job_id AND state = 'approved';
  
  -- Count rejected approvals
  SELECT COUNT(*) INTO rejected_count
  FROM job_approvals
  WHERE job_id = NEW.job_id AND state = 'rejected';
  
  -- If any approval is rejected, mark job as closed
  IF rejected_count > 0 THEN
    UPDATE jobs
    SET status = 'closed'
    WHERE id = NEW.job_id AND status IN ('draft', 'pending_approval');
  
  -- If all approvals are approved, mark job as open
  ELSIF approved_count = total_approvals AND total_approvals > 0 THEN
    UPDATE jobs
    SET status = 'open'
    WHERE id = NEW.job_id AND status IN ('draft', 'pending_approval');
  
  -- If there are pending approvals, ensure job is in pending_approval state
  ELSIF approved_count > 0 AND approved_count < total_approvals THEN
    UPDATE jobs
    SET status = 'pending_approval'
    WHERE id = NEW.job_id AND status = 'draft';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Trigger to update job status when approval changes
CREATE TRIGGER update_job_status_on_approval_trigger
  AFTER INSERT OR UPDATE ON job_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_job_status_on_approval();

-- Function to log job status changes
CREATE OR REPLACE FUNCTION public.log_job_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO activities (org_id, actor_id, entity, entity_id, action, before_json, after_json)
  VALUES (
    NEW.org_id,
    auth.uid(),
    'job',
    NEW.id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed'
      ELSE 'updated'
    END,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$function$;

-- Trigger to log job changes
CREATE TRIGGER log_job_change_trigger
  AFTER INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION log_job_change();