# NEST76 — Infrastructure Stack

## Project

**NEST76 Handover System Prototype**

A lightweight QR-based handover system used to test NEST architecture principles:

* frictionless exchange
* mobile-first UI
* token-based verification
* Supabase-backed data layer

---

# 1. Hosting Architecture

### Frontend Hosting

Platform: **Vercel**

Reason:

* Native support for **Next.js App Router**
* Auto deploy from **GitHub**
* Edge performance
* Simplifies CI/CD

Production URL example:

```
https://nest-handover.vercel.app
```

Deployment flow:

```
GitHub push
     ↓
Vercel auto build
     ↓
Live deployment
```

No local server required for normal development.

---

# 2. Framework

Framework used:

```
Next.js 14
App Router architecture
```

Core characteristics:

* Server components
* API routes inside `/app/api`
* File-based routing
* Edge-ready deployment

Tech stack:

```
Next.js
React
TypeScript
TailwindCSS
Lucide Icons
```

---

# 3. Database Layer

Database Provider:

```
Supabase
(PostgreSQL)
```

Connection handled through:

```
/app/lib/supabase.ts
```

Purpose:

* store handover data
* generate tokens
* track status

Database schema location:

```
/supabase/001_nest76_core_schema.sql
```

This SQL file defines the initial data structure.

---

# 4. Domain Structure

Current environment:

```
Production
https://nest-handover.vercel.app
```

Future architecture (planned):

```
handover.nest.id
handover.nest.systems
handover.nest76.io
```

---

# 5. API Layer

Next.js API routes used.

Location:

```
/app/api
```

Current endpoints:

```
/api/handover/create
/api/handover/list
/api/handover/receive
/api/token
```

Architecture:

```
Client UI
     ↓
Next.js API Route
     ↓
Supabase
     ↓
PostgreSQL
```

---

# 6. Routing Architecture

Main pages:

```
/dashboard
/create
/handover/[id]
/r/[token]
```

Meaning:

| Route            | Purpose             |
| ---------------- | ------------------- |
| `/dashboard`     | list of handovers   |
| `/create`        | create new handover |
| `/handover/[id]` | handover detail     |
| `/r/[token]`     | receiver scan page  |

Token route is designed for QR scanning.

---

# 7. File Structure

Current project structure:

```
NEST-HANDOVER
│
├ app
│   ├ api
│   │   └ handover
│   │       ├ create
│   │       │   └ route.ts
│   │       ├ list
│   │       │   └ route.ts
│   │       ├ receive
│   │       │   └ route.ts
│   │       └ token
│   │           └ route.ts
│   │
│   ├ lib
│   │   └ supabase.ts
│   │
│   ├ create
│   │   └ page.tsx
│   │
│   ├ dashboard
│   │   └ page.tsx
│   │
│   ├ handover
│   │   └ [id]
│   │       ├ page.tsx
│   │       └ success.tsx
│   │
│   ├ r
│   │   └ [token]
│   │       ├ page.tsx
│   │       └ error.tsx
│   │
│   ├ layout.tsx
│   ├ page.tsx
│   ├ globals.css
│   └ favicon.ico
│
├ components
│   ├ HandoverList.tsx
│   ├ HandoverLoading.tsx
│   └ ui.tsx
│
├ docs
│   ├ blueprint
│   └ continuity
│
├ supabase
│   └ 001_nest76_core_schema.sql
│
├ public
│
├ package.json
├ next.config.ts
├ tsconfig.json
└ README.md
```

---

# 8. UI Framework

Styling uses:

```
TailwindCSS
```

Design system components located in:

```
/components
```

Examples:

```
HandoverList.tsx
HandoverLoading.tsx
ui.tsx
```

---

# 9. QR Workflow

System logic:

```
Create handover
     ↓
Generate token
     ↓
Create QR link

https://nest-handover.vercel.app/r/{token}
     ↓
Receiver scans QR
     ↓
Receive page
     ↓
Confirm handover
```

This flow removes the need for user accounts.

---

# 10. Development Model

Current workflow:

```
AI assisted development
Direct GitHub editing
Auto deploy via Vercel
Supabase as backend
```

Development is currently **cloud-first** rather than local-first.

Meaning:

```
Edit
↓
Commit
↓
Push
↓
Vercel build
↓
Test live
```

---

# 11. Purpose of Prototype

This system exists to validate:

```
QR-based handover verification
tokenized delivery confirmation
mobile-first logistics UI
lightweight operational tools
```

Future direction:

```
courier micro-ops
warehouse proof-of-transfer
SME delivery tracking
```

The architecture is intentionally simple so it can scale later into the **NEST ecosystem**.
