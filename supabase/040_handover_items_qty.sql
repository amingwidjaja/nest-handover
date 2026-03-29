-- =========================================================
-- FILE: 040_handover_items_qty.sql
-- PURPOSE:
--   Tambah kolom qty ke handover_items.
--   Di factory context, satu handover_item bisa mewakili
--   banyak unit (mis. 12 karton, 3 bundle, 72 pcs).
--   Nullable — untuk handover non-factory qty tidak wajib.
-- =========================================================

alter table handover_items
    add column if not exists qty integer check (qty is null or qty > 0);
