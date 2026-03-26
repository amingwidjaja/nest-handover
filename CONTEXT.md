# NEST76 STUDIO — Project Context
> Baca file ini di awal setiap chat baru untuk menyambung konteks.
> Last updated: 2026-03-27 (v5 — Sprint 1,2,3 done)

---

## Visi & Positioning

**NEST76 STUDIO** adalah SaaS Tanda Terima Digital (TTD) untuk personal, inter-office, dan UMKM Indonesia.
- Tool kecil, free, bisa dipakai siapapun
- Pilot project untuk 2 sistem besar: **sistem pabrik** dan **sistem sekolah**
- Semua sistem akan pakai arsitektur SaaS yang sama

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth + DB + Cron | Supabase (PostgreSQL + Auth + Storage + Edge Functions + pg_cron) |
| Deploy | Vercel (frontend only) |
| Notifications | Meta WhatsApp Cloud API |
| Maps | Mapbox GL (deps ada, GPS page masih Leaflet) |
| PDF | @react-pdf/renderer + Puppeteer (di Supabase) |
| Animation | Framer Motion |

---

## 4 Aktor dalam Sistem

```
1. User app        — yang login dan buat dokumen
2. Pengirim asli   — pemilik paket (bisa = user, bisa orang lain)
3. Penerima target — yang seharusnya menerima
4. Proxy penerima  — yang menerima secara fisik jika target tidak ada
```

User bisa jadi **pengirim langsung** (`is_sender_proxy=false`) atau **proxy pengirim** (`is_sender_proxy=true`).

---

## 4 Skenario + WA Logic

**SATU trigger WA: status → `received`** (bukan `created` — masih bisa cancel)

| Skenario | WA ke penerima target | WA ke pengirim asli |
|---|---|---|
| A: User=pengirim, penerima langsung | ✅ | ❌ (lihat dashboard) |
| B: User=pengirim, proxy penerima | ✅ link approve | ❌ (lihat dashboard) |
| C: User=proxy pengirim, penerima langsung | ✅ | ✅ "paketmu diterima" |
| D: User=proxy pengirim, proxy penerima | ✅ link approve | ✅ "diterima proxy" |

Auto-accept 3 hari → WA ke pengirim asli jika `is_sender_proxy=true`

### Template aktif (Meta)
```
Name: nest76_studio_handoff | Lang: id | Status: Active–Quality pending
Body: "Halo, Anda menerima paket dari {{1}}.
       Lihat bukti pengiriman: {{2}}
       Bukti ini dibuat menggunakan NEST76 PAKET, product of NEST76 STUDIO."
{{1}} = senderLabel  {{2}} = proofLink
```

---

## Lifecycle & Status

```
draft → created → received → accepted
```

- **`created`** — siap kirim, bisa cancel/edit. Serial + token sudah ada. **Tidak ada WA.**
- **`received`** — serah terima fisik terjadi. receive_event ditulis. **WA dikirim.**
- **`accepted`** — penerima approve atau 3 hari auto-accept. PDF di-generate.

### DB Triggers
- `trg_receive_event_update_handover` → `derive_handover_status()`
  - `receiver_type=direct` → status=`accepted`
  - `receiver_type=proxy` → status=`received`
- `trg_on_handover_accepted` → `fn_on_handover_accepted()` via pg_net
  - Fire `notify-handover` Edge Fn → chain ke `receipt-worker`

### pg_cron
- `auto-accept-stale-handovers` — setiap jam, received > 3 hari → accepted

---

## Dua Mode

### NEST-Lite
- No address, GPS opsional, `sender_name` bebas
- UMKM: transaksi isolated per member (boss tidak lihat staff)

### NEST-Pro
- Full address + Mapbox geocoding, GPS non-blocking
- UMKM: semua staff masuk dashboard boss, `sender_name` locked ke `company_name`

---

## UMKM Visibility (query rule di `/api/handover/list`)

| Kondisi | Query |
|---|---|
| OWNER + Pro | `WHERE org_id = profile.org_id` |
| Semua lainnya | `WHERE user_id = auth.uid()` |

Dashboard kirim `?mode=lite\|pro` ke API untuk trigger rule ini.

---

## Data Retention

Setelah `accepted` + PDF done:
1. Foto Storage → **dihapus** (`cleanup-handover` Edge Fn)
2. Row DB → **archived** (`record_status = 'archived'`)
3. PDF → permanen di Storage

---

## Database Schema

```
auth.users
  └── profiles              user_type, org_id, role (OWNER/STAFF), company_name, display_name
  └── handover              status, user_id, org_id, staff_id, tenant_id,
                            share_token, serial_number, record_status,
                            is_sender_proxy, sender_whatsapp  ← BARU (migration done)
        └── handover_items  description, photo_url
        └── receive_event   photo_url, gps_lat/lng, device_id, is_valid, receiver_type
  └── organizations         name, owner_id, invite_code
  └── handover_serial_counter  [XX]-[YYMM]-[SEQ]
  └── tenant                default: "public"
```

---

## Arsitektur Folder

```
app/
├── (studio)/              ← SHARED LAYOUT
│   ├── layout.tsx         ← StudioHeader z-[50] + main pt-24 pb-44 + StudioFooter z-[50]
│   ├── paket/             ← /paket hub
│   ├── dashboard/         ← /dashboard (fetch profile + mode → API ?mode=)
│   ├── profile/
│   └── handover/create/   ← server component → HandoverCreateForm
├── handover/
│   ├── select/            ← pilih Lite/Pro
│   ├── [id]/              ← receiver confirmation (dead code cleaned)
│   │   ├── preview/       ← upload foto dengan progress bar (XHR)
│   │   ├── location/      ← GPS non-blocking, tombol "Lewati"
│   │   └── qr/
├── receipt/[token]/       ← public receipt + acceptance
├── package/               ← input barang + foto
└── api/handover/
    ├── create/   ← baca is_sender_proxy + sender_whatsapp, WA tidak dikirim di sini
    ├── list/     ← visibility rule by role+mode
    ├── receive/  ← insert receive_event → WA fired here (fire-and-forget)
    │   └── location/confirm/  ← GPS non-blocking
    ├── upload-photo/  ← upsert: true (fix retake bug)
    └── ...
```

---

## Edge Functions (Supabase)

| Function | Status | Tujuan |
|---|---|---|
| `notify-handover` | ✅ Deployed | Central dispatcher: received→WA, accepted→PDF chain |
| `receipt-worker` | ✅ Deployed | Generate PDF |
| `cleanup-handover` | ✅ Deployed | Hapus foto + archive row setelah PDF done |

### Secrets di Supabase Edge Functions
```
WA_TOKEN              = [Meta token]
WA_PHONE_NUMBER_ID    = 62817781197
WA_TEMPLATE_NAME      = nest76_studio_handoff
WA_TEMPLATE_LANG      = id
NEXT_PUBLIC_APP_URL   = https://www.nest76.com
NEST_INTERNAL_SECRET  = nest76-internal-2026
```
Note: ada secret `nest-handover` yang tidak bisa dihapus (UI bug) — tidak berbahaya.

---

## WhatsApp Helper Functions (`lib/whatsapp.ts`)

- `sendNest76StudioHandoff()` — core send
- `notifyReceiver()` — ke penerima target, link `/receipt/[token]`
- `notifySenderProxy()` — ke pengirim asli jika proxy

---

## Design System

- **Primary**: `#3E2723` | **Background**: `#FAF9F6`
- **Muted**: `#A1887F`, `#5D4037` | **Border**: `#E0DED7`
- **Font**: Geist Sans + Geist Mono | **Ease**: `[0.22, 1, 0.36, 1]`

### Z-Index
```
z-[60] → Action bar (dashboard), Toast
z-[50] → StudioHeader, StudioFooter
auto   → Main content (pt-24 pb-44)
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WA_TOKEN=
WA_PHONE_NUMBER_ID=
WA_TEMPLATE_NAME=nest76_studio_handoff
WA_TEMPLATE_LANG=id
NEXT_PUBLIC_APP_URL=https://www.nest76.com
NEXT_PUBLIC_MAPBOX_TOKEN=
```

### Supabase Info
- Project ref: `hvuvtepwwjpovzauxrjg`
- Edge Fn URL: `https://hvuvtepwwjpovzauxrjg.supabase.co/functions/v1/`

---

## Backlog

### Sprint 1 ✅ DONE
- [x] Fix `studioRole` fetch di DashboardPage
- [x] Hapus dead code di `/handover/[id]/page.tsx`
- [x] GPS non-blocking + tombol "Lewati"
- [x] `lib/whatsapp.ts` updated ke template aktual
- [x] Folder backup dihapus

### Sprint 2 ✅ DONE
- [x] Visibility rule di `/api/handover/list` by role+mode
- [x] Dashboard kirim `?mode=` ke API
- [x] `is_sender_proxy` + `sender_whatsapp` wire: form → localStorage → payload → DB
- [x] `/api/handover/create` baca proxy fields
- [x] `app/package/page.tsx` proxy fields di payload
- [x] SQL migration kolom proxy done

### Sprint 3 ✅ DONE
- [x] WA notif di `/api/handover/receive` (fire-and-forget)
- [x] pg_cron auto-accept 3 hari (migration 035)
- [x] pg_net trigger on accepted → notify-handover
- [x] Edge Functions deployed + secrets set
- [x] `notify-handover` updated dengan isAuthorized()
- [x] `cleanup-handover` fixed (full path bug)
- [x] Upload foto: progress bar XHR, upsert:true fix retake

### Sprint 4 — Data & PDF
- [ ] Trigger `cleanup-handover` — perlu pg_cron atau dipanggil setelah receipt-worker selesai
- [ ] Verifikasi receipt-worker flow end-to-end (test dengan handover nyata)
- [ ] Halaman sukses untuk penerima setelah accept (sekarang redirect ke /dashboard)

### Sprint 5 — Polish & Maps
- [ ] Migrate GPS page dari Leaflet ke Mapbox
- [ ] Address autocomplete NEST-Pro (Mapbox)
- [ ] UMKM Pro: lock sender_name ke company_name di form
- [ ] UI/UX review pass setelah test

---

## Cara Pakai di Chat Baru

Ketik: **"Baca CONTEXT.md di `C:\GitHub\NEST\nest-handover\CONTEXT.md` lalu lanjutkan Sprint [N]"**
