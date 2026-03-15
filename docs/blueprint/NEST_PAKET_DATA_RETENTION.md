# NEST PAKET — Data Retention Policy

Dokumen ini menjelaskan bagaimana data disimpan, diarsipkan, dan dihapus dalam sistem NEST Paket.

Tujuan utama kebijakan ini adalah:

- menjaga storage tetap ringan
- tetap menyediakan bukti serah terima
- memberikan fleksibilitas kepada pengguna


---

# 1. Data Categories

Sistem menyimpan beberapa jenis data:

### Transaction Data


handover
handover_items
receive_event


Ini adalah data inti proses serah terima.


### Evidence Data


photo proof
future: GPS
future: PDF archive


Data ini digunakan sebagai bukti serah terima.


---

# 2. Lifecycle Data

Setiap paket melalui lifecycle berikut:


created
↓
handover
↓
received


Setelah status `received`, data dapat diproses menjadi arsip.


---

# 3. Evidence Compilation (Future Feature)

Setelah paket berstatus `received`, sistem dapat membuat bukti arsip berupa PDF.

Isi PDF:


NEST Paket

ID Serah Terima
Tanggal
Waktu

Pengirim
Penerima

Daftar Barang

Metode penerimaan
(QR / Foto)

Timestamp

Foto bukti


Future extension:


GPS location
map snapshot



---

# 4. Photo Retention

Photo proof tidak disimpan permanen.

Policy:


photo disimpan maksimal 30 hari


Setelah itu:


photo dapat dihapus
atau
digantikan dengan PDF evidence



---

# 5. User Data Ownership

Karena NEST Paket adalah tool publik:

- pengguna bertanggung jawab atas data yang mereka buat
- sistem tidak menjamin penyimpanan permanen


---

# 6. Manual Deletion

User dapat menghapus paket kapan saja dari Dashboard.

Delete akan:


menghapus record handover
menghapus handover_items
menghapus receive_event


Jika photo disimpan di storage:


photo juga dihapus



---

# 7. Storage Strategy

Tujuan utama sistem:


minimize storage


Strategi:


temporary photo
optional PDF archive
lightweight database



---

# 8. Future Automation

Beberapa proses dapat diotomatisasi di masa depan:

### Photo Cleanup


cron job
hapus photo lebih dari 30 hari



### Evidence Compilation


generate PDF otomatis
setelah status received



### Archive Mode


handover → archive record


Archive hanya menyimpan:


PDF evidence
metadata minimal



---

# 9. Privacy

Sistem hanya menyimpan informasi minimum:


nama
nomor kontak
daftar barang


Tidak ada:


tracking log
profil pengguna
history login



---

# 10. System Philosophy

Data retention mengikuti prinsip:


minimum data
minimum storage
maximum clarity



Tujuan NEST Paket bukan menyimpan data selamanya, tetapi menyediakan **bukti serah terima yang jelas pada saat dibutuhkan**.