-- 20240628_add_set_updated_at.sql
-- Helper function for triggers that set `updated_at` timestamp

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
