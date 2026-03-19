# ID_DICTIONARY

NEST-Paket system identity reference. Extracted from codebase and schema. Do not rename existing fields.

---

## Identity types and naming

### DB-level "id" → system names

The column name `id` exists only at DB level. When used in API bodies, responses, or frontend logic, it MUST be mapped to explicit system names:

| DB column   | Owner object    | System name (API / frontend) |
|------------|-----------------|------------------------------|
| handover.id | handover        | handover_id                  |
| handover_items.id | handover_items | item_id                |
| receive_event.id | receive_event   | receive_event_id             |

Example: API responses use `handover_id`, not `id`. Frontend receives `h.id` from list API and uses it as `handover_id` in navigation and selection.

### Token = share_token (alias)

`token` is not a separate identity. It is the parameter name used in URLs and query strings for `share_token`. Use `share_token` as the canonical identity; `token` is its alias in:

- Route params: `/receipt/[token]`, `/receive/[token]`, `/verify/[token]`
- Query params: `?token=...` (receipt, receipt-data, qr, pdf)

---

## Table: ID_DICTIONARY

| ID Name     | System Name     | Owner Object    | Description                                              | ID Type   | Stability | Scope     | Relation               | Usage Layer |
|-------------|-----------------|----------------|----------------------------------------------------------|-----------|-----------|-----------|------------------------|-------------|
| id          | handover_id     | handover       | Primary key; UUID; auto-generated                         | primary   | stable    | global    | —                      | cross-layer |
| share_token | share_token     | handover       | Unique public access token; QR/receive/receipt URL; 16-char hex | access  | generated | global    | —                      | cross-layer |
| id          | item_id         | handover_items | Primary key; UUID; auto-generated                        | primary   | stable    | global    | —                      | DB, frontend |
| handover_id | handover_id     | handover_items | Foreign key to handover                                  | reference | stable    | per parent| → handover.id          | DB          |
| id          | receive_event_id| receive_event  | Primary key; UUID; auto-generated                        | primary   | stable    | global    | —                      | DB          |
| handover_id | handover_id     | receive_event  | Foreign key to handover; unique (1:1)                    | reference | stable    | per parent| → handover.id          | DB          |
| device_id   | device_id       | receive_event  | Optional device fingerprint from receiver device         | external  | external  | external  | —                      | DB          |
| handover_id | handover_id     | —              | Request/response field; body or response; = handover.id  | reference | stable    | —         | = handover.id          | API         |
| ids         | handover_id[]   | —              | Array of handover.id for bulk delete                     | reference | stable    | —         | handover.id[]          | API, frontend |

**ID Type:** primary (PK) | reference (FK or API reference) | access (lookup token) | external (from outside system)  
**Stability:** stable (immutable) | generated (created by system) | external (from external source)  
**Usage Layer:** DB | API | frontend | cross-layer (multiple)

---

## By source

### DB (schema)

| ID Name     | Owner        | Type | Constraint                               |
|-------------|--------------|------|------------------------------------------|
| id          | handover     | uuid | PK, default uuid_generate_v4()            |
| share_token | handover     | text | unique, not null                         |
| id          | handover_items | uuid | PK, default uuid_generate_v4()         |
| handover_id | handover_items | uuid | FK → handover(id), on delete cascade   |
| id          | receive_event| uuid | PK, default uuid_generate_v4()            |
| handover_id | receive_event| uuid | FK → handover(id), unique, on delete cascade |
| device_id   | receive_event| text | optional                                 |

### API routes

| Route                         | Param             | Identity        | System name   |
|-------------------------------|-------------------|-----------------|---------------|
| GET /api/handover/detail      | id (query)        | handover.id     | handover_id   |
| GET /api/handover/status      | id (query)        | handover.id     | handover_id   |
| GET /api/handover/by-token    | id (query)        | handover.id     | handover_id   |
| GET /api/handover/receipt     | token (query)     | share_token     | share_token   |
| GET /api/handover/receipt-data| token (query)     | share_token     | share_token   |
| GET /api/handover/qr          | token (query)     | share_token     | share_token   |
| POST /api/handover/create     | —                 | —               | Returns handover_id, token |
| POST /api/handover/receive    | handover_id or token (body) | handover.id or share_token | handover_id / share_token |
| POST /api/handover/delete    | ids (body)        | handover.id[]   | handover_id[] |
| POST /api/handover/generate-receipt | handover_id (body) | handover.id   | handover_id   |

### Frontend routes

| Route                  | Param      | Identity    | System name  |
|------------------------|------------|-------------|--------------|
| /handover/[id]         | params.id  | handover.id | handover_id  |
| /handover/[id]/qr      | params.id  | handover.id | handover_id  |
| /handover/[id]/documents | params.id | handover.id | handover_id  |
| /handover/[id]/success | params.id  | handover.id | handover_id  |
| /receipt/[token]       | params.token | share_token | share_token (alias: token) |
| /receive/[token]       | params.token | share_token | share_token (alias: token) |
| /verify/[token]        | params.token | share_token | share_token (alias: token) |

### Frontend usage (dashboard, list views)

| Location                  | ID used    | System name   |
|---------------------------|------------|---------------|
| Dashboard row key         | h.id       | handover_id   |
| Dashboard selection       | h.id       | handover_id   |
| Dashboard highlight       | rows[0].id | handover_id   |
| Dashboard nav (created)   | h.id       | handover_id   |
| Dashboard nav (received)  | h.share_token | share_token |
| Dashboard nav (accepted)  | h.share_token | share_token |
| List API response         | id, share_token | handover_id, share_token |
| Package create response   | handover_id | handover_id   |
| Item key (receipt, handover) | item.id | item_id    |

---

## ID relationship diagram

```
handover
├── id (PK) → handover_id
│   ◄────── handover_items.handover_id
│   ◄────── receive_event.handover_id
│   ◄────── API: detail, status, by-token, delete (ids), generate-receipt
│   ◄────── Frontend: /handover/[id]
│
└── share_token (alias: token in URL/query)
    ◄────── API: receipt, receipt-data, qr, receive (body)
    ◄────── Frontend: /receipt/[token], /receive/[token], /verify/[token]

handover_items
└── id (PK) → item_id
    ◄────── Frontend: key={item.id}

receive_event
├── id (PK) → receive_event_id
├── handover_id (FK) → handover.id
└── device_id ─────── External; optional
```
