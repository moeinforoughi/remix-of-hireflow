-- Remove duplicate triggers (keep the ones we created, drop the pre-existing ones)
DROP TRIGGER IF EXISTS trigger_create_job_stages ON public.jobs;
DROP TRIGGER IF EXISTS log_job_change_trigger ON public.jobs;
DROP TRIGGER IF EXISTS trigger_jobs_updated ON public.jobs;