# NEST PAKET — Room Start Template

Dokumen ini digunakan untuk memulai sesi development baru pada project NEST Paket.

Tujuan dokumen ini adalah memberikan konteks cepat kepada AI atau developer baru tanpa harus membaca seluruh diskusi sebelumnya.


---

# 1. Project Identity

Project Name:


NEST Paket


Deskripsi:

Web application sederhana untuk mencatat serah terima barang dan bukti penerimaan.

Target penggunaan:

- individu
- usaha kecil
- pengiriman internal
- pencatatan serah terima sederhana


---

# 2. System Philosophy

NEST Paket dirancang sebagai:


simple
fast
calm


UI mengikuti konsep:


notebook
arsip
catatan serah terima


Bukan sistem logistik kompleks.


---

# 3. Core User Flow

Flow utama sistem:


Home
↓
Create
↓
Package
├─ Simpan → Home
└─ Serah Terima → Handover
↓
Receive
↓
Dashboard


User dapat:

- membuat paket
- mencatat daftar barang
- melakukan serah terima
- mencatat penerimaan
- menghapus paket


---

# 4. Main Pages

Home

Landing hub sistem.

Create

Input pengirim dan penerima.

Package

Menulis daftar barang dan foto paket.

Handover

Halaman serah terima dengan opsi:

QR Code  
Foto serah terima

Receive

Halaman konfirmasi penerimaan melalui QR.

Dashboard

Daftar semua paket.


---

# 5. Dashboard Behaviour

Dashboard memiliki dua mode:

Normal mode:


tap row → buka handover


Selection mode:


long press → enter select mode
tap row → toggle select
delete → hapus paket


Dashboard juga memiliki highlight untuk paket terbaru.


---

# 6. Database Tables

handover

Primary record paket.

handover_items

Daftar barang.

receive_event

Catatan penerimaan paket.


---

# 7. API Endpoints


POST /api/handover/create
GET /api/handover/list
POST /api/handover/receive
POST /api/handover/delete
GET /api/handover/by-token
GET /api/handover/status


Backend menggunakan Supabase.


---

# 8. Current Technical Stack

Frontend:


Next.js (App Router)
TailwindCSS
Lucide Icons


Backend:


Next.js API Routes
Supabase PostgreSQL


Storage (future):


Supabase Storage


---

# 9. Data Lifecycle


created
↓
handover
↓
received


Setelah received:

- dapat dihapus oleh user
- dapat dikompilasi menjadi PDF evidence (future feature)


---

# 10. Data Retention

Photo tidak disimpan permanen.

Policy saat ini:


photo dapat dihapus setelah 30 hari


Future extension:


generate PDF evidence
hapus photo


---

# 11. Important Design Principles

UI harus terasa seperti:


buku catatan
arsip
dokumen fisik


Bukan dashboard enterprise.


---

# 12. Current Development Status

Core system sudah berjalan:


create package
handover
receive
dashboard
delete


Project sudah berada pada tahap:


functional MVP


Future features:


PDF evidence
GPS evidence
data cleanup automation



---

# 13. Instructions for AI

Jika melanjutkan development project ini:

1. Pertahankan konsep UI notebook.
2. Jangan menambah kompleksitas yang tidak perlu.
3. Fokus pada pengalaman pengguna yang sederhana.
4. Gunakan blueprint dan tech architecture sebagai referensi utama.


---

# End of Document