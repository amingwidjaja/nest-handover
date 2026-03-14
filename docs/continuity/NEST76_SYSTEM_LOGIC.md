# NEST76 — System Logic

## Project

**NEST76 Handover System Prototype**

A lightweight QR-based handover system designed to prove a frictionless item transfer mechanism without requiring user accounts.

The system focuses on **simplicity, speed, and trust verification**.

---

# 1. Core Idea

Traditional delivery systems require:

* accounts
* apps
* complicated tracking

NEST76 removes that.

Instead it uses:

```
QR + token verification
```

The QR becomes the **proof of transfer key**.

The receiver simply scans and confirms.

---

# 2. Handover Lifecycle

The lifecycle of an item handover follows this sequence.

```
CREATE
↓
QR GENERATED
↓
ITEM TRANSFER
↓
QR SCANNED
↓
RECEIVER CONFIRMATION
↓
HANDOVER COMPLETE
```

This creates a **verifiable transfer record**.

---

# 3. Status Model

The system currently uses two main states.

```
created
received
```

Meaning:

| Status   | Meaning                                |
| -------- | -------------------------------------- |
| created  | Handover created but not yet confirmed |
| received | Receiver has confirmed delivery        |

Future states may include:

```
cancelled
expired
disputed
```

---

# 4. Data Model

Each handover record contains:

```
id
receiver_target_name
receiver_phone
item_summary
status
token
created_at
received_at
```

Purpose of each field:

| Field                | Purpose                    |
| -------------------- | -------------------------- |
| id                   | internal record id         |
| receiver_target_name | person receiving item      |
| receiver_phone       | WhatsApp contact           |
| item_summary         | quick description of items |
| status               | lifecycle state            |
| token                | QR verification token      |
| created_at           | creation timestamp         |
| received_at          | confirmation timestamp     |

---

# 5. Token Mechanism

Every handover generates a **unique token**.

Example:

```
abc92kfj32
```

This token becomes the QR destination:

```
https://nest-handover.vercel.app/r/{token}
```

Example:

```
https://nest-handover.vercel.app/r/abc92kfj32
```

The token is used to:

* identify the handover
* prevent manual editing
* allow quick scanning

---

# 6. QR Workflow

The QR is the core of the system.

Flow:

```
Sender creates handover
↓
System generates token
↓
QR code created
↓
QR shown to receiver
↓
Receiver scans
↓
Receiver page loads
↓
Receiver confirms item received
↓
System updates status
```

This removes the need for:

```
login
password
accounts
```

Everything runs through **secure tokens**.

---

# 7. User Roles

Currently the system only assumes two roles.

### Sender

Creates the handover.

Responsibilities:

```
enter receiver name
enter phone
enter items
generate QR
```

---

### Receiver

Receives item.

Responsibilities:

```
scan QR
confirm receipt
```

The receiver does not need an account.

---

# 8. UI Flow

User journey.

### Sender Flow

```
Dashboard
↓
Create Handover
↓
Fill Receiver Info
↓
Add Items
↓
Generate QR
```

---

### Receiver Flow

```
Scan QR
↓
Open token page
↓
Review item details
↓
Confirm receive
↓
Success screen
```

---

# 9. API Interaction

Current API endpoints.

```
POST /api/handover/create
GET  /api/handover/list
POST /api/handover/receive
GET  /api/token
```

These routes interact with **Supabase**.

---

# 10. Design Philosophy

The system prioritizes:

```
minimal friction
mobile-first UI
QR-based interaction
stateless verification
```

Meaning:

```
no login
no complex workflow
no app install required
```

Everything works through **browser + QR**.

---

# 11. Why This Matters

This prototype demonstrates a concept that can be used for:

```
micro logistics
warehouse transfer
courier confirmation
SME delivery verification
personal item exchange
```

Future expansions may include:

```
multi item tracking
photo verification
signature capture
delivery history
dispute resolution
```

But the prototype intentionally keeps the system **extremely simple**.

---

# 12. Current Limitations

As of this version:

```
no authentication
no access control
no analytics
no file storage
```

These will be added later if the concept proves useful.

---

# 13. Long Term Vision

This system may become part of the larger **NEST ecosystem**.

Potential modules:

```
NEST Logistics
NEST Warehouse
NEST Field Operations
NEST SME Tools
```

The handover QR concept becomes a **universal verification mechanism**.

---

# END
