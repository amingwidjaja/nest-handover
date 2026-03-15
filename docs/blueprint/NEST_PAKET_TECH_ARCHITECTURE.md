# NEST PAKET — Technical Architecture

Dokumen ini menjelaskan struktur teknis sistem NEST Paket.

Tujuan dokumen ini adalah memberikan pemahaman cepat kepada developer mengenai:

- struktur project
- alur data
- API layer
- database structure


---

# 1. System Stack

Frontend:
Next.js (App Router)

Backend API:
Next.js API Routes

Database:
Supabase (PostgreSQL)

Storage:
Supabase Storage (future)

Icons:
Lucide React

Styling:
TailwindCSS + custom paper theme


---

# 2. Project Structure

Project menggunakan App Router Next.js.

Struktur utama:


app/
home page
create/
package/
handover/[id]/
handover/[id]/qr/
receive/[token]/
dashboard/

api/
handover/create
handover/list
handover/delete
handover/receive
handover/by-token
handover/status

lib/
supabase.ts


---

# 3. Page Responsibilities

## Home

Landing hub aplikasi.

Menampilkan:

- tombol buat paket
- tombol dashboard
- status paket aktif


## Create

Form awal menentukan:

- pengirim
- penerima target


## Package

Editor daftar barang.

User dapat:

- menulis item barang
- mengambil foto paket

Action:

Simpan → kembali ke Home  
Serah Terima → lanjut ke halaman Handover


## Handover

Halaman penutupan transaksi.

User memilih metode:

QR Code  
Foto serah terima


## QR Page

Menampilkan QR code yang berisi link:


/receive/{token}


Receiver memindai QR untuk membuka halaman Receive.


## Receive Page

Digunakan oleh penerima paket.

Receiver mengisi:

- nama penerima
- hubungan dengan penerima

Kemudian sistem mencatat receive event.


## Dashboard

Menampilkan semua paket.

Section:

- Dalam Proses
- Paket Telah Diterima

Fitur tambahan:

- highlight paket terbaru
- multi select delete


---

# 4. Database Schema

## Table: handover

Record utama paket.

Fields:


id
share_token
status
sender_name
receiver_target_name
receiver_target_phone
receiver_target_email
created_at
received_at


Status values:


created
received



## Table: handover_items

Daftar barang dalam paket.

Fields:


id
handover_id
description
photo_url



## Table: receive_event

Catatan penerimaan paket.

Fields:


handover_id
receiver_name
receiver_relation
receive_method
timestamp



---

# 5. API Layer

## POST /api/handover/create

Membuat record handover baru.

Payload:


sender_name
receiver_target_name
receiver_target_phone
items[]



## GET /api/handover/list

Mengambil semua paket.

Digunakan oleh dashboard.


## POST /api/handover/receive

Menyimpan bukti penerimaan.

Payload:


token
receiver_name
receiver_relation
receive_method



## POST /api/handover/delete

Menghapus paket.

Payload:


ids[]



## GET /api/handover/by-token

Mengambil share_token berdasarkan id.


## GET /api/handover/status

Digunakan oleh halaman QR untuk polling status.


---

# 6. Client State

State disimpan secara lokal menggunakan React state.

Tidak menggunakan global state manager.

Data penting seperti:

handover_id  
handover_token

disimpan di:


localStorage



---

# 7. Highlight System

Dashboard menampilkan paket terbaru menggunakan:

- border-left marker
- fade-in animation

Tujuan:

memberikan efek "catatan baru di buku".


---

# 8. Delete System

Dashboard mendukung multi select delete.

Interaction pattern:

Long press → enter select mode

User dapat memilih beberapa row kemudian menghapusnya.


---

# 9. Security Model

Aplikasi ini bersifat publik.

User bertanggung jawab atas data yang mereka buat.

Tidak ada authentication layer.

Delete diperbolehkan untuk semua paket.


---

# 10. Future Extensions

Evidence PDF

Setelah paket diterima:

- compile data
- generate PDF bukti serah terima


GPS Evidence

Receive event dapat menyimpan:

- latitude
- longitude


Auto Cleanup

Photo dapat dihapus otomatis setelah periode tertentu.


---

# 11. Design Philosophy

NEST Paket tidak dirancang sebagai sistem logistik kompleks.

Prinsip desain:

Minimal  
Cepat  
Tenang  
Seperti buku catatan