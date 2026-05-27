-- Fix the trigger to set state = 'hired' when offer is accepted
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
    
    -- Update application to hired stage and state
    IF hired_stage_id IS NOT NULL THEN
      UPDATE applications
      SET current_stage_id = hired_stage_id,
          state = 'hired'
      WHERE id = NEW.application_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Also fix any existing hired candidates that have state='active' but are in hired stage
UPDATE applications a
SET state = 'hired'
FROM job_stages js
WHERE a.current_stage_id = js.id
  AND js.type = 'hired'
  AND a.state = 'active';