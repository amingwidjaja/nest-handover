# NEST76 – Infrastructure Specification

This document defines the **technical infrastructure** used in the NEST76 project so that development can continue in another environment or conversation without losing system context.

---

# 1. Development Environment

Development is **cloud-based**.

There is **no mandatory local development workflow**.

Code editing may happen via:

* GitHub web editor
* VSCode / Cursor / other editors
* AI collaboration environments

The system is designed to rely on **Git push → automatic deployment**.

---

# 2. Source Control

Repository Platform:

GitHub

Repository Structure:

Single repository containing frontend and API routes.

Typical structure:

app/
components/
public/

Key folders:

app/ → Next.js App Router pages
components/ → reusable UI components

---

# 3. Hosting Platform

Hosting Provider:

Vercel

Purpose:

* Next.js application hosting
* automatic CI/CD deployment

Deployment type:

Git-based deployment.

Deployment flow:

Git push
↓
Vercel build
↓
Automatic deployment

Build environment:

Node.js environment provided by Vercel.

---

# 4. Application Framework

Framework:

Next.js

Router:

Next.js **App Router**

Language:

TypeScript

UI Library:

React

Styling:

Tailwind CSS

Icon library:

lucide-react

---

# 5. Database Infrastructure

Database Platform:

Supabase

Database Type:

PostgreSQL

Supabase is used for:

* data storage
* authentication (future)
* serverless backend functions (future)
* realtime features (future)

Connection type:

Supabase REST / client SDK

---

# 6. Backend Strategy

Backend is currently implemented via:

Next.js API routes.

Location example:

app/api/

These routes will act as:

* create handover
* receive confirmation
* data retrieval

Future architecture may include:

Supabase Edge Functions.

---

# 7. QR Code System

QR generation is handled in the frontend.

Library used:

react-qr-code

QR codes encode a URL structure:

/r/{token}

Example:

/r/nst-76-x9y2z

The URL resolves to:

Next.js dynamic route:

app/r/[token]/page.tsx

---

# 8. Domain Configuration

Current deployment domain:

https://nest-handover.vercel.app

Future production domain planned:

nest76.app

QR URL generation should rely on:

window.location.origin

This ensures compatibility with:

* preview deployments
* production domain
* staging environments

---

# 9. Deployment Pipeline

The project uses **automatic deployment** via Vercel.

Process:

1. Developer pushes code to GitHub
2. Vercel detects repository update
3. Vercel builds the project
4. Deployment becomes available

Typical commands:

git add .
git commit -m "update"
git push

---

# 10. File Structure (Current)

Simplified structure:

app/

create/page.tsx
dashboard/page.tsx
handover/[id]/page.tsx
r/[token]/page.tsx

components/

HandoverList.tsx
HandoverLoading.tsx

public/

static assets if needed

---

# 11. Environment Variables

Environment variables will be stored in:

Vercel project settings.

Typical variables:

SUPABASE_URL
SUPABASE_ANON_KEY

These values are injected during deployment.

---

# 12. Architecture Philosophy

The infrastructure is intentionally designed to be:

* lightweight
* serverless
* scalable
* simple to deploy

The stack relies heavily on:

Vercel + Supabase

to reduce operational overhead.

---

END OF DOCUMENT
