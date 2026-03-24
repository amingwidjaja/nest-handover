/**
 * Pola nomor Tanda Terima Digital: `[Initials]-[YYMM]-[Seq]` (contoh: TA-2403-0001).
 * Inisial mengikuti nama UMKM (`company_name`) atau nama pengirim (`sender_name`); urutan
 * (`Seq`) unik per pengguna per bulan — diberikan atomik oleh
 * `public.next_handover_serial_number` di Postgres.
 */
export function initialsForTtdSerial(label: string): string {
  const letters = label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
  if (letters.length >= 2) return letters.slice(0, 2)
  if (letters.length === 1) return `${letters}X`
  return "XX"
}
