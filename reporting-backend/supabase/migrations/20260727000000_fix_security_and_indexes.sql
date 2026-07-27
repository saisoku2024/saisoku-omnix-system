-- ============================================================
-- SAISOKU OMNIX SYSTEM - MIGRATION SECURITY & INDEX FIX
-- File: 20260727000000_fix_security_and_indexes.sql
-- Description: Fixes RLS coverage gaps, adds missing performance indexes,
--              and hardens guest brand access permissions.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. HARDEN RLS FOR CHAT TRANSCRIPTS & ALL CORE TABLES
-- ============================================================
ALTER TABLE IF EXISTS public.chat_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.omnix_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.voice_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.csat_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role & authenticated manage chat_transcripts" ON public.chat_transcripts;
DROP POLICY IF EXISTS "Service role & authenticated manage omnix_cases" ON public.omnix_cases;
DROP POLICY IF EXISTS "Service role & authenticated manage voice_interactions" ON public.voice_interactions;
DROP POLICY IF EXISTS "Service role & authenticated manage csat_responses" ON public.csat_responses;
DROP POLICY IF EXISTS "Service role & authenticated manage uploads" ON public.uploads;

-- Strict RLS Policies (Service Role & Authenticated Staff)
CREATE POLICY "Service role & authenticated manage chat_transcripts"
  ON public.chat_transcripts FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Service role & authenticated manage omnix_cases"
  ON public.omnix_cases FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Service role & authenticated manage voice_interactions"
  ON public.voice_interactions FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Service role & authenticated manage csat_responses"
  ON public.csat_responses FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Service role & authenticated manage uploads"
  ON public.uploads FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- ============================================================
-- 2. MISSING INDEXES FOR FREQUENTLY FILTERED COLUMNS
-- ============================================================

-- Omnix Cases Indexes
CREATE INDEX IF NOT EXISTS idx_omnix_cases_status ON public.omnix_cases(ticket_status_name);
CREATE INDEX IF NOT EXISTS idx_omnix_cases_category ON public.omnix_cases(category);
CREATE INDEX IF NOT EXISTS idx_omnix_cases_customer_hp ON public.omnix_cases(customer_hp);
CREATE INDEX IF NOT EXISTS idx_omnix_cases_interaction_deleted ON public.omnix_cases(interaction_at, deleted_at);

-- Voice Interactions Indexes
CREATE INDEX IF NOT EXISTS idx_voice_interactions_event ON public.voice_interactions(call_event);
CREATE INDEX IF NOT EXISTS idx_voice_interactions_agent ON public.voice_interactions(agent_name);

-- CSAT Responses Indexes
CREATE INDEX IF NOT EXISTS idx_csat_responses_score ON public.csat_responses(score);
CREATE INDEX IF NOT EXISTS idx_csat_responses_rating ON public.csat_responses(rating_csat);

-- Chat Transcripts Indexes
CREATE INDEX IF NOT EXISTS idx_chat_transcripts_action_type ON public.chat_transcripts(action_type);
CREATE INDEX IF NOT EXISTS idx_chat_transcripts_agent_name ON public.chat_transcripts(agent_name);

-- ============================================================
-- 3. RBAC GUEST ISOLATION HARDENING
-- ============================================================

-- Ensure guest users cannot access brand_access ALL
UPDATE public.profiles
SET brand_access = ARRAY['DEMO']
WHERE email = 'guest@omnix.com' AND role = 'guest';

COMMIT;
