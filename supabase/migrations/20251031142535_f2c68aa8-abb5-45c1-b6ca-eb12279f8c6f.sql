
-- Fix the trigger to use 'declined' instead of 'rejected'
CREATE OR REPLACE FUNCTION public.update_offer_state_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- If any approval is rejected, mark offer as declined (not rejected)
  IF rejected_count > 0 THEN
    UPDATE offers
    SET state = 'declined'
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
$function$;
