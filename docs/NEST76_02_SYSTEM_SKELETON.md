# NEST76 — System Skeleton

---

# Core Flow

Sender  
↓  
Create Handover  
↓  
Generate QR / Link  
↓  
Delivery  
↓  
Receiver scans QR or opens link  
↓  
Receive Event Recorded

Public link format

nest76.com/r/{token}

---

# Sender Flow

Open NEST  
↓  
Create Handover  
↓  
Input receiver information  
↓  
Add item description  
↓  
Optional item photo  
↓  
Generate QR / link  
↓  
Delivery

Sender may prepare multiple handover events before delivery.

---

# Receiver Flow (Direct)

Receiver scans QR  
or opens link

↓  

View handover details  

↓  

Click TERIMA  

↓  

Receive event recorded

---

# Direct Receive Options

Direct receive can happen in two ways.

Option 1 — QR confirmation

Receiver scans QR  
Opens receive page  
Clicks TERIMA

Option 2 — Photo proof

Sender takes a photo of the receiver as proof.

This is used when the receiver cannot scan the QR code.

---

# Proxy Receive Flow

Sometimes the intended receiver is not present.

Sender selects proxy option.

System asks:

Name of proxy receiver  
Relation to receiver

Example

Budi  
Satpam

Sender then records proof using one of two methods:

Photo proof  
Proxy QR scan

---

# Status Flow

draft  
↓  
created  
↓  
received

draft

Handover is being prepared.

created

Handover is ready and QR / link can be used.

received

Receive event has been recorded.

---

# Screen List

HOME

List of prepared handover events.

CREATE HANDOVER

Create new event and add items.

HANDOVER DETAIL

View event and display QR.

RECEIVE PAGE

Receiver views items and confirms receive.

RECEIVE RESULT

Receive confirmation and proof recorded.