-- Fix the create_default_job_stages function to include Rejected stage
CREATE OR REPLACE FUNCTION public.create_default_job_stages()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO job_stages (job_id, name, order_idx, type) VALUES
    (NEW.id, 'Applied', 0, 'applied'),
    (NEW.id, 'Phone Screen', 1, 'phone'),
    (NEW.id, 'Technical Interview', 2, 'onsite'),
    (NEW.id, 'Final Interview', 3, 'onsite'),
    (NEW.id, 'Offer', 4, 'offer'),
    (NEW.id, 'Hired', 5, 'hired'),
    (NEW.id, 'Rejected', 6, 'rejected');
  RETURN NEW;
END;
$function$;

-- Add missing rejected stages to existing jobs that don't have one
INSERT INTO job_stages (job_id, name, order_idx, type)
SELECT j.id, 'Rejected', 6, 'rejected'
FROM jobs j
WHERE NOT EXISTS (
  SELECT 1 FROM job_stages js 
  WHERE js.job_id = j.id AND js.type = 'rejected'
);