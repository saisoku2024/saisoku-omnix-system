-- 20241001_add_set_updated_at_fix.sql
-- Fix migration: ensure set_updated_at() function exists for triggers used in earlier RBAC migration

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
