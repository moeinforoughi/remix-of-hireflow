-- Function to link demo user to demo organization after signup
-- This runs automatically when demo@hireflow.app signs up

CREATE OR REPLACE FUNCTION link_demo_user()
RETURNS TRIGGER AS $$
DECLARE
  v_demo_org_id UUID;
BEGIN
  -- Only process if this is the demo account
  IF NEW.email = 'demo@hireflow.app' THEN
    -- Find the demo organization
    SELECT id INTO v_demo_org_id 
    FROM organizations 
    WHERE slug = 'demo-company' 
    LIMIT 1;
    
    IF v_demo_org_id IS NOT NULL THEN
      -- Update the profile to link to demo org
      UPDATE profiles 
      SET org_id = v_demo_org_id 
      WHERE id = NEW.id;
      
      -- Ensure demo user has site_admin role
      INSERT INTO user_roles (user_id, role)
      VALUES (NEW.id, 'site_admin')
      ON CONFLICT DO NOTHING;
      
      -- Grant access to all demo jobs
      INSERT INTO job_acl (user_id, job_id, can_view, can_move_pipeline, can_message, can_view_offer)
      SELECT NEW.id, id, true, true, true, true
      FROM jobs
      WHERE org_id = v_demo_org_id
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE 'Demo user linked to demo organization successfully';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to run after profile creation
CREATE TRIGGER after_demo_profile_insert
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION link_demo_user();