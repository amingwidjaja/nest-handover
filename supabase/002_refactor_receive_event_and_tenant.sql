-- =========================
-- A. TENANT TABLE
-- =========================
CREATE TABLE IF NOT EXISTS tenant (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO tenant (id, name)
VALUES ('public', 'Public')
ON CONFLICT (id) DO NOTHING;


-- =========================
-- B. HANDOVER → ADD tenant_id
-- =========================
ALTER TABLE handover
ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'handover_tenant_fk'
  ) THEN
    ALTER TABLE handover
    ADD CONSTRAINT handover_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES tenant(id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_handover_tenant ON handover(tenant_id);


-- =========================
-- C. RECEIVE_EVENT → CLEAN + ADD FIELDS
-- =========================

-- 1) rename photo_proof → photo_url (kalau ada)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='receive_event' AND column_name='photo_proof'
  ) THEN
    ALTER TABLE receive_event RENAME COLUMN photo_proof TO photo_url;
  END IF;
END$$;

-- 2) drop gps_location (string)
ALTER TABLE receive_event
DROP COLUMN IF EXISTS gps_location;

-- 3) drop timestamp (pakai received_at saja)
ALTER TABLE receive_event
DROP COLUMN IF EXISTS "timestamp";

-- 4) add structured GPS
ALTER TABLE receive_event
ADD COLUMN IF NOT EXISTS gps_lat NUMERIC;

ALTER TABLE receive_event
ADD COLUMN IF NOT EXISTS gps_lng NUMERIC;

ALTER TABLE receive_event
ADD COLUMN IF NOT EXISTS gps_accuracy NUMERIC;

-- 5) add tenant_id
ALTER TABLE receive_event
ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'receive_event_tenant_fk'
  ) THEN
    ALTER TABLE receive_event
    ADD CONSTRAINT receive_event_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES tenant(id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_receive_event_tenant ON receive_event(tenant_id);


-- =========================
-- D. CONSISTENCY RULE (optional but good)
-- ensure tenant_id of receive_event follows handover
-- =========================

CREATE OR REPLACE FUNCTION set_receive_event_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- copy tenant_id dari handover
  SELECT tenant_id INTO NEW.tenant_id
  FROM handover
  WHERE id = NEW.handover_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_receive_event_set_tenant ON receive_event;

CREATE TRIGGER trg_receive_event_set_tenant
BEFORE INSERT ON receive_event
FOR EACH ROW
EXECUTE FUNCTION set_receive_event_tenant();