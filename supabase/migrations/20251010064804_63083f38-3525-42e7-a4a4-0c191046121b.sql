-- Create function to check and update offer state based on approvals
CREATE OR REPLACE FUNCTION public.update_offer_state_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_approvals INT;
  approved_count INT;
  rejected_count INT;
BEGIN
  -- Count total approvals for this offer
  SELECT COUNT(*) INTO total_approvals
  FROM approvals
  WHERE offer_id = NEW.offer_id;
  
  -- Count approved approvals
  SELECT COUNT(*) INTO approved_count
  FROM approvals
  WHERE offer_id = NEW.offer_id AND state = 'approved';
  
  -- Count rejected approvals
  SELECT COUNT(*) INTO rejected_count
  FROM approvals
  WHERE offer_id = NEW.offer_id AND state = 'rejected';
  
  -- If any approval is rejected, mark offer as rejected
  IF rejected_count > 0 THEN
    UPDATE offers
    SET state = 'rejected'
    WHERE id = NEW.offer_id AND state IN ('draft', 'pending_approval');
  
  -- If all approvals are approved, mark offer as approved
  ELSIF approved_count = total_approvals AND total_approvals > 0 THEN
    UPDATE offers
    SET state = 'approved'
    WHERE id = NEW.offer_id AND state IN ('draft', 'pending_approval');
  
  -- If there are pending approvals, ensure offer is in pending_approval state
  ELSIF approved_count > 0 AND approved_count < total_approvals THEN
    UPDATE offers
    SET state = 'pending_approval'
    WHERE id = NEW.offer_id AND state = 'draft';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for approval state changes
DROP TRIGGER IF EXISTS trigger_update_offer_state_on_approval ON approvals;
CREATE TRIGGER trigger_update_offer_state_on_approval
AFTER INSERT OR UPDATE ON approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_offer_state_on_approval();

-- Create function to update application when offer is accepted
CREATE OR REPLACE FUNCTION public.update_application_on_offer_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hired_stage_id UUID;
BEGIN
  -- Only proceed if offer state changed to 'accepted'
  IF NEW.state = 'accepted' AND (OLD.state IS DISTINCT FROM NEW.state) THEN
    -- Find the "Hired" stage for this job
    SELECT js.id INTO hired_stage_id
    FROM job_stages js
    JOIN applications a ON a.job_id = js.job_id
    WHERE a.id = NEW.application_id
      AND js.type = 'hired'
    LIMIT 1;
    
    -- Update application to hired stage if found
    IF hired_stage_id IS NOT NULL THEN
      UPDATE applications
      SET current_stage_id = hired_stage_id,
          state = 'active'
      WHERE id = NEW.application_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for offer acceptance
DROP TRIGGER IF EXISTS trigger_update_application_on_offer_accepted ON offers;
CREATE TRIGGER trigger_update_application_on_offer_accepted
AFTER UPDATE ON offers
FOR EACH ROW
EXECUTE FUNCTION public.update_application_on_offer_accepted();