-- Enable Row Level Security (RLS) on public.audit_logs and public.role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role public.user_role NOT NULL,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, permission)
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated super admins to view audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow service role and admin insert audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow authenticated users to view role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Super Admins manage role_permissions" ON public.role_permissions;

-- RLS Policies for public.audit_logs
CREATE POLICY "Allow authenticated super admins to view audit_logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Allow service role and admin insert audit_logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- RLS Policies for public.role_permissions
CREATE POLICY "Allow authenticated users to view role_permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Super Admins manage role_permissions"
  ON public.role_permissions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    OR auth.role() = 'service_role'
  );
