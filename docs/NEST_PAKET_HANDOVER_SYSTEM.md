# NEST Paket — Handover System
# Dokumen Konteks untuk AI Session Baru

Status: ACTIVE  
Terakhir diupdate: Maret 2026  
Tujuan: Siapapun (atau AI apapun) yang baca dokumen ini langsung paham sistem ini tanpa perlu penjelasan ulang dari awal.

---

## 1. Apa Itu NEST Paket?

NEST Paket adalah sistem **tanda terima digital** — pengganti surat tanda terima kertas.

Awalnya dibuat sebagai tools untuk **pengirim**: buat bukti serah terima, dapat konfirmasi penerimaan, simpan PDF sebagai arsip.

Sekarang berkembang: **penerima juga punya dashboard sendiri** untuk lihat history semua paket yang pernah diterima.

---

## 2. Konsep Inti: Alur Lengkap

```
1. Pengirim buat handover → input nama + no WA penerima
           ↓
   status: CREATED  ← terjadi saat submit, sebelum pilih apapun
           ↓
2. Pengirim pilih: tipe penerima (proxy/direct) + metode (QR/foto)
   — 4 kombinasi: proxy+QR, proxy+foto, direct+QR, direct+foto
           ↓
3. Penerima fisik buka /receive/TOKEN → scan QR atau upload foto
           ↓
      ┌────┴────┐
    proxy     direct
      ↓          ↓
  RECEIVED   ACCEPTED ←─────────────────────────────┐
      ↓                                              │
4. WA otomatis kirim "kunci" ke target              │
      ↓                                              │
5. Target buka /accept/TOKEN                        │
      ↓                                              │
6. Target centang konfirmasi + submit ──────────────┘
           ↓
   status: ACCEPTED
           ↓
   Supabase generate PDF → raw data dihapus
```

### Status Handover
| Status | Kapan terjadi |
|--------|--------------|
| `created` | Saat pengirim submit handover — sebelum pilih metode apapun |
| `received` | Setelah penerima **proxy** handshake di `/receive/TOKEN` |
| `accepted` | Setelah target approve di `/accept/TOKEN`, atau direct handshake, atau auto-accept |
| `rejected` | Target tolak kiriman |

### Auto-accept
Kalau target tidak konfirmasi dalam **3 hari** setelah `received`, sistem otomatis set ke `accepted` via pg_cron.

---

## 3. Dua Jenis Pengirim

| Mode | Keterangan |
|------|-----------|
| **Direct sender** | Pengirim adalah orang itu sendiri |
| **Proxy sender** | Buat handover atas nama orang lain (`is_sender_proxy = true`) |

Kalau proxy sender: input **no WA pengirim asli** supaya notif WA jalan dengan benar.

---

## 4. Tipe Penerima + Metode — Dipilih Pengirim Sebelum Serah Terima

Pengirim memilih **dua hal sekaligus** sebelum menunjukkan QR atau mengambil foto:

| Tipe | Metode | Keterangan |
|------|--------|-----------|
| Proxy | QR | Kurir scan QR di layar pengirim → status: `received` |
| Proxy | Foto | Pengirim foto barang bersama kurir → status: `received` |
| Direct | QR | Target langsung scan QR → status: `accepted` |
| Direct | Foto | Pengirim foto bersama target → status: `accepted` |

> Pengirim yang pilih tipenya — bukan penerima. Penerima tinggal scan atau terima foto.

---

## 5. Dua Cara Handshake (Bukti Serah Terima Fisik)

| Cara | Data yang diambil |
|------|------------------|
| **Scan QR** | device_id + timestamp |
| **Foto** | photo_url + timestamp |

QR ditampilkan di layar HP pengirim → penerima fisik yang scan.  
Foto diambil pengirim saat momen serah terima.

---

## 6. Dua Halaman yang Berbeda

### Halaman Kurir: `/receive/[token]`
- Untuk penerima fisik (kurir, perantara, atau target langsung)
- Dibuka dari scan QR atau dikirim langsung
- Action: konfirmasi terima fisik → status jadi `received` (proxy) atau `accepted` (direct)

### Halaman Target: `/accept/[token]`
- **Khusus** untuk penerima asli (target)
- Dibuka dari **link WA "kunci"** yang dikirim otomatis setelah status `received`
- Berisi detail kiriman + 2 centang:
  - ✅ Wajib: "Saya konfirmasi barang sudah diterima"
  - ☐ Opsional: "Simpan ke dashboard NEST Paket saya"
- Action: approve → status jadi `accepted`

**Penting:** Proxy tidak dapat link `/accept`. Hanya target yang dapat "kunci".

---

## 7. Alur Notif WA

### Saat status → `received` (proxy handshake):
- **Target** dapat WA: link `/accept/TOKEN` → "kunci" untuk approve
- **Proxy sender** (kalau `is_sender_proxy`) dapat WA: link `/receipt/TOKEN` → info saja

### Saat status → `accepted`:
- **Supabase** otomatis generate PDF receipt
- **Proxy sender** (kalau auto-accept) dapat WA notifikasi

### Saat status → `rejected`:
- **Pengirim** dapat WA notifikasi beserta alasan

---

## 8. Fitur Dashboard Penerima

Penerima yang punya akun NEST Paket bisa lihat history semua paket yang pernah diterima.

**Cara kerjanya:**
1. Penerima buka link `/accept/TOKEN` dalam keadaan **sudah login**
2. Centang "Simpan ke dashboard"
3. Saat submit → sistem link `receive_event.receiver_user_id` ke akun mereka
4. Di dashboard → tab ketiga "Diterima" menampilkan semua history

**Kalau tidak punya akun:**
- Setelah submit accept → muncul soft upsell: "Mau simpan? Daftar gratis"
- Redirect ke `/register?next=/accept/TOKEN`

**Kalau tidak login saat accept:**
- `receiver_user_id` = null
- Accept tetap berhasil, tapi tidak masuk dashboard

---

## 9. PDF & Data Lifecycle

```
accepted
  ↓
fn_on_handover_accepted (DB trigger)
  ↓
notify-handover (Edge Function)
  ↓
receipt-worker (Edge Function)
  ↓
PDF di-generate → disimpan di Supabase Storage
  ↓
raw data di-cleanup (cleanup-handover Edge Function)
```

Setelah `accepted`: data mentah dihapus, hanya PDF yang tersisa sebagai arsip.

---

## 10. File-file Penting

### Database Migrations (di `/supabase/`)
| File | Isi |
|------|-----|
| `001_nest76_core_schema.sql` | Schema utama: handover, profiles, organizations |
| `039_receiver_user_id.sql` | Tambah `receiver_user_id` ke `receive_event` |
| `035_auto_accept_and_notify.sql` | Trigger status change → Edge Function |
| `035_auto_accept_cron.sql` | pg_cron auto-accept setelah 3 hari |

### Edge Functions (di `/supabase/functions/`)
| Folder | Fungsi |
|--------|--------|
| `notify-handover/` | Central dispatcher: routing WA + trigger PDF |
| `receipt-worker/` | Generate PDF receipt |
| `cleanup-handover/` | Hapus raw data setelah accepted |

### API Routes (di `/app/api/handover/`)
| Route | Fungsi |
|-------|--------|
| `receive/route.ts` | Kurir/proxy konfirmasi terima fisik |
| `accept/route.ts` | Target approve (received → accepted) |
| `received/route.ts` | Fetch history "paket diterima" untuk dashboard |
| `reject/route.ts` | Target tolak kiriman |
| `list/route.ts` | Fetch list handover milik pengirim |
| `qr/route.ts` | Generate QR code yang encode URL `/receive/TOKEN` |

### Pages (di `/app/`)
| Route | Fungsi |
|-------|--------|
| `/receive/[token]` | Halaman KURIR — handshake fisik (QR atau foto) |
| `/accept/[token]` | Halaman TARGET — approve + dashboard opt-in |
| `/receipt/[token]` | Halaman bukti final — read only, download PDF |
| `/dashboard` | Dashboard pengirim (tab: Dalam Proses, Terkirim, Diterima) |
| `/handover/[id]/qr` | Tampilkan QR di layar pengirim |

---

## 11. Tabel Database Utama

```
handover
  id, share_token, status
  sender_name, is_sender_proxy, sender_whatsapp
  receiver_target_name, receiver_whatsapp  ← no WA untuk kirim "kunci"
  user_id → profiles

receive_event
  handover_id → handover
  receive_method: direct_qr | direct_photo | proxy_qr | proxy_photo
  receiver_type: direct | proxy
  receiver_name, receiver_relation
  receiver_user_id → auth.users  ← nullable, untuk dashboard penerima
  device_id, device_model, gps_lat, gps_lng

handover_items
  handover_id → handover
  description, photo_url
  payload jsonb  ← untuk factory: { ref_type, ref_id } atau { ref_type: "freeform" }
```

---

## 12. Konteks: Hubungan dengan NEST Factory

NEST Paket dipakai sebagai **custody transfer engine** di NEST Factory.

Di factory, setiap perpindahan fisik barang antar node (Cutting → WIP, WIP → Sewing, dll) menggunakan engine handover ini.

Bedanya: `handover_items.payload` bisa berisi referensi ke entity yang sudah terdaftar di DB factory:
```json
{ "ref_type": "bundle", "ref_id": "uuid-bundle" }
```

Atau barang ad-hoc yang belum terdaftar:
```json
{ "ref_type": "freeform", "qty": 3, "unit": "lembar" }
```

Satu Supabase project, dua Next.js app yang share `organizations`, `profiles`, `auth.users`.

---

## 13. Yang Belum Dibangun (Backlog)

- [ ] WA template baru di Meta khusus notif "ada kiriman untuk kamu" (sekarang pakai template `nest76_studio_handoff` yang sama)
- [ ] Push notification selain WA
- [ ] History timeline per handover (semua events dalam satu view)

---

## 14. Cara Deploy

```bash
# Edge Functions
supabase functions deploy notify-handover
supabase functions deploy receipt-worker
supabase functions deploy cleanup-handover

# Next.js
# Push ke main branch → Vercel auto-deploy
```

Environment variables yang diperlukan:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WA_TOKEN` — Meta WhatsApp API token
- `WA_PHONE_NUMBER_ID` — Meta phone number ID
- `WA_TEMPLATE_NAME` — default: `nest76_studio_handoff`
- `NEXT_PUBLIC_APP_URL` — base URL production
- `NEST_INTERNAL_SECRET` — secret untuk verifikasi DB trigger calls

---

*Dokumen ini adalah context file — update setiap kali ada perubahan sistem yang signifikan.*
