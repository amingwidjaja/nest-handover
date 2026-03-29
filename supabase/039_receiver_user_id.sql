-- =========================================================
-- FILE: 039_receiver_user_id.sql
-- PURPOSE:
--   Link receive_event to a registered NEST Paket user.
--   Enables "received" tab on dashboard — penerima bisa
--   lihat semua paket yang pernah diterima di satu tempat.
--
--   Nullable by design:
--   - Penerima yang belum/tidak daftar → receiver_user_id NULL
--   - Flow receive tanpa akun tetap berjalan normal
--   - Hanya penerima ber-akun yang dapat dashboard "Diterima"
-- =========================================================

ALTER TABLE receive_event
  ADD COLUMN IF NOT EXISTS receiver_user_id uuid
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Index for dashboard query:
-- SELECT ... FROM handover JOIN receive_event WHERE receiver_user_id = auth.uid()
CREATE INDEX IF NOT EXISTS idx_receive_event_receiver_user_id
  ON receive_event(receiver_user_id);

-- RLS: user dapat lihat receive_event miliknya sebagai penerima
-- (policy terpisah dari policy pengirim yang sudah ada)
CREATE POLICY "receiver can view own receive events"
  ON receive_event
  FOR SELECT
  USING (receiver_user_id = auth.uid());
