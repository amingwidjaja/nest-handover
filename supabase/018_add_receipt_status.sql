ALTER TABLE handover
ADD COLUMN receipt_status TEXT DEFAULT 'pending';

-- Optional: index biar worker cepat
CREATE INDEX idx_handover_receipt_status
ON handover (receipt_status);