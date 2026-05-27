-- Update handle_new_user function to consistently assign new users to Default Organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id UUID;
  _user_count INT;
BEGIN
  -- Get the DEFAULT organization (first one created, ordered by created_at)
  SELECT id INTO _org_id FROM organizations ORDER BY created_at ASC LIMIT 1;
  
  -- Create profile
  INSERT INTO public.profiles (id, org_id, full_name, email)
  VALUES (
    NEW.id,
    _org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email
  );
  
  -- Count existing users in this org
  SELECT COUNT(*) INTO _user_count 
  FROM profiles 
  WHERE org_id = _org_id;
  
  -- First user gets site_admin, others get basic
  IF _user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'site_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'basic');
  END IF;
  
  RETURN NEW;
END;
$$;