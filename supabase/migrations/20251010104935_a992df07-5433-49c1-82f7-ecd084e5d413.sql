-- Create trigger function to move application to Hired stage when offer is accepted
CREATE OR REPLACE FUNCTION public.update_application_on_offer_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Create trigger on offers table
DROP TRIGGER IF EXISTS on_offer_accepted ON offers;
CREATE TRIGGER on_offer_accepted
  AFTER UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_application_on_offer_accepted();