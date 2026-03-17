flowchart TD

A[Create] --> created

B[Scan QR] --> C[Receive Page]

C --> D[/api/handover/receive]

D -->|direct| accepted
D -->|proxy| received

accepted --> E[Success Page]
received --> E

E --> F[Auto Redirect]
F --> G[Dashboard]