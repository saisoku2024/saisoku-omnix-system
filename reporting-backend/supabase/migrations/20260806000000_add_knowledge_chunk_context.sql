-- Migration: Add context_prefix to knowledge_chunks for Contextual Retrieval (Anthropic, 2024)
-- context_prefix disimpan terpisah dari content asli, supaya:
-- 1. Tampilan sumber ke user tetap chunk asli (tidak tercampur kalimat context buatan LLM)
-- 2. Embedding & keyword search tetap bisa memakai gabungan context_prefix + content

ALTER TABLE public.knowledge_chunks
ADD COLUMN IF NOT EXISTS context_prefix TEXT DEFAULT NULL;

COMMENT ON COLUMN public.knowledge_chunks.context_prefix IS
  'Kalimat singkat hasil generate LLM saat ingestion, menempatkan posisi chunk ini dalam dokumen asal (contextual retrieval). Digabung ke depan content sebelum di-embed.';
