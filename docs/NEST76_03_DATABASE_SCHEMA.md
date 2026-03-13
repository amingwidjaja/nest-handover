# NEST76 — Database Schema

---

# Table: handover

Fields

id
created_at
sender_name
receiver_target_name
receiver_target_contact
status

Status values

created
received
proxy_received

---

# Table: handover_items

Fields

id
handover_id
description
qty
photo_url

Example item descriptions:

Mangga 2kg
Laundry bag
Dokumen kontrak

---

# Table: receive_event

Fields

id
handover_id
receiver_name
receiver_contact
receive_method
photo_proof
gps_location
timestamp

receive_method values

direct
proxy