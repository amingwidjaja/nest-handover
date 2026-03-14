# NEST76 — Database Schema

This document defines the **database structure** for NEST76.

The database stores:

* handover events
* item descriptions
* receive confirmations

The system uses **PostgreSQL via Supabase**.

---

# 1. Table: handover

Represents a single handover event.

Example:

Driver gives laundry bag to apartment security.

---

## Fields

id
share_token

status

receiver_target_name
receiver_target_phone

item_summary

created_at
received_at

---

## Field Explanation

| Field                 | Purpose                         |
| --------------------- | ------------------------------- |
| id                    | Primary identifier              |
| share_token           | Public access token used for QR |
| status                | Current state of handover       |
| receiver_target_name  | Intended receiver               |
| receiver_target_phone | WhatsApp contact                |
| item_summary          | Short description of items      |
| created_at            | Time handover created           |
| received_at           | Time handover confirmed         |

---

# 2. Status Model

Allowed values:

```text
draft
created
received
```

Meaning:

### draft

Handover is being prepared.

Not yet shared.

---

### created

Handover finalized.

QR and link can be used.

---

### received

Receiver confirmed item.

The record becomes **final and immutable**.

---

# 3. Table: handover_items

Represents individual items inside a handover.

Example:

Laundry bag
Black backpack
Contract documents

---

## Fields

id
handover_id
description
photo_url

---

## Field Explanation

| Field       | Purpose                   |
| ----------- | ------------------------- |
| id          | Item identifier           |
| handover_id | Parent handover           |
| description | Flexible item description |
| photo_url   | Optional evidence photo   |

---

## Design Note

Quantity is not stored.

Example descriptions:

```text
Mangga 2kg
Laundry bag
Tas hitam
Dokumen kontrak
```

This keeps the system simple.

---

# 4. Table: receive_event

Records proof that the handover has been received.

A handover can only be received **once**.

---

## Fields

id
handover_id

receiver_name
receiver_relation

receive_method

photo_proof

device_id
gps_location

timestamp

---

## Field Explanation

| Field             | Purpose                       |
| ----------------- | ----------------------------- |
| id                | Event identifier              |
| handover_id       | Target handover               |
| receiver_name     | Name of person accepting      |
| receiver_relation | Relation to intended receiver |
| receive_method    | How confirmation occurred     |
| photo_proof       | Photo evidence                |
| device_id         | Device identifier             |
| gps_location      | Optional location             |
| timestamp         | Receive confirmation time     |

---

# 5. Receive Methods

Possible values:

```text
direct_qr
direct_photo
proxy_qr
proxy_photo
```

---

### direct_qr

Receiver scans QR and confirms.

---

### direct_photo

Sender takes photo of receiver as proof.

Used when receiver cannot scan.

---

### proxy_qr

Another person scans QR.

Example:

Security guard receives item.

---

### proxy_photo

Sender takes photo of proxy receiver.

---

# 6. Token Model

Each handover contains a **share_token**.

Example:

```text
a83fj29dk
```

Public access format:

```text
https://nest-handover.vercel.app/r/{share_token}
```

Example:

```text
https://nest-handover.vercel.app/r/a83fj29dk
```

Token must be:

* unique
* non-predictable
* URL safe

---

# 7. Evidence Chain

NEST records evidence in two stages.

---

## Stage 1 — Sender Evidence

When preparing items.

Field:

```text
handover_items.photo_url
```

---

## Stage 2 — Receive Evidence

When receiver confirms.

Fields:

```text
receive_event.photo_proof
receive_event.device_id
receive_event.gps_location
receive_event.timestamp
```

---

## Trust Chain

```text
Sender Evidence
↓
Receive Confirmation
↓
Verified Handover Record
```

This creates a **digital trust record**.

---

# 8. Database Philosophy

The schema intentionally avoids complexity.

No:

* user accounts
* permissions
* roles
* organizations

The goal is **speed and simplicity**.

Future versions may introduce:

```text
user accounts
delivery history
dispute handling
multi-receiver flow
```

But **Mode 0 remains minimal**.

---

# END
