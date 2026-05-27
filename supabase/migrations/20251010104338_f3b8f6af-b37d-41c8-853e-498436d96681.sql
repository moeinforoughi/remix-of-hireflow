-- Create trigger function to move application to Offer stage when offer is approved
CREATE OR REPLACE FUNCTION public.update_application_on_offer_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  offer_stage_id UUID;
BEGIN
  -- Only proceed if offer state changed to 'approved'
  IF NEW.state = 'approved' AND (OLD.state IS DISTINCT FROM NEW.state) THEN
    -- Find the "Offer" stage for this job
    SELECT js.id INTO offer_stage_id
    FROM job_stages js
    JOIN applications a ON a.job_id = js.job_id
    WHERE a.id = NEW.application_id
      AND js.type = 'offer'
    LIMIT 1;
    
    -- Update application to offer stage if found
    IF offer_stage_id IS NOT NULL THEN
      UPDATE applications
      SET current_stage_id = offer_stage_id,
          state = 'active'
      WHERE id = NEW.application_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on offers table
DROP TRIGGER IF EXISTS on_offer_approved ON offers;
CREATE TRIGGER on_offer_approved
  AFTER UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_application_on_offer_approved();