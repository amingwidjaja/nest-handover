-- ============================================
-- 018_receive_event_trigger.sql
-- Purpose:
-- Auto-update handover status when receive_event is inserted
-- ============================================

-- 1. FUNCTION

CREATE OR REPLACE FUNCTION fn_on_receive_event_insert()
RETURNS TRIGGER AS $$
BEGIN

  -- Update handover status
  UPDATE handover
  SET
    status = 'received',
    received_at = NOW()
  WHERE id = NEW.handover_id;

  RETURN NEW;

END;
$$ LANGUAGE plpgsql;


-- 2. TRIGGER

DROP TRIGGER IF EXISTS trg_on_receive_event_insert ON receive_event;

CREATE TRIGGER trg_on_receive_event_insert
AFTER INSERT ON receive_event
FOR EACH ROW
EXECUTE FUNCTION fn_on_receive_event_insert();