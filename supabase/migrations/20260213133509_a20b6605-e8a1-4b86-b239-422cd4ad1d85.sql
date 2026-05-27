-- Create trigger for new user signup (profile + role creation)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger to link demo user to demo org
CREATE OR REPLACE TRIGGER on_auth_user_created_demo
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_demo_user();

-- Create trigger for default job stages
CREATE OR REPLACE TRIGGER on_job_created_stages
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_job_stages();

-- Create trigger for application activity logging
CREATE OR REPLACE TRIGGER on_application_change
  AFTER INSERT OR UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_application_change();

-- Create trigger for job activity logging
CREATE OR REPLACE TRIGGER on_job_change
  AFTER INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.log_job_change();

-- Create trigger for offer activity logging
CREATE OR REPLACE TRIGGER on_offer_change
  AFTER INSERT OR UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_offer_change();

-- Create trigger for offer approval state updates
CREATE OR REPLACE TRIGGER on_approval_state_change
  AFTER UPDATE ON public.approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_offer_state_on_approval();

-- Create trigger for job approval state updates
CREATE OR REPLACE TRIGGER on_job_approval_state_change
  AFTER UPDATE ON public.job_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_status_on_approval();

-- Create trigger for offer accepted -> application hired
CREATE OR REPLACE TRIGGER on_offer_accepted
  AFTER UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_on_offer_accepted();

-- Create trigger for offer approved -> application to offer stage
CREATE OR REPLACE TRIGGER on_offer_approved
  AFTER UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_on_offer_approved();

-- Create trigger for updated_at timestamps
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create trigger for invitation expiry check
CREATE OR REPLACE TRIGGER check_invitation_expiry_trigger
  BEFORE UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_invitation_expiry();