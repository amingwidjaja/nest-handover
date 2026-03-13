# NEST76 — Database Schema

---

# Table: handover

Represents a handover event.

Fields

id  
share_token  
status  

sender_name  

receiver_target_name  
receiver_target_phone  
receiver_target_email  

created_at  
received_at  

Status values

draft  
created  
received

Notes

share_token is used for public link access:

nest76.com/r/{share_token}

The receiver_target fields store a snapshot of the intended receiver.

---

# Table: handover_items

Represents items included in a handover.

Fields

id  
handover_id  
description  
photo_url  

Notes

Each item may have **one optional photo**.

Quantity is not used because the description field already allows flexible input.

Example descriptions

Mangga 2kg  
Laundry bag  
Dokumen kontrak  
Tas hitam

---

# Table: receive_event

Represents proof that the item has been received.

Fields

id  
handover_id  

receiver_name  
receiver_relation  

receive_method  

photo_proof  
device_id  

gps_location  

timestamp

Constraints

handover_id is UNIQUE

This ensures that a handover can only be received once.

---

# Receive Methods

receive_method values

direct_qr  
direct_photo  
proxy_qr  
proxy_photo

Explanation

direct_qr  
Receiver scans QR and confirms receive on their device.

direct_photo  
Sender takes a photo of the receiver as proof.

proxy_qr  
A proxy scans the QR code.

proxy_photo  
Sender takes a photo of the proxy receiver.

---

# Evidence Model

NEST records evidence in two stages.

Stage 1 — Item Evidence

handover_items.photo_url

Photo taken when the sender prepares the handover.

Stage 2 — Receive Evidence

receive_event.photo_proof  
receive_event.device_id  
receive_event.gps_location

This creates a trust chain:

Sender Evidence → Receive Evidence