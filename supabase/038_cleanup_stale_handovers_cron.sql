-- ============================================================
-- 038_cleanup_stale_handovers_cron.sql
-- Hapus handover status 'created' yang sudah > 7 hari
-- Jalan setiap hari jam 02:00 WIB (19:00 UTC)
-- ============================================================

begin;

select cron.schedule(
  'cleanup-stale-created-handovers',
  '0 19 * * *',
  $$
    delete from public.handover
    where
      status = 'created'
      and created_at < now() - interval '7 days'
      and record_status = 'active';
  $$
);

commit;
