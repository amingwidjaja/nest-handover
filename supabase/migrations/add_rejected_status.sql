-- Migration: add rejected status + rejection_reason to handover
-- Run this in Supabase SQL Editor

-- 1. Drop existing check constraint
ALTER TABLE public.handover
  DROP CONSTRAINT IF EXISTS handover_status_check;

-- 2. Re-add with 'rejected' included
ALTER TABLE public.handover
  ADD CONSTRAINT handover_status_check
  CHECK (status = ANY (ARRAY['draft','created','received','accepted','rejected']));

-- 3. Add rejection_reason column
ALTER TABLE public.handover
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 4. Add rejected_at timestamp
ALTER TABLE public.handover
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone;

