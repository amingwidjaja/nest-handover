# NEST76 STUDIO — Project Context
> Baca file ini di awal setiap chat baru untuk menyambung konteks.
> Last updated: 2026-03-27 (v6 — Sprint 1,2,3,4 done, flow tested)

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
| Maps | Azure Maps (`azure-maps-control`) |
| PDF | @react-pdf/renderer + Puppeteer (di Supabase) |
| Animation | Framer Motion |

---

## Supabase Info
- Project ref: `hvuvtepwwjpovzauxrjg`
- Edge Fn URL: `https://hvuvtepwwjpovzauxrjg.supabase.co/functions/v1/`

## WA Config (penting!)
- `WA_PHONE_NUMBER_ID` = `1079409528584174` (bukan nomor telepon!)
- `WA_TEMPLATE_NAME` = `nest76_studio_handoff`
- `WA_TEMPLATE_LANG` = `id`
- Harus di-set di **DUA tempat**: Vercel env vars + Supabase Edge Functions Secrets
- Token bersifat permanent

---

## 4 Aktor dalam Sistem

```
1. User app        — yang login dan buat dokumen
2. Pengirim asli   — pemilik paket (bisa = user, bisa orang lain → is_sender_proxy=true)
3. Penerima target — yang seharusnya menerima
4. Proxy penerima  — yang menerima secara fisik jika target tidak ada
```

---

## WA Logic

**SATU trigger WA: status → `received`** (bukan `created`)

| Skenario | WA ke penerima target | WA ke pengirim asli |
|---|---|---|
| A: User=pengirim, penerima langsung | ✅ | ❌ |
| B: User=pengirim, proxy penerima | ✅ | ❌ |
| C: User=proxy pengirim, penerima langsung | ✅ | ✅ |
| D: User=proxy pengirim, proxy penerima | ✅ | ✅ |

Auto-accept 3 hari → WA ke pengirim asli jika `is_sender_proxy=true`

### Template aktif (Meta)
```
Name: nest76_studio_handoff | Lang: id | Status: Active ✅
Body: "Halo, Anda menerima paket dari {{1}}.
       Lihat bukti pengiriman: {{2}}
       Bukti ini dibuat menggunakan NEST76 PAKET, product of NEST76 STUDIO."
```

---

## Lifecycle & Status

```
draft → created → received → accepted
              ↘ rejected
```

- `created` — bisa cancel/edit. **Tidak ada WA.**
- `received` — serah terima terjadi. **WA dikirim.**
- `accepted` — approve atau 3 hari auto-accept. PDF di-generate.
- `rejected` — penerima tolak dari link WA. **WA ke pengirim dikirim** (dengan alasan jika diisi).

### DB Triggers
- `trg_receive_event_update_handover` → `derive_handover_status()`
  - `receiver_type=direct` → status=`accepted`
  - `receiver_type=proxy` → status=`received`
- `trg_on_handover_accepted` → pg_net → `notify-handover` Edge Fn → `receipt-worker`

### pg_cron
- `auto-accept-stale-handovers` — setiap jam, received > 3 hari → accepted

---

## Flow Serah Terima (GPS Silent)

```
Pengirim buka [id]/page
  → GPS start silent background (watchPosition, simpan ke sessionStorage)
  → Pilih mode: direct atau delegate (+ nama wakil + hubungan)

Foto flow:
  → Tap foto → compress background → /preview
  → Upload foto + GPS inline → POST /receive (SATU insert)
  → Redirect → /handover/[id]/success

QR flow:
  → Tap QR → meta disimpan → /qr page tampil QR
  → QR URL encode: /receive/[token]?rt=proxy&rn=NamaWakil&rr=Hubungan
  → Penerima scan → /receive/[token] → lihat detail dokumen → tap "Terima Paket"
  → POST /receive (GPS penerima inline)
  → [id]/qr polling → deteksi received → redirect /success
```

**PENTING: GPS tidak pernah trigger job terpisah — selalu inline dalam satu POST /receive**

---

## Storage Layout (SaaS Ready)

```
nest-evidence bucket:
  paket/
    {user_id}/
      {handover_id}/
        paket_{timestamp}.webp    ← foto produk
        proof_{timestamp}.webp    ← foto bukti serah terima
        receipt_{handover_id}.pdf ← PDF tanda terima
```

1 folder = 1 transaksi → delete mudah via `deleteHandoverStorage(userId, handoverId)`

---

## UMKM Visibility (`/api/handover/list`)

| Kondisi | Query |
|---|---|
| OWNER + Pro | `WHERE org_id = profile.org_id` |
| Semua lainnya | `WHERE user_id = auth.uid()` |

Dashboard kirim `?mode=lite|pro` ke API.

---

## Edge Functions (Supabase)

| Function | Status | Tujuan |
|---|---|---|
| `notify-handover` | ✅ Deployed | Central dispatcher: received→WA, accepted→PDF chain |
| `receipt-worker` | ✅ Deployed | Generate PDF |
| `cleanup-handover` | ✅ Deployed | Hapus foto + archive row setelah PDF done |

### Auth notify-handover
- Service role key (dari Next.js server)
- `x-internal-secret: nest76-internal-2026` (dari pg_net DB trigger)

---

## Arsitektur Folder

```
app/
├── (studio)/              ← StudioHeader z-[50] + main pt-24 pb-44 + StudioFooter z-[50]
│   ├── layout.tsx
│   ├── dashboard/
│   ├── paket/
│   └── profile/
├── handover/
│   ├── select/            ← pilih Lite/Pro (StudioHeader + StudioFooter)
│   ├── create/            ← HandoverCreateForm (StudioHeader + StudioFooter)
│   ├── [id]/              ← GPS silent, pilih mode, foto/QR
│   │   ├── preview/       ← upload foto + GPS inline → /success
│   │   ├── qr/            ← tampil QR, polling status → /success
│   │   └── success/       ← halaman sukses
├── receive/[token]/       ← public: detail dokumen + tombol "Terima Paket"
├── receipt/[token]/       ← public receipt page
├── package/               ← input barang + foto (StudioHeader + StudioFooter)
└── api/handover/
    ├── create/    ← is_sender_proxy + sender_whatsapp, WA tidak dikirim di sini
    ├── list/      ← visibility rule by role+mode
    ├── receive/   ← GPS inline, WA fire-and-forget, NO FK join (pisah query profile)
    ├── detail/    ← getSupabaseAdmin (bukan anon client)
    ├── by-token/  ← getSupabaseAdmin
    ├── status/    ← getSupabaseAdmin
    └── upload-photo/ ← proof_only bypass ownership check, upsert:true
```

---

## Catatan Penting (Lessons Learned)

- **Jangan pakai FK join syntax** di Supabase kalau FK tidak terdefinisi langsung antar tabel. `handover.user_id` → `auth.users`, bukan `profiles`. Query profiles terpisah.
- **str_replace** berbahaya untuk file >200 baris → selalu pakai `write_file` lengkap
- **WA_PHONE_NUMBER_ID** ≠ nomor telepon. Ambil dari Meta Developer → WhatsApp → API Setup → Phone Number ID
- **Env vars Vercel** tidak otomatis terbaca oleh Supabase Edge Functions — harus set di dua tempat

---

## Environment Variables

### Vercel
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WA_TOKEN=
WA_PHONE_NUMBER_ID=1079409528584174
WA_TEMPLATE_NAME=nest76_studio_handoff
WA_TEMPLATE_LANG=id
NEXT_PUBLIC_APP_URL=https://www.nest76.com
NEXT_PUBLIC_AZURE_MAPS_KEY=
```

### Supabase Edge Functions Secrets
```
WA_TOKEN
WA_PHONE_NUMBER_ID=1079409528584174
WA_TEMPLATE_NAME=nest76_studio_handoff
WA_TEMPLATE_LANG=id
NEXT_PUBLIC_APP_URL=https://www.nest76.com
NEST_INTERNAL_SECRET=nest76-internal-2026
```

Note: secret `nest-handover` tidak bisa dihapus (UI bug Supabase) — tidak berbahaya.

---

## Backlog

### Sprint 1 ✅ DONE
### Sprint 2 ✅ DONE
### Sprint 3 ✅ DONE
### Sprint 4 ✅ DONE (flow tested, WA fix in progress)

### Sprint 5 — Polish & Maps
- [x] Migrate GPS page dari Leaflet ke Mapbox → Azure Maps ✅
- [x] Address autocomplete NEST-Pro → Azure Maps Search API ✅
- [x] UMKM Pro: lock sender_name ke company_name ✅
- [x] UI/UX review pass ✅
- [x] receipt/[token] page — debug log dihapus ✅
- [x] cleanup-handover trigger (otomatis dari receipt-worker) ✅
- [ ] Test QR flow end-to-end
- [x] UI/UX review pass — sticky header fix, delete accepted, limit 100, PDF 406 fix ✅
- [ ] Test QR flow end-to-end
- [ ] Test proxy sender WA notification

---

## Future Opportunities (Backlog Jangka Panjang)

Ide-ide yang dikumpulkan untuk monetisasi dan ekspansi:

### Location Intelligence + AI Agent
- Data GPS serah terima NEST → heatmap aktivitas logistik per area
- AI Agent bisa analisis: lokasi toko terbaik, pola distribusi, area bermasalah
- Input: profil pelanggan, demografi area, data kompetitor, traffic pattern
- Output: rekomendasi lokasi, insight distribusi, anomali deteksi
- Stack: Azure Maps Spatial Analytics + Azure OpenAI → NEST Analytics dashboard
- Potensi: fitur premium untuk UMKM, pabrik, sekolah
- Relevan setelah nest-factory + nest-school punya cukup data

### NEST Analytics (Premium Feature)
- Dashboard BI untuk OWNER Pro / Enterprise
- Peak hour distribusi, flow barang antar zona, rejection heatmap
- Bisa jadi upsell dari plan Pro → Enterprise

### Expansion Path
- nest-handover (TTD) → pilot ✅
- nest-factory (sistem pabrik) → Sprint berikutnya
- nest-school (sistem sekolah) → Sprint berikutnya  
- NEST Analytics → setelah data cukup terkumpul
- Location Intelligence AI Agent → jangka panjang

---

## Cara Pakai di Chat Baru

Ketik: **"Baca CONTEXT.md di `C:\GitHub\NEST\nest-handover\CONTEXT.md` lalu lanjutkan Sprint 5"**
