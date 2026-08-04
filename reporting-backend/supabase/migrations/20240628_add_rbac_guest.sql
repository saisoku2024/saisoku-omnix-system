-- 20240628_add_rbac_guest.sql
-- Migration: add role enum, role column, role_permissions table, seed guest permissions, and RLS policies

-- 1. Create role_type enum
CREATE TYPE role_type AS ENUM ('super_admin', 'manager', 'spv', 'agent', 'guest');

-- 2. Alter profiles table to add role column (default guest)
ALTER TABLE public.profiles
  ADD COLUMN role role_type NOT NULL DEFAULT 'guest';

-- 3. Create role_permissions table
CREATE TABLE public.role_permissions (
  role role_type NOT NULL,
  permission text NOT NULL,
  PRIMARY KEY (role, permission)
);

-- 4. Seed guest permissions (view only)
INSERT INTO public.role_permissions (role, permission) VALUES
  ('guest', 'view_dashboard'),
  ('guest', 'view_monitoring'),
  ('guest', 'view_rag_scorecard');

-- 5. Example: seed other roles (you can extend later)
-- INSERT INTO public.role_permissions (role, permission) VALUES
--   ('super_admin', '*'),
--   ('manager', 'view_dashboard'),
--   ('manager', 'export_reports'),
--   ('spv', 'view_dashboard'),
--   ('agent', 'view_dashboard');

-- 6. RLS policies to block guest from sensitive tables
-- Data upload table (replace with actual table name if different)
CREATE POLICY guest_block_upload ON public.data_upload
  USING (auth.role <> 'guest');

-- User management table
CREATE POLICY guest_block_user_mgmt ON public.users
  USING (auth.role <> 'guest');

-- Data cleanup table
CREATE POLICY guest_block_cleanup ON public.data_cleanup
  USING (auth.role <> 'guest');

-- Enable RLS on those tables
ALTER TABLE public.data_upload ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_cleanup ENABLE ROW LEVEL SECURITY;

-- Note: Supabase automatically provides "auth" schema with JWT claims; adjust column reference as needed.
