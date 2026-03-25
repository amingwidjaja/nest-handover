-- =============================================================================
-- NEST HANDOVER — DATABASE SOURCE OF TRUTH (reference)
-- =============================================================================
-- Keep this file aligned with live Supabase / migrations under supabase/.
-- When writing API routes or client fetch logic, VERIFY column names here first.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- public.handover
-- ---------------------------------------------------------------------------
-- Key columns for receipts & create flow:
--   receiver_whatsapp   text   — WhatsApp for notifications
--   receiver_email      text   — optional PDF copy
--   receiver_contact    text   — legacy / mirror of WA when applicable
--   notes               text   — catatan / keterangan
--   destination_address text
--   received_at         timestamptz — handover-level receive time (when applicable)
-- Plus: id, user_id, serial_number, sender_name, receiver_target_name,
--       status, share_token, receipt_url, … (see supabase/*.sql)

-- ---------------------------------------------------------------------------
-- public.receive_event
-- ---------------------------------------------------------------------------
-- Time column: **received_at** (NOT `timestamp` — do not use legacy name in app code).
-- Device: **device_id** (scanner / receiver device).
-- Typical fields: handover_id, receive_method, receiver_name, receiver_relation,
--   photo_url, gps_lat, gps_lng, device_id, received_at, …

-- ---------------------------------------------------------------------------
-- public.profiles
-- ---------------------------------------------------------------------------
-- Business logo: **company_logo_url** (NOT a generic logo_url on handover).
-- Often also: company_name, id (auth.users FK), …

-- =============================================================================
-- End of reference — apply real DDL via supabase/migrations.
-- =============================================================================
