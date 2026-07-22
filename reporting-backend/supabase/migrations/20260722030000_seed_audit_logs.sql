-- ============================================================
-- SAISOKU OMNIX - Seed Initial Audit Logs
-- File: 20260722030000_seed_audit_logs.sql
-- ============================================================

INSERT INTO public.audit_logs (id, user_email, user_role, action, resource, details, created_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000010',
    'system@omnix.com',
    'super_admin',
    'SYSTEM_INITIALIZED',
    'system',
    '{"info": "SAISOKU OMNIX RBAC & Audit Trail System Activated"}'::jsonb,
    NOW() - INTERVAL '2 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000011',
    'admin@omnix.com',
    'super_admin',
    'USER_CREATED',
    'profiles',
    '{"created_user_email": "guest@omnix.com", "role": "guest", "full_name": "Guest User (Demo)"}'::jsonb,
    NOW() - INTERVAL '1 hour'
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    'admin@omnix.com',
    'super_admin',
    'DATA_UPLOAD',
    'reporting_dataset',
    '{"records_count": 1450, "filename": "omnix_performance_q3.csv"}'::jsonb,
    NOW() - INTERVAL '30 minutes'
  )
ON CONFLICT (id) DO NOTHING;
