# NEST PAKET — System Blueprint v1

## 1. Product Overview

NEST Paket adalah sistem serah terima barang ringan berbasis web.

Tujuan utama sistem:

- mencatat serah terima barang
- memberikan bukti penerimaan
- menjaga sistem tetap sederhana untuk penggunaan publik

Produk ini bukan sistem logistik penuh.

Prinsip desain:

- cepat digunakan
- tidak banyak form
- bukti serah terima jelas
- user bertanggung jawab atas data sendiri


---

# 2. Core User Workflow

## Flow A — Serah Terima Langsung

Home  
→ Create  
→ Package  
→ Serah Terima  
→ Handover  
→ Dashboard  


## Flow B — Persiapan Banyak Paket

Home  
→ Create  
→ Package  
→ Simpan  
→ Home  

User dapat membuat beberapa paket terlebih dahulu.

Kemudian membuka Dashboard untuk melakukan serah terima satu per satu.


---

# 3. Page Architecture

## Home

Landing hub sistem.

Fungsi:

- membuat paket baru
- membuka dashboard
- menampilkan status paket aktif


## Create

Form awal untuk menentukan:

- siapa pengirim
- siapa penerima target


## Package

Editor daftar barang.

User dapat:

- menulis daftar barang
- mengambil foto paket

Action:

- Simpan
- Serah Terima


## Handover

Halaman penutupan transaksi.

User memilih metode:

- QR code
- Foto serah terima


## Receive

Halaman yang diakses penerima melalui QR.

Penerima mengisi:

- nama penerima
- hubungan dengan penerima


## Dashboard

Daftar semua paket.

Terdiri dari dua section:

- Dalam Proses
- Paket Telah Diterima

Dashboard juga mendukung:

- multi select delete
- long press selection mode


---

# 4. Data Model

## Table: handover

Primary record paket.

Fields utama:

- id
- share_token
- status
- sender_name
- receiver_target_name
- receiver_target_phone
- created_at
- received_at


## Table: handover_items

Daftar barang yang dikirim.

Fields:

- id
- handover_id
- description
- photo_url


## Table: receive_event

Bukti penerimaan.

Fields:

- handover_id
- receiver_name
- receiver_relation
- receive_method
- timestamp


---

# 5. API Map

## Create Handover

POST  
/api/handover/create

Membuat record handover baru.


## List Handover

GET  
/api/handover/list

Mengambil semua paket.


## Receive Confirmation

POST  
/api/handover/receive

Menyimpan bukti penerimaan.


## Delete Handover

POST  
/api/handover/delete

Menghapus paket yang dipilih.


## Token Lookup

GET  
/api/handover/by-token


## Status Check

GET  
/api/handover/status


---

# 6. Package Lifecycle

created  
→ handover process  
→ received  

Setelah status received:

- data dapat di-archive
- dapat dikompilasi menjadi PDF


---

# 7. UI Principles

UI mengikuti konsep:

Notebook / Arsip.

Elemen visual utama:

- warna kertas
- garis notebook
- tipografi ringan
- margin marker


Dashboard highlight:

- border kiri untuk paket terbaru
- animasi fade-in


---

# 8. User Interaction Patterns

Normal Mode:

tap row → buka detail


Selection Mode:

long press → enter select mode

user dapat:

- memilih beberapa paket
- menghapus paket


---

# 9. Future Extensions

Beberapa pengembangan yang direncanakan:

Evidence PDF

Setelah paket diterima:

- compile bukti menjadi PDF
- simpan sebagai arsip


Location Evidence

Receive event dapat menyimpan:

- GPS
- timestamp


Retention Policy

Photo dapat dihapus setelah periode tertentu.


---

# 10. Design Philosophy

NEST Paket dibuat dengan prinsip:

Simple  
Calm  
Reliable  

Aplikasi harus terasa seperti:

"buku catatan serah terima barang"

bukan sistem logistik kompleks.