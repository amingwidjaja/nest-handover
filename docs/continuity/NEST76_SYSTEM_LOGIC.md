# NEST76 — System Logic

## Project

**NEST76 Handover System Prototype**

A lightweight QR-based handover system designed to prove a frictionless item transfer mechanism without requiring user accounts.

The system focuses on:

* simplicity
* speed
* trust verification

The main goal is to create **a verifiable proof of item transfer** using a minimal workflow.

---

# 1. Core Idea

Traditional delivery or transfer systems usually require:

* user accounts
* applications
* tracking numbers
* complex logistics workflow

NEST76 removes these requirements.

Instead it uses:

```
QR + token verification
```

The QR code becomes the **transfer verification key**.

The receiver simply scans the QR and confirms the item.

No login is required.

---

# 2. Current User Flow

The working flow in the prototype is:

```
PAKET (dashboard)
↓
CREATE (sender + receiver)
↓
PACKAGE (items + optional photo)
↓
SAVE / HANDOVER
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

Meaning:

1. Sender opens the **paket dashboard**.
2. Sender enters **sender and receiver information**.
3. Sender adds **items and optional package photo**.
4. System generates a **handover record**.
5. QR code is generated.
6. Receiver scans the QR.
7. Receiver confirms receipt.

This creates a **traceable digital transfer record**.

---

# 3. Status Model

The system currently uses the following lifecycle states.

```
created
process
delivered
accepted
```

Meaning:

| Status    | Meaning                 |
| --------- | ----------------------- |
| created   | Handover record created |
| process   | Package in transfer     |
| delivered | Receiver scanned QR     |
| accepted  | Receiver confirmed item |

Important rule:

```
PDF document is generated only when status = accepted
```

This ensures the document becomes a **final immutable proof of transfer**.

---

# 4. Data Model

Main table:

```
handover
```

Fields:

```
id
share_token
status
sender_name
receiver_target_name
receiver_target_phone
receiver_target_email
created_at
```

Items table:

```
handover_items
```

Fields:

```
id
handover_id
description
photo_url
```

Relationship:

```
handover
  ↓
handover_items
```

One handover may contain **multiple items**.

Package may contain **one optional photo**.

---

# 5. Token Mechanism

Each handover generates a unique token.

Example:

```
a4c92f83bde7
```

This token becomes the QR destination.

Example:

```
https://nest-handover.vercel.app/r/a4c92f83bde7
```

Purpose of token:

* identify the handover
* avoid manual editing
* allow quick scanning
* remove need for login

The token works as a **stateless verification key**.

---

# 6. QR Workflow

The QR system works as follows.

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
account creation
```

Everything runs through **token verification**.

---

# 7. Photo Handling

Package photos are captured from the device camera.

Processing happens **client-side**.

Process:

```
capture
↓
square crop
↓
resize (max 1200px)
↓
jpeg compression (0.8)
```

Typical result:

```
4MB camera image → 150–300KB
```

Purpose:

* reduce upload size
* reduce storage usage
* improve mobile speed

Photos use **square frame layout** so documents remain visually stable.

---

# 8. Document View

Once a handover reaches **accepted status**, the system generates a **document style page**.

Route:

```
/handover/[id]/document
```

This page shows:

* sender
* receiver
* item list
* package photo
* confirmation timestamp
* device info (future)
* GPS (future)

This page becomes the **final visual proof document**.

The page is **read-only**.

---

# 9. PDF Generation

PDF generation is triggered only after acceptance.

```
accepted
↓
compile document data
↓
generate PDF
↓
store PDF
↓
download link available
```

The download link appears inside:

```
/handover/[id]/document
```

PDF layout mirrors the document page.

---

# 10. UI Philosophy

The interface is designed for **non-technical users**.

Design principles:

```
mobile first
large tap targets
minimal text
clear actions
no complex forms
```

Example decisions:

* square photo layout
* simple text fields
* large capture button
* minimal navigation

The system assumes many users may be **not familiar with digital tools**.

---

# 11. API Interaction

Current API endpoints.

```
POST /api/handover/create
GET  /api/handover/list
POST /api/handover/receive
```

These endpoints interact with **Supabase PostgreSQL**.

---

# 12. Current Limitations

Current prototype limitations:

```
no authentication
no permission roles
no analytics
no dispute handling
```

These features may be added after the core workflow is proven stable.

---

# 13. Long Term Vision

The handover mechanism may become a module inside the **NEST ecosystem**.

Possible modules:

```
NEST Logistics
NEST Warehouse
NEST Field Operations
NEST SME Tools
```

The QR transfer model may become a **universal verification mechanism**.

---

# Development Mode Note

This project is currently in **active development mode**.

Important rules for collaboration:

1. Avoid micro patch instructions.
2. Prefer **full file updates**.
3. Maintain the current flow:

```
paket → create → package → handover
```

4. The system is evolving from **prototype → production grade**.

---

END OF DOCUMENT
