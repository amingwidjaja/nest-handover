-- Migration: add destination_district to handover
-- Run this in Supabase SQL Editor

ALTER TABLE public.handover
  ADD COLUMN IF NOT EXISTS destination_district text;
