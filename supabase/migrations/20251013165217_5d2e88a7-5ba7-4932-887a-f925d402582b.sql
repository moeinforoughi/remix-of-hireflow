-- Create function to log offer changes to activities table
CREATE OR REPLACE FUNCTION public.log_offer_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _org_id UUID;
BEGIN
  -- Get org_id from the application's job
  SELECT jobs.org_id INTO _org_id 
  FROM applications 
  JOIN jobs ON jobs.id = applications.job_id
  WHERE applications.id = NEW.application_id;
  
  INSERT INTO activities (org_id, actor_id, entity, entity_id, action, before_json, after_json)
  VALUES (
    _org_id,
    auth.uid(),
    'offer',
    NEW.id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'insert'
      WHEN OLD.state IS DISTINCT FROM NEW.state THEN 'update'
      ELSE 'update'
    END,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    row_to_json(NEW)
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger to log offer changes
DROP TRIGGER IF EXISTS log_offer_change_trigger ON offers;
CREATE TRIGGER log_offer_change_trigger
  AFTER INSERT OR UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION log_offer_change();