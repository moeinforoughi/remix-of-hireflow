-- Phase 1: Core Database Schema for Hiring ATS Platform (Fixed)

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE app_role AS ENUM ('basic', 'job_admin', 'site_admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE job_status AS ENUM ('open', 'paused', 'closed');
CREATE TYPE stage_type AS ENUM ('applied', 'screen', 'phone', 'onsite', 'offer', 'hired', 'rejected');
CREATE TYPE application_state AS ENUM ('active', 'rejected', 'withdrawn', 'hired');
CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE recommendation_type AS ENUM ('advance', 'hold', 'no');
CREATE TYPE message_status AS ENUM ('queued', 'sent', 'failed');
CREATE TYPE offer_state AS ENUM ('draft', 'pending_approval', 'approved', 'sent', 'accepted', 'declined', 'expired');
CREATE TYPE approval_state AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE source_type AS ENUM ('careers_site', 'referral', 'linkedin', 'agency', 'job_fair', 'manual');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'internship');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Organizations (multi-tenant support)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  branding_json JSONB DEFAULT '{}'::jsonb,
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orgs_slug ON organizations(slug);

-- User Roles (separate table for security)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status user_status DEFAULT 'active',
  timezone TEXT DEFAULT 'UTC',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, email)
);

CREATE INDEX idx_profiles_org ON profiles(org_id);
CREATE INDEX idx_profiles_email ON profiles(org_id, email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  employment_type employment_type NOT NULL,
  description_md TEXT,
  requirements_md TEXT,
  status job_status DEFAULT 'open',
  openings INT DEFAULT 1,
  hiring_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_org_status ON jobs(org_id, status);
CREATE INDEX idx_jobs_dept ON jobs(org_id, department);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Job Stages
CREATE TABLE job_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  order_idx INT NOT NULL,
  type stage_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, order_idx)
);

CREATE INDEX idx_stages_job ON job_stages(job_id, order_idx);

ALTER TABLE job_stages ENABLE ROW LEVEL SECURITY;

-- Job ACL (per-job permissions)
CREATE TABLE job_acl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  can_view BOOLEAN DEFAULT true,
  can_move_pipeline BOOLEAN DEFAULT false,
  can_message BOOLEAN DEFAULT false,
  can_view_offer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

CREATE INDEX idx_job_acl_user ON job_acl(user_id);
CREATE INDEX idx_job_acl_job ON job_acl(job_id);

ALTER TABLE job_acl ENABLE ROW LEVEL SECURITY;

-- Candidates
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  source source_type NOT NULL,
  consent BOOLEAN DEFAULT false,
  consent_at TIMESTAMPTZ,
  parsed_resume_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidates_org ON candidates(org_id);
CREATE INDEX idx_candidates_email ON candidates(org_id, email);
CREATE INDEX idx_candidates_search ON candidates USING gin(to_tsvector('english', full_name || ' ' || COALESCE(email, '')));

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  current_stage_id UUID REFERENCES job_stages(id) ON DELETE SET NULL,
  state application_state DEFAULT 'active',
  owner_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  rejection_reason TEXT,
  rejection_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apps_job_stage ON applications(job_id, current_stage_id);
CREATE INDEX idx_apps_candidate ON applications(candidate_id);
CREATE INDEX idx_apps_owner ON applications(owner_user_id);
CREATE INDEX idx_apps_state ON applications(state);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Interviews
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  stage_id UUID REFERENCES job_stages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  location TEXT,
  meeting_link TEXT,
  panel_user_ids UUID[] DEFAULT '{}',
  status interview_status DEFAULT 'scheduled',
  ics_file_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interviews_app ON interviews(application_id);
CREATE INDEX idx_interviews_time ON interviews(start_at);
CREATE INDEX idx_interviews_status ON interviews(status);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Scorecards
CREATE TABLE scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ratings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendation recommendation_type NOT NULL,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(interview_id, user_id)
);

CREATE INDEX idx_scorecards_interview ON scorecards(interview_id);
CREATE INDEX idx_scorecards_user ON scorecards(user_id);

ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  sender_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[] DEFAULT '{}',
  status message_status DEFAULT 'queued',
  external_id TEXT,
  sent_at TIMESTAMPTZ,
  failed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_app ON messages(application_id);
CREATE INDEX idx_messages_candidate ON messages(candidate_id);
CREATE INDEX idx_messages_status ON messages(org_id, status);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Message Templates
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_org ON message_templates(org_id);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Offers
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  currency TEXT DEFAULT 'USD',
  base_amount DECIMAL(12,2) NOT NULL,
  variable_amount DECIMAL(12,2),
  equity TEXT,
  benefits_md TEXT,
  notes TEXT,
  state offer_state DEFAULT 'draft',
  expires_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offers_app ON offers(application_id);
CREATE INDEX idx_offers_state ON offers(state);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Approvals
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE NOT NULL,
  approver_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  state approval_state DEFAULT 'pending',
  comment TEXT,
  acted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approvals_offer ON approvals(offer_id);
CREATE INDEX idx_approvals_user ON approvals(approver_user_id);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Activities (Audit Log)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_org_time ON activities(org_id, created_at DESC);
CREATE INDEX idx_activities_entity ON activities(entity, entity_id);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  owner_type TEXT NOT NULL,
  owner_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_owner ON attachments(owner_type, owner_id);
CREATE INDEX idx_attachments_org ON attachments(org_id);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS (Security Definer)
-- =====================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Get user's organization
CREATE OR REPLACE FUNCTION public.get_user_org(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Check if user can access a job
CREATE OR REPLACE FUNCTION public.can_access_job(_user_id UUID, _job_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.job_acl
    WHERE job_id = _job_id 
    AND user_id = _user_id 
    AND can_view = true
  );
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_jobs_updated
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_candidates_updated
BEFORE UPDATE ON candidates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_applications_updated
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_offers_updated
BEFORE UPDATE ON offers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_templates_updated
BEFORE UPDATE ON message_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_job_acl_updated
BEFORE UPDATE ON job_acl
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Auto-create default stages when job is created
CREATE OR REPLACE FUNCTION create_default_job_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO job_stages (job_id, name, order_idx, type) VALUES
    (NEW.id, 'Applied', 0, 'applied'),
    (NEW.id, 'Phone Screen', 1, 'phone'),
    (NEW.id, 'Technical Interview', 2, 'onsite'),
    (NEW.id, 'Final Interview', 3, 'onsite'),
    (NEW.id, 'Offer', 4, 'offer'),
    (NEW.id, 'Hired', 5, 'hired');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_create_job_stages
AFTER INSERT ON jobs
FOR EACH ROW
EXECUTE FUNCTION create_default_job_stages();

-- Log application changes to activities
CREATE OR REPLACE FUNCTION log_application_change()
RETURNS TRIGGER AS $$
DECLARE
  _org_id UUID;
BEGIN
  SELECT org_id INTO _org_id FROM jobs WHERE id = NEW.job_id;
  
  INSERT INTO activities (org_id, actor_id, entity, entity_id, action, before_json, after_json)
  VALUES (
    _org_id,
    auth.uid(),
    'application',
    NEW.id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id THEN 'stage_moved'
      WHEN OLD.state IS DISTINCT FROM NEW.state THEN 'state_changed'
      ELSE 'updated'
    END,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_application_insert
AFTER INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION log_application_change();

CREATE TRIGGER trigger_log_application_update
AFTER UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION log_application_change();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, org_id, full_name, email)
  VALUES (
    NEW.id,
    (SELECT id FROM organizations LIMIT 1),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email
  );
  
  -- Give basic role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'basic');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Profiles: Users see same org profiles
CREATE POLICY "Users see same org profiles"
ON profiles FOR SELECT
USING (org_id = get_user_org(auth.uid()));

CREATE POLICY "Users update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- User Roles: Users can see their own roles
CREATE POLICY "Users see own roles"
ON user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Site admins manage roles"
ON user_roles FOR ALL
USING (has_role(auth.uid(), 'site_admin'));

-- Jobs: Site admins see all, job admins see assigned
CREATE POLICY "Site admins see all jobs"
ON jobs FOR SELECT
USING (
  has_role(auth.uid(), 'site_admin') 
  AND org_id = get_user_org(auth.uid())
);

CREATE POLICY "Job admins see assigned jobs"
ON jobs FOR SELECT
USING (
  has_role(auth.uid(), 'job_admin') 
  AND can_access_job(auth.uid(), id)
);

CREATE POLICY "Site admins manage jobs"
ON jobs FOR ALL
USING (
  has_role(auth.uid(), 'site_admin') 
  AND org_id = get_user_org(auth.uid())
);

-- Job Stages: Follow job access
CREATE POLICY "Users see stages for accessible jobs"
ON job_stages FOR SELECT
USING (
  has_role(auth.uid(), 'site_admin')
  OR can_access_job(auth.uid(), job_id)
);

CREATE POLICY "Site admins manage stages"
ON job_stages FOR ALL
USING (has_role(auth.uid(), 'site_admin'));

-- Job ACL: Site admins manage, users see own assignments
CREATE POLICY "Users see own job assignments"
ON job_acl FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'site_admin'));

CREATE POLICY "Site admins manage job acl"
ON job_acl FOR ALL
USING (has_role(auth.uid(), 'site_admin'));

-- Candidates: Site admins and job admins with access
CREATE POLICY "Site admins see all candidates"
ON candidates FOR SELECT
USING (
  has_role(auth.uid(), 'site_admin') 
  AND org_id = get_user_org(auth.uid())
);

CREATE POLICY "Job admins see candidates for their jobs"
ON candidates FOR SELECT
USING (
  has_role(auth.uid(), 'job_admin')
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN job_acl acl ON acl.job_id = a.job_id
    WHERE a.candidate_id = candidates.id
    AND acl.user_id = auth.uid()
    AND acl.can_view = true
  )
);

CREATE POLICY "Site admins insert candidates"
ON candidates FOR INSERT
WITH CHECK (has_role(auth.uid(), 'site_admin'));

CREATE POLICY "Site admins update candidates"
ON candidates FOR UPDATE
USING (has_role(auth.uid(), 'site_admin'));

-- Applications: Follow job access
CREATE POLICY "Users see applications for accessible jobs"
ON applications FOR SELECT
USING (
  has_role(auth.uid(), 'site_admin')
  OR can_access_job(auth.uid(), job_id)
);

CREATE POLICY "Site admins manage applications"
ON applications FOR ALL
USING (
  has_role(auth.uid(), 'site_admin')
  AND EXISTS (SELECT 1 FROM jobs WHERE id = applications.job_id AND org_id = get_user_org(auth.uid()))
);

CREATE POLICY "Job admins move pipeline"
ON applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM job_acl
    WHERE job_id = applications.job_id
    AND user_id = auth.uid()
    AND can_move_pipeline = true
  )
);

-- Interviews: Follow application access
CREATE POLICY "Users see interviews for accessible applications"
ON interviews FOR SELECT
USING (
  has_role(auth.uid(), 'site_admin')
  OR EXISTS (
    SELECT 1 FROM applications a
    WHERE a.id = interviews.application_id
    AND can_access_job(auth.uid(), a.job_id)
  )
);

CREATE POLICY "Admins insert interviews"
ON interviews FOR INSERT
WITH CHECK (has_role(auth.uid(), 'site_admin') OR has_role(auth.uid(), 'job_admin'));

CREATE POLICY "Admins update interviews"
ON interviews FOR UPDATE
USING (has_role(auth.uid(), 'site_admin') OR has_role(auth.uid(), 'job_admin'));

CREATE POLICY "Admins delete interviews"
ON interviews FOR DELETE
USING (has_role(auth.uid(), 'site_admin') OR has_role(auth.uid(), 'job_admin'));

-- Scorecards: Users see own, admins see all after submission
CREATE POLICY "Users see own scorecards"
ON scorecards FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins see submitted scorecards"
ON scorecards FOR SELECT
USING (
  (has_role(auth.uid(), 'site_admin') OR has_role(auth.uid(), 'job_admin'))
  AND submitted_at IS NOT NULL
);

CREATE POLICY "Users insert own scorecards"
ON scorecards FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own scorecards"
ON scorecards FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users delete own scorecards"
ON scorecards FOR DELETE
USING (user_id = auth.uid());

-- Messages: Users see messages for accessible applications
CREATE POLICY "Users see messages for accessible applications"
ON messages FOR SELECT
USING (
  has_role(auth.uid(), 'site_admin')
  OR (
    application_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = messages.application_id
      AND can_access_job(auth.uid(), a.job_id)
    )
  )
);

CREATE POLICY "Job admins send messages"
ON messages FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'site_admin') OR has_role(auth.uid(), 'job_admin'))
  AND EXISTS (
    SELECT 1 FROM job_acl
    WHERE job_id = (SELECT job_id FROM applications WHERE id = application_id)
    AND user_id = auth.uid()
    AND can_message = true
  )
);

-- Message Templates: Users see own org templates
CREATE POLICY "Users see org templates"
ON message_templates FOR SELECT
USING (org_id = get_user_org(auth.uid()));

CREATE POLICY "Admins manage templates"
ON message_templates FOR ALL
USING (has_role(auth.uid(), 'site_admin'));

-- Offers: Users with can_view_offer permission
CREATE POLICY "Users see offers for accessible applications"
ON offers FOR SELECT
USING (
  has_role(auth.uid(), 'site_admin')
  OR EXISTS (
    SELECT 1 FROM applications a
    JOIN job_acl acl ON acl.job_id = a.job_id
    WHERE a.id = offers.application_id
    AND acl.user_id = auth.uid()
    AND acl.can_view_offer = true
  )
);

CREATE POLICY "Admins manage offers"
ON offers FOR ALL
USING (has_role(auth.uid(), 'site_admin'));

-- Approvals: Approvers see their approvals
CREATE POLICY "Users see own approvals"
ON approvals FOR SELECT
USING (approver_user_id = auth.uid() OR has_role(auth.uid(), 'site_admin'));

CREATE POLICY "Users update own approvals"
ON approvals FOR UPDATE
USING (approver_user_id = auth.uid());

CREATE POLICY "Admins insert approvals"
ON approvals FOR INSERT
WITH CHECK (has_role(auth.uid(), 'site_admin'));

-- Activities: Users see activities for accessible entities
CREATE POLICY "Users see org activities"
ON activities FOR SELECT
USING (org_id = get_user_org(auth.uid()));

-- Attachments: Users see attachments for accessible entities
CREATE POLICY "Users see org attachments"
ON attachments FOR SELECT
USING (org_id = get_user_org(auth.uid()));

CREATE POLICY "Users upload attachments"
ON attachments FOR INSERT
WITH CHECK (org_id = get_user_org(auth.uid()));

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Create default organization
INSERT INTO organizations (name, slug) 
VALUES ('Default Organization', 'default-org')
ON CONFLICT DO NOTHING;