-- Fix security warnings: RLS and function search paths

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for organizations
CREATE POLICY "Users see own organization"
ON organizations FOR SELECT
USING (id = get_user_org(auth.uid()));

CREATE POLICY "Site admins manage organization"
ON organizations FOR ALL
USING (has_role(auth.uid(), 'site_admin') AND id = get_user_org(auth.uid()));

-- Fix search_path for update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;