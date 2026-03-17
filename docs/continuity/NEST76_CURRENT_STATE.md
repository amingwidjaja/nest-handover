# NEST76 — Current Development State

This document describes the **current real state of the NEST76 prototype** so development can continue in another conversation or environment without losing context.

This document is intentionally practical.

It focuses on:

* what already works
* what is currently being built
* what is currently broken
* what the next developer should do

---

# 1. System Overview

Project:

NEST76 Handover System

Purpose:

A lightweight QR-based item handover system.

Core idea:

```
Create transfer
Generate QR
Receiver scans
Receiver confirms
Proof of transfer created
```

No accounts are required.

The system uses **token-based verification**.

---

# 2. Current User Flow

The actual UI flow currently implemented is:

```
HOME (paket dashboard)
↓
CREATE
↓
PACKAGE
↓
SAVE / HANDOVER
↓
QR GENERATED
↓
RECEIVER SCAN
↓
RECEIVER CONFIRM
↓
DOCUMENT
```

Meaning:

Step 1
User opens dashboard.

Step 2
User creates a handover.

Step 3
User adds items and optional package photo.

Step 4
System generates a handover record.

Step 5
QR code is generated.

Step 6
Receiver scans QR.

Step 7
Receiver confirms delivery.

Step 8
Document page becomes final proof.

---

# 3. Current Database Tables

Main tables currently used:

```
handover
handover_items
receive_event
```

---

## handover

Main transfer record.

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

Status lifecycle currently planned:

```
created
process
delivered
accepted
```

---

## handover_items

Stores item list.

Fields:

```
id
handover_id
description
photo_url
```

Each handover can contain multiple items.

---

## receive_event

Stores confirmation event.

Used when receiver confirms handover.

---

# 4. Current Pages

Important routes:

```
/                 → paket dashboard
/create           → sender + receiver form
/package          → items + photo
/handover/[id]    → handover screen
/r/[token]        → receiver scan page
/handover/[id]/document → document view
```

---

# 5. Current API Endpoints

```
POST /api/handover/create
GET  /api/handover/list
POST /api/handover/receive
```

---

# 6. Photo Handling

Photo capture uses mobile camera.

Processing steps:

```
capture
↓
square crop
↓
resize max 1200px
↓
jpeg compression 0.8
```

Typical result:

```
4MB image → 150-300KB
```

Photos use **square layout** to keep document layout stable.

---

# 7. Current UI Philosophy

The UI is designed for:

```
non technical users
mobile first
minimal friction
```

Design rules:

```
large tap targets
simple forms
few steps
clear navigation
```

---

# 8. Features Already Working

These parts already work.

```
create handover
insert to Supabase
generate token
QR generation
item input
photo capture
database insert
basic routing
```

Database insert for:

```
handover
handover_items
```

is working.

---

# 9. Current Development Work

The system is currently focusing on **document workflow**.

Main features being built:

### Document page

```
/handover/[id]/document
```

This page will show:

```
sender
receiver
items
package photo
timestamp
```

This page becomes **read-only proof document**.

---

### PDF generation

Planned behavior:

```
status = accepted
↓
compile document
↓
generate PDF
↓
show download link
```

The PDF mirrors the document layout.

---

# 10. Current Issues

Several issues are currently being debugged.

---

## Dashboard not showing items

Problem:

Newly created handovers do not appear in dashboard.

Possible cause:

Dashboard filtering by status.

Example problem:

```
dashboard only reads status = process
```

while new records are:

```
status = created
```

Result:

Items exist in database but are not displayed.

---

## Event page showing empty data

Problem:

When clicking event from dashboard, item details sometimes appear empty.

Likely cause:

Query not joining `handover_items`.

---

## Receiver email / phone confusion

Create page currently allows:

```
phone OR email
```

The value is stored in:

```
receiver_target_phone
```

Email detection logic has not yet been implemented.

---

# 11. Current Development Environment

Stack:

```
Next.js 14
App Router
TypeScript
TailwindCSS
Supabase PostgreSQL
Vercel hosting
```

Deployment:

```
Git push
↓
Vercel build
↓
Live deploy
```

Local environment is optional.

Most development is done **directly through GitHub + Vercel**.

---

# 12. Important Development Rule

This project follows a strict rule:

```
Prefer FULL FILE updates.
Avoid patch instructions.
```

Reason:

The main developer works mostly through:

```
mobile
github web editor
AI collaboration
```

Patch instructions are difficult to apply.

---

# 13. Current Priority

Current priority tasks:

1. Fix dashboard data loading
2. Ensure event page shows items
3. finalize document view
4. implement PDF generation
5. finalize photo optimization
6. polish create / package flow

---

# 14. Future Features

Planned features:

```
GPS capture
device fingerprint
signature capture
delivery history
dispute handling
```

These are not yet implemented.

---

# 15. Development Context

The current development approach is:

```
AI assisted coding
rapid iteration
cloud-first workflow
```

The goal is to quickly validate the **QR-based handover verification model**.

If the concept works, it may expand into:

```
micro logistics
warehouse transfer verification
SME delivery tools
```

and later integrate into the **NEST ecosystem**.

---

END OF DOCUMENT
