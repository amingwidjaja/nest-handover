flowchart TD

A[Landing /paket] --> B[Create /create]

B --> C[POST /api/handover/create]

C --> D[Handover Page /handover/:id]

D --> E[QR Page /qr/:id]

E --> F[Receiver Scan QR]

F --> G[Receive Page /receive/:token]

G --> H[POST /api/handover/receive]

H --> I{receiver_type}

I -->|direct| J[Status: accepted]
I -->|proxy| K[Status: received]

J --> L[Success Page]
K --> L

L --> M[Dashboard]

M --> N[Receipt /receipt/:token]

N --> O[Verify /verify/:token]