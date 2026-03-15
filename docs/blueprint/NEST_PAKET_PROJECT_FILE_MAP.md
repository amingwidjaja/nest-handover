# NEST PAKET — Project File Map

Dokumen ini menjelaskan struktur file utama project NEST Paket.

Tujuannya adalah membantu developer memahami dengan cepat di mana setiap bagian sistem berada.


---

# 1. Root Project

Struktur dasar project:


app/
api/
lib/
public/



---

# 2. Frontend Pages

Semua halaman berada di folder:


app/


Struktur:


app/
page.tsx → Home

create/
page.tsx → Input pengirim & penerima

package/
page.tsx → Editor daftar barang

handover/
[id]/
page.tsx → Halaman serah terima

  qr/
    page.tsx        → QR code untuk penerima

receive/
[token]/
page.tsx → Konfirmasi penerimaan

dashboard/
page.tsx → Daftar semua paket


Halaman-halaman ini membentuk alur utama aplikasi.


---

# 3. API Layer

Semua API berada di:


app/api/


Struktur:


app/api/handover/

create/
route.ts → membuat paket baru

list/
route.ts → mengambil semua paket

receive/
route.ts → menyimpan penerimaan paket

delete/
route.ts → menghapus paket

by-token/
route.ts → mengambil token QR

status/
route.ts → cek status paket


Semua API menggunakan Supabase sebagai database.


---

# 4. Database Connector

Supabase client berada di:


lib/supabase.ts


File ini digunakan oleh semua API route.


---

# 5. Public Assets

File publik berada di:


public/


Contoh:


logo-nest-paket.png


Digunakan oleh halaman Home.


---

# 6. Styling

Global styling berada di:


app/globals.css


Theme utama:


paper background
notebook lines
ink color
accent margin marker


Class penting:


.line-input
.new-row


UI mengikuti konsep:


notebook / arsip



---

# 7. Dashboard Interaction

Dashboard memiliki dua mode:

Normal mode


tap row → buka handover


Selection mode


long press row → enter select mode
tap row → toggle select
delete → hapus paket


Row terbaru menggunakan highlight:


margin marker kiri
fade-in animation



---

# 8. Local Storage

Data berikut disimpan di browser:


handover_id
handover_token


Digunakan untuk melanjutkan flow dari create → package → handover.


---

# 9. Important Files

Beberapa file yang sering diubah selama development:


app/dashboard/page.tsx
app/package/page.tsx
app/handover/[id]/page.tsx
app/create/page.tsx


Dan API:


app/api/handover/create/route.ts
app/api/handover/receive/route.ts



---

# 10. Project Philosophy

Struktur project dijaga tetap sederhana.

Prinsip utama:


minimum complexity
clear flow
easy maintenance


Aplikasi ini dirancang agar:


mudah dipahami
mudah dilanjutkan
mudah diperbaiki



---

# End of Document