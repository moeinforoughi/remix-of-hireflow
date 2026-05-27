-- Add missing site_admin role for the user who should have it
INSERT INTO user_roles (user_id, role)
SELECT '6a6b8a4c-eb63-4cca-b23d-60f28050d4b8', 'site_admin'
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = '6a6b8a4c-eb63-4cca-b23d-60f28050d4b8'
);