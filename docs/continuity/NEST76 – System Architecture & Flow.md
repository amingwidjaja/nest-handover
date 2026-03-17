# NEST76 – Infrastructure Specification

This document defines the **technical infrastructure** used in the NEST76 project.

The purpose is to allow development to continue in another environment or conversation without losing system context.

---

# 1. Development Environment

Development is primarily **cloud based**.

Local development is optional.

Code editing may happen via:

* GitHub web editor
* VSCode
* Cursor
* AI collaboration environments

The system uses **Git push → automatic deployment**.

---

# 2. Source Control

Repository platform:

```
GitHub
```

Repository structure:

Single repository containing frontend and API routes.

Typical structure:

```
app/
components/
public/
```

Key folders:

```
app/ → Next.js App Router pages
components/ → reusable UI components
```

---

# 3. Hosting Platform

Hosting provider:

```
Vercel
```

Purpose:

* Next.js application hosting
* automatic CI/CD deployment

Deployment flow:

```
git push
↓
Vercel build
↓
automatic deployment
```

The build environment is a Node.js runtime provided by Vercel.

---

# 4. Application Framework

Framework:

```
Next.js
```

Router:

```
Next.js App Router
```

Language:

```
TypeScript
```

UI Library:

```
React
```

Styling:

```
Tailwind CSS
```

Icons:

```
lucide-react
```

---

# 5. Database Infrastructure

Database platform:

```
Supabase
```

Database type:

```
PostgreSQL
```

Supabase is used for:

* data storage
* future authentication
* realtime features
* serverless backend capabilities

Connection type:

```
Supabase client SDK
```

---

# 6. Backend Strategy

Backend currently runs through:

```
Next.js API Routes
```

Example location:

```
app/api/handover/
```

Routes handle:

* create handover
* receive confirmation
* retrieve handover list

Future architecture may include:

```
Supabase Edge Functions
```

---

# 7. API Endpoints (Current)

Current endpoints:

```
POST /api/handover/create
GET  /api/handover/list
POST /api/handover/receive
```

Create endpoint payload example:

```
{
  sender_name,
  receiver_target_name,
  receiver_target_phone,
  receiver_target_email,
  items:[]
}
```

---

# 8. Database Tables

Current tables:

```
handover
handover_items
receive_event
```

handover → main transfer record
handover_items → item list
receive_event → receiver confirmation log

Relationship:

```
handover
  ↓
handover_items
```

---

# 9. QR Code System

QR codes are generated in the frontend.

Library:

```
react-qr-code
```

QR format:

```
/r/{token}
```

Example:

```
/r/ab93d83f2
```

Dynamic route:

```
app/r/[token]/page.tsx
```

---

# 10. Domain Configuration

Current deployment:

```
https://nest-handover.vercel.app
```

Future production domain:

```
nest76.app
```

QR URL generation should rely on:

```
window.location.origin
```

This ensures compatibility with:

* preview deployments
* production
* staging environments

---

# 11. Deployment Pipeline

Deployment uses Vercel CI/CD.

Process:

```
git add .
git commit -m "update"
git push
```

Vercel then:

```
detects update
builds project
deploys application
```

---

# 12. Media Handling

Package photos are captured via mobile camera.

Optimization occurs **client-side** before upload.

Processing:

```
square crop
resize max 1200px
jpeg compression 0.8
```

Purpose:

```
reduce bandwidth
reduce storage cost
improve speed
```

The system avoids storing **raw camera images**.

---

# 13. Architecture Philosophy

Infrastructure is intentionally:

```
lightweight
serverless
scalable
low maintenance
```

The stack relies heavily on:

```
Vercel + Supabase
```

to minimize operational complexity.

---

# Development Mode Note

The system is currently under **active development**.

Important collaboration rules:

1. Avoid incremental patch instructions.
2. Prefer **complete file updates**.
3. Maintain alignment with the system blueprint.

Current flow:

```
paket → create → package → handover
```

---

END OF DOCUMENT
