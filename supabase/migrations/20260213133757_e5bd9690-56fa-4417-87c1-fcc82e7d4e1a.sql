-- Remove duplicate triggers on applications
DROP TRIGGER IF EXISTS trigger_applications_updated ON public.applications;
DROP TRIGGER IF EXISTS trigger_log_application_insert ON public.applications;
DROP TRIGGER IF EXISTS trigger_log_application_update ON public.applications;

-- Remove duplicate triggers on approvals
DROP TRIGGER IF EXISTS trigger_update_offer_state_on_approval ON public.approvals;

-- Remove duplicate triggers on candidates
DROP TRIGGER IF EXISTS trigger_candidates_updated ON public.candidates;

-- Remove duplicate triggers on offers
DROP TRIGGER IF EXISTS log_offer_change_trigger ON public.offers;
DROP TRIGGER IF EXISTS trigger_offers_updated ON public.offers;
DROP TRIGGER IF EXISTS trigger_update_application_on_offer_accepted ON public.offers;

-- Remove duplicate triggers on profiles
DROP TRIGGER IF EXISTS trigger_profiles_updated ON public.profiles;
DROP TRIGGER IF EXISTS after_demo_profile_insert ON public.profiles;

-- Remove duplicate triggers on job_approvals
DROP TRIGGER IF EXISTS update_job_status_on_approval_trigger ON public.job_approvals;

-- Remove duplicate triggers on user_invitations
DROP TRIGGER IF EXISTS set_invitation_expiry ON public.user_invitations;