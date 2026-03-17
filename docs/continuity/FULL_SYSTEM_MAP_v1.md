flowchart LR

%% ======================
%% UI LAYER
%% ======================

subgraph UI

A[/paket<br/>Landing]
B[/create]
C[/package<br/>Input Barang + Foto]
D[/handover/:id<br/>Main Page]
E[/qr/:id<br/>QR Generator]
F[/receive/:token<br/>Confirm Page]
G[/dashboard]
H[/receipt/:token]
I[/verify/:token]

end

%% ======================
%% API LAYER
%% ======================

subgraph API

API1[/api/handover/create]
API2[/api/handover/list]
API3[/api/handover/by-token]
API4[/api/handover/status]
API5[/api/handover/receive]
API6[/api/handover/qr]
API7[/api/handover/receipt]

end

%% ======================
%% DATABASE
%% ======================

subgraph DB

DB1[(handover)]
DB2[(handover_items)]
DB3[(receive_event)]

end

%% ======================
%% FLOW: CREATE
%% ======================

A --> B
B --> C
C --> API1
API1 --> DB1
API1 --> DB2

DB1 --> D

%% ======================
%% FLOW: HANDOVER
%% ======================

D --> E
E --> F

%% ======================
%% FLOW: RECEIVE
%% ======================

F --> API5

API5 --> DB3
API5 --> DB1

%% ======================
%% STATUS LOGIC
%% ======================

DB3 -->|receiver_type = direct| S1[accepted]
DB3 -->|receiver_type = proxy| S2[received]

S1 --> DB1
S2 --> DB1

%% ======================
%% FLOW: DASHBOARD
%% ======================

A --> API2
API2 --> DB1
DB1 --> G

%% ======================
%% FLOW: RECEIPT
%% ======================

F --> H
H --> API3
API3 --> DB1
API3 --> DB3

H --> API7

%% ======================
%% FLOW: VERIFY
%% ======================

H --> I
I --> API3
API3 --> DB1

%% ======================
%% QR SYSTEM
%% ======================

D --> API6
API6 --> E

E --> API4
API4 --> DB1

DB1 -->|status change| G