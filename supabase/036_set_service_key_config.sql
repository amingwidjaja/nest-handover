-- ============================================================
-- 036_set_service_key_config.sql
-- Tujuan: Set service_key config untuk pg_net trigger
-- Jalankan di Supabase SQL Editor (satu kali)
--
-- ALTER DATABASE tidak diizinkan di Supabase,
-- pakai ALTER ROLE postgres sebagai gantinya.
-- ============================================================

-- Ganti 'YOUR_SERVICE_ROLE_KEY' dengan key aktual dari:
-- Supabase Dashboard → Settings → API → service_role key

ALTER ROLE postgres SET app.service_key = 'YOUR_SERVICE_ROLE_KEY';

-- Apply tanpa restart
SELECT pg_reload_conf();

-- Verifikasi (jalankan di session baru setelah pg_reload_conf):
-- SHOW app.service_key;
