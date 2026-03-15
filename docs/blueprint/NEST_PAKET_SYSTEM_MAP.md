# NEST PAKET — System Map

Dokumen ini menjelaskan peta alur sistem NEST Paket dari perspektif pengguna dan sistem.

Tujuan dokumen ini adalah memberikan gambaran cepat tentang bagaimana paket dibuat, diproses, diterima, dan dikelola.


---

# 1. System Overview

NEST Paket adalah sistem pencatatan serah terima barang berbasis web.

Sistem ini memungkinkan pengguna untuk:

- membuat catatan paket
- mencatat daftar barang
- melakukan serah terima
- mencatat penerimaan
- menyimpan bukti penerimaan


---

# 2. High Level Flow

User membuka aplikasi:


Home


User dapat memilih:


Buat Serah Terima
atau
Lihat Daftar Paket



---

# 3. Package Creation Flow

Alur pembuatan paket:


Home
↓
Create
↓
Package


Di halaman Package user dapat:

- menulis daftar barang
- mengambil foto paket

Kemudian user memilih:


Simpan
atau
Serah Terima



---

# 4. Save Flow

Jika user memilih **Simpan**:


Package
↓
API create
↓
status = created
↓
Home


Paket akan muncul di Dashboard pada section:


Dalam Proses



---

# 5. Direct Handover Flow

Jika user memilih **Serah Terima**:


Package
↓
API create
↓
Handover Page


User memilih metode serah terima:


QR Code
atau
Foto Serah Terima



---

# 6. QR Handover Flow

Jika user memilih QR:


Handover
↓
QR Page
↓
Receiver scan
↓
Receive Page
↓
API receive
↓
status = received
↓
Dashboard


Receiver mengisi:

- nama penerima
- hubungan dengan penerima


---

# 7. Photo Handover Flow

Jika user memilih foto:


Handover
↓
Ambil Foto
↓
API receive
↓
status = received
↓
Dashboard


Foto menjadi bukti serah terima.


---

# 8. Dashboard Structure

Dashboard menampilkan dua kategori paket:


Dalam Proses
Paket Telah Diterima


Setiap row menampilkan:


timestamp
nama penerima
nama barang
status


Status indicator:


○ created
✓ received



---

# 9. Dashboard Interaction

Normal mode:


tap row → buka halaman handover


Selection mode:


long press row → enter select mode
tap row → toggle selection
hapus → delete paket


Delete menggunakan API:


POST /api/handover/delete



---

# 10. Data Lifecycle

Paket melalui lifecycle berikut:


created
↓
handover process
↓
received


Setelah status received:

- paket dapat dihapus oleh user
- sistem dapat membuat arsip PDF (future feature)


---

# 11. Evidence Model

Bukti serah terima terdiri dari:


timestamp
receiver identity
handover method
photo proof


Future extension dapat menambahkan:


GPS location
PDF archive



---

# 12. Visual Philosophy

Desain sistem mengikuti konsep:


Notebook
Arsip
Catatan serah terima


Elemen visual utama:

- paper background
- notebook lines
- margin marker
- subtle animations


---

# 13. Highlight System

Dashboard menampilkan paket terbaru dengan:


margin marker
fade-in animation


Ini memberikan kesan seperti:


catatan baru ditulis di buku



---

# 14. System Philosophy

NEST Paket dirancang sebagai:


tool sederhana
untuk mencatat serah terima barang


Bukan sebagai sistem logistik enterprise.

Prinsip utama:


simple
reliable
fast
human friendly