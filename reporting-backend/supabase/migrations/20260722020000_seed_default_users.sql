-- ============================================================
-- SAISOKU OMNIX - Seed Default Accounts (Admin & Guest)
-- File: 20260722020000_seed_default_users.sql
-- ============================================================

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at
) VALUES 
(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@omnix.com',
  '$2a$10$W1eX.s6/21Y6tL2pB877s.kQ8fO/nJ5sE1U/qQ.cWqN/kS.1J.N.S',
  now(),
  '{"full_name": "Super Admin", "role": "super_admin"}'::jsonb,
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'guest@omnix.com',
  '$2a$10$W1eX.s6/21Y6tL2pB877s.kQ8fO/nJ5sE1U/qQ.cWqN/kS.1J.N.S',
  now(),
  '{"full_name": "Guest User (Demo)", "role": "guest"}'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, brand_access)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@omnix.com', 'Super Admin', 'super_admin', ARRAY['ALL']),
  ('00000000-0000-0000-0000-000000000002', 'guest@omnix.com', 'Guest User (Demo)', 'guest', ARRAY['ALL'])
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
