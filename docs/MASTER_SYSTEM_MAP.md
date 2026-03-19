# NEST-Paket Master System Map

**Purpose:** Canonical reference for naming, object structure, and lifecycle.  
**Use:** Database schema, API naming, frontend usage — follow exactly.

---

## Rules

- Do NOT change naming conventions
- Follow table exactly
- Use snake_case
- Do NOT invent new terms

---

## 1. Tables (database)

| Table              | Description                     |
|--------------------|---------------------------------|
| handover           | Main handover record            |
| handover_items     | Items in a handover             |
| receive_event      | Reception confirmation event   |

---

## 2. handover columns

| Column                 | Type      | Notes                            |
|------------------------|-----------|----------------------------------|
| id                     | uuid      | Primary key                      |
| share_token            | text      | Unique, not null                 |
| status                 | text      | See §5                           |
| sender_name            | text      |                                  |
| receiver_target_name   | text      |                                  |
| receiver_target_phone  | text      |                                  |
| receiver_target_email  | text      |                                  |
| created_at             | timestamptz| Default now()                    |
| received_at            | timestamptz| Set on receive                  |
| receipt_url            | text      | Optional                         |
| receipt_generated_at   | timestamp | Optional                         |

---

## 3. handover_items columns

| Column       | Type | Notes           |
|--------------|------|-----------------|
| id           | uuid | Primary key     |
| handover_id  | uuid | FK → handover   |
| description  | text | Not null        |
| photo_url    | text | Optional        |

---

## 4. receive_event columns

| Column           | Type      | Notes                               |
|------------------|-----------|-------------------------------------|
| id               | uuid      | Primary key                         |
| handover_id      | uuid      | FK → handover, unique               |
| receiver_name    | text      |                                     |
| receiver_relation| text      |                                     |
| receive_method   | text      | See §6                              |
| receiver_type    | text      | 'direct' or 'proxy'                 |
| photo_proof      | text      | Optional                            |
| device_id        | text      | Optional                            |
| gps_location     | text      | Optional                            |
| timestamp        | timestamptz| Default now()                      |

---

## 5. handover.status values

| Value    | Meaning                      |
|----------|------------------------------|
| draft    | Draft                        |
| created  | Handover record created      |
| received | Received (proxy)             |
| accepted | Receiver confirmed (direct)  |

---

## 6. receive_event.receive_method values

| Value        | Meaning                    |
|--------------|----------------------------|
| direct_qr    | QR Code (direct)           |
| direct_photo | Foto Serah Terima (direct) |
| proxy_qr     | QR Code (diwakilkan)       |
| proxy_photo  | Foto Serah Terima (diwakilkan) |

---

## 7. receive_event.receiver_type values

| Value   | Meaning                     |
|---------|-----------------------------|
| direct  | Penerima langsung           |
| proxy   | Diwakilkan                  |

---

## 8. API routes (snake_case in query params)

| Method | Route                          | Identifier      | Notes                    |
|--------|--------------------------------|-----------------|--------------------------|
| POST   | /api/handover/create          | —               | Body: items, sender_*, receiver_target_* |
| GET    | /api/handover/list            | —               | Returns handovers        |
| POST   | /api/handover/delete          | ids (body)      | Array of handover ids    |
| GET    | /api/handover/by-token        | id or token     | Resolves share_token     |
| GET    | /api/handover/detail          | id              | Full handover + items + receive_event |
| GET    | /api/handover/status          | id              | Status check             |
| POST   | /api/handover/receive         | handover_id or token | Body: receiver_name, receiver_relation, receive_method, receiver_type |
| GET    | /api/handover/qr              | token           | QR image                 |
| GET    | /api/handover/receipt         | token           | PDF download             |
| GET    | /api/handover/receipt-data    | token           | Receipt page data        |
| POST   | /api/handover/generate-receipt | handover_id (body) | Background PDF generation |

---

## 9. Frontend routes

| Route                    | Identifier | Notes                          |
|---------------------------|------------|--------------------------------|
| /paket                    | —          | Main entry / paket dashboard   |
| /dashboard                | —          | Daftar Paket                   |
| /handover/[id]            | id         | Serah terima page              |
| /handover/[id]/qr         | id         | QR display                     |
| /handover/[id]/documents  | id         | Documents                      |
| /receipt/[token]          | token      | share_token in path            |
| /receive/[token]          | token      | Receiver confirmation          |
| /verify/[token]           | token      | Verification page              |

---

## 10. Identifiers by context

| Context              | Use id (uuid) | Use token (share_token) |
|----------------------|---------------|--------------------------|
| Handover detail      | ✓             | —                        |
| Receipt / PDF        | —             | ✓                        |
| Receive / verify     | —             | ✓                        |
| QR lookup            | ✓ (by-token)  | ✓ (qr, receipt)         |

---

## 11. Response shapes (key fields)

**handover (from list/detail/receipt-data):**

- id, share_token, status, sender_name, receiver_target_name  
- receiver_target_phone, receiver_target_email  
- created_at, received_at  
- handover_items (array)  
- receive_event (object or null)

**handover_items element:**

- id, handover_id, description, photo_url

**receive_event:**

- id, handover_id, receiver_name, receiver_relation  
- receive_method, receiver_type  
- photo_proof, timestamp
