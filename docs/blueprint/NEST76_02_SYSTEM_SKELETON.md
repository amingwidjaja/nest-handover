# NEST76 — System Skeleton

This document defines the **structural flow of the NEST76 system**.

It describes:

* screen structure
* user flow
* status transitions
* system interaction points

If developers or AI assistants get confused about how the system works,
**this document is the first place to check**.

---

# 1. Core Concept

NEST76 records **handover moments**.

A handover moment happens when:

```
Person A gives item
↓
Person B receives item
↓
System records proof
```

The system focuses on **simplicity and speed**.

Target completion time:

```
< 10 seconds
```

---

# 2. Core Flow

The main operational flow is:

```
Sender
↓
Create Handover
↓
Generate QR / Link
↓
Delivery happens
↓
Receiver scans QR
↓
Receiver confirms
↓
System records receive event
```

Public access format:

```
/r/{token}
```

Example:

```
https://nest-handover.vercel.app/r/abc123
```

---

# 3. System Screens

The system currently contains the following screens.

---

## HOME

Route

```
/
```

Purpose

Landing page.

Future purpose:

* quick access to create handover
* lightweight introduction to system

Currently minimal.

---

## DASHBOARD

Route

```
/dashboard
```

Purpose

Displays list of handover events created by the sender.

Content:

```
handover list
status indicators
receiver name
item summary
creation time
```

Possible future additions:

```
daily stats
handover counts
quick create button
```

---

## CREATE HANDOVER

Route

```
/create
```

Purpose

Sender creates a new handover record.

Input fields:

```
receiver_target_name
receiver_target_phone
item list
optional item photo
```

Interaction flow:

```
Add item
↓
Enter receiver info
↓
Generate QR
```

Result:

```
handover record created
share_token generated
```

---

## HANDOVER DETAIL

Route

```
/handover/{id}
```

Purpose

Displays a created handover.

Content:

```
receiver info
item list
QR code
share link
handover status
```

Sender uses this screen during delivery.

---

## HANDOVER SUCCESS

Route

```
/handover/{id}/success
```

Purpose

Shows confirmation that the handover has been completed.

Content:

```
receiver confirmation
timestamp
handover success message
```

---

## RECEIVE PAGE

Route

```
/r/{token}
```

Purpose

Public receive page accessed by scanning QR.

Content:

```
item description
receiver confirmation button
```

Interaction:

```
Receiver clicks TERIMA
↓
Receive event recorded
```

---

## RECEIVE ERROR PAGE

Route

```
/r/{token}/error
```

Purpose

Handles invalid token or expired handover.

Examples:

```
invalid token
handover already received
handover not found
```

System displays friendly error messages.

---

# 4. Sender Flow

Sender workflow:

```
Open dashboard
↓
Create handover
↓
Add items
↓
Enter receiver info
↓
Generate QR
↓
Deliver item
↓
Receiver scans QR
```

Sender may create multiple handovers before delivery.

---

# 5. Receiver Flow

Receiver workflow:

```
Scan QR
↓
Open receive page
↓
Review items
↓
Click TERIMA
↓
Receive event recorded
```

No login required.

Receiver identity is recorded at confirmation stage.

---

# 6. Status Lifecycle

Current system status flow:

```
draft
↓
created
↓
received
```

Meaning:

### draft

Handover is being prepared but not yet finalized.

### created

Handover is ready.

QR code can be used.

### received

Receiver confirmed delivery.

Handover becomes immutable.

---

# 7. Token System

Each handover contains a **share_token**.

Purpose:

```
public access
QR link generation
handover identification
```

Example link:

```
/r/a8fj29dk3
```

Token must be:

```
unique
unguessable
short enough for QR
```

---

# 8. Evidence Model

NEST records evidence in two stages.

### Stage 1 — Item Evidence

Recorded when sender prepares items.

Fields:

```
handover_items.photo_url
```

Optional.

---

### Stage 2 — Receive Evidence

Recorded when receiver confirms.

Fields:

```
receive_event.timestamp
receive_event.device_id
receive_event.gps_location
```

Optional but recommended.

---

# 9. System Philosophy

NEST must always remain:

```
simple
fast
human
friendly
```

The system must never become:

```
corporate
ERP-like
complex
training-heavy
```

Users must be able to operate NEST **without instructions**.

---

# 10. Design Goal

NEST should feel like:

```
a small smart tool
```

Not:

```
enterprise software
```

Users should think:

> “Oh, gampang banget.”

Instead of:

> “Ini software ribet.”

---

# END
