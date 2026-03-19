# OBJECT_MAP

NEST-Paket conceptual object layer.
This sits above database schema and defines system-level objects.

---

## OBJECT LIST

| Object         | Description                              | Identity         | Parent        | Child              | Core Role                    |
|----------------|------------------------------------------|------------------|---------------|--------------------|------------------------------|
| handover       | transaksi utama serah terima             | handover_id      | -             | item, receive_event| container / root object      |
| item           | unit/barang dalam handover               | item_id          | handover      | -                  | line object                  |
| receive_event  | event saat paket diterima               | receive_event_id | handover      | -                  | event recorder               |
| receipt        | representasi transit (UI layer)         | handover_id      | handover      | -                  | transit state (not stored)   |
| artifact_pdf    | bukti final (immutable)                  | handover_id      | handover      | -                  | final truth                  |
| artifact_photo  | bukti foto saat receive                  | receive_event_id | receive_event | -                  | supporting evidence          |

---

## OBJECT RELATION

handover
├── item (1:N)
├── receive_event (1:1)
│   └── artifact_photo (optional)
├── receipt (derived / UI layer)
└── artifact_pdf (generated)

---

## OBJECT ROLE

| Object         | Type        | Mutable | Stored   | Notes                              |
|----------------|-------------|---------|----------|------------------------------------|
| handover       | core        | yes     | DB       | root container                     |
| item           | core        | yes     | DB       | belongs to handover                |
| receive_event  | event       | no      | DB       | immutable after insert             |
| receipt        | view        | no      | no       | derived from DB state              |
| artifact_pdf   | artifact    | no      | storage  | final, immutable                   |
| artifact_photo | artifact    | no      | storage  | optional supporting evidence       |

---

## TRUTH LAYER

| Layer        | Source           | Description                      |
|--------------|------------------|----------------------------------|
| operational  | database         | live system state                |
| transit      | receipt (UI)     | waiting for accepted             |
| final        | artifact (PDF)   | immutable final truth            |

---

## LIFECYCLE (OBJECT LEVEL)

| Stage        | Object State                         |
|--------------|--------------------------------------|
| created      | handover + items created             |
| in_transit   | QR active                            |
| received     | receive_event created                |
| accepted     | artifact_pdf generated               |
| archived     | DB optional delete, artifact remains |
