"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { resolveEvidencePhotoUrl } from "@/lib/nest-evidence-upload"
import {
  formatGpsCoords,
  formatTrustTimestampId,
  shortenDeviceIdForDisplay
} from "@/lib/receipt-trust"

/** Matches root --primary-color for QR Server `color` param (no #) */
const PRIMARY_QR_HEX = "3E2723"
const QR_PX = 128

function formatTanggalIndonesia(dateString: string) {
  if (!dateString) return "-"

  const date = new Date(dateString)

  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(date) + " WIB"
  )
}

function formatMetode(method: string) {
  switch (method) {
    case "direct_qr":
      return "QR Code"
    case "direct_photo":
      return "Foto Tanda Terima"
    case "proxy_qr":
      return "QR Code (Diwakilkan)"
    case "proxy_photo":
      return "Foto Tanda Terima (Diwakilkan)"
    case "GPS":
      return "Validasi GPS"
    default:
      return "-"
  }
}

function formatStatus(status: string) {
  switch (status) {
    case "draft":
      return "Draft"
    case "created":
      return "Dibuat"
    case "received":
      return "Diterima"
    case "accepted":
      return "Diterima & Disetujui"
    default:
      return status || "-"
  }
}

function parseGps(
  lat: unknown,
  lng: unknown
): { lat: number; lng: number } | null {
  if (lat == null || lng == null) return null
  const a = typeof lat === "string" ? parseFloat(lat) : Number(lat)
  const b = typeof lng === "string" ? parseFloat(lng) : Number(lng)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return { lat: a, lng: b }
}

function normalizeReceiveEvent(ev: unknown) {
  if (ev == null) return null
  if (Array.isArray(ev)) return ev[0] ?? null
  return ev as Record<string, unknown>
}

function firstHandoverItemPhotoUrl(
  items: Array<{ id?: string; photo_url?: string | null }> | undefined
): string | undefined {
  const found = items?.find(
    (item) => item.photo_url && String(item.photo_url).trim()
  )
  return found?.photo_url != null ? String(found.photo_url).trim() : undefined
}

export default function ReceiptPage() {
  const params = useParams()
  const token = params.token as string

  const [handover, setHandover] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState("")

  async function load() {
    const res = await fetch(`/api/handover/receipt-data?token=${token}`)
    const data = await res.json()

    setHandover(data?.id ? data : null)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [token])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  useEffect(() => {
    if (!handover?.handover_items) return
    const raw = firstHandoverItemPhotoUrl(handover.handover_items)
    const resolved = resolveEvidencePhotoUrl(raw)
    console.log("[receipt] Product photo (debug)", {
      rawPhotoPath: raw ?? null,
      resolvedUrl: resolved,
      itemsSnapshot: handover.handover_items.map(
        (i: { id?: string; photo_url?: string | null }) => ({
          id: i.id,
          photo_url: i.photo_url
        })
      )
    })
  }, [handover])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#FAF9F6]"
        style={{ ["--primary-color" as string]: "#3E2723" }}
      >
        <div className="text-center space-y-2">
          <div className="text-sm text-[#9A8F88]">Menyiapkan data...</div>
        </div>
      </div>
    )
  }

  if (!handover) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#FAF9F6] text-[var(--primary-color)]"
        style={{ ["--primary-color" as string]: "#3E2723" }}
      >
        Data serah terima tidak ditemukan
      </div>
    )
  }

  const ev = normalizeReceiveEvent(handover.receive_event)

  const businessProfile = handover.business_profile as
    | { display_name?: string | null; logo_url?: string | null }
    | undefined
  const businessDisplayName =
    (typeof businessProfile?.display_name === "string"
      ? businessProfile.display_name.trim()
      : "") ||
    (typeof handover.profiles?.company_name === "string"
      ? handover.profiles.company_name.trim()
      : "")

  const logoFromBusiness =
    typeof businessProfile?.logo_url === "string" &&
    businessProfile.logo_url.trim()
      ? resolveEvidencePhotoUrl(businessProfile.logo_url.trim())
      : null
  const logoUrl =
    logoFromBusiness ||
    (handover.profiles?.company_logo_url
      ? resolveEvidencePhotoUrl(handover.profiles.company_logo_url)
      : null)

  const waOnly = String(handover.receiver_whatsapp ?? "").trim()
  const contactRaw = String(handover.receiver_contact ?? "").trim()
  const contactForWa = contactRaw.includes("@") ? "" : contactRaw
  const receiverWhatsapp = waOnly || contactForWa

  const receiverEmail =
    typeof handover.receiver_email === "string" && handover.receiver_email.trim()
      ? handover.receiver_email.trim()
      : null

  const destinationAddress =
    typeof handover.destination_address === "string" &&
    handover.destination_address.trim()
      ? handover.destination_address.trim()
      : ""

  const notesRaw =
    typeof handover.notes === "string" ? handover.notes.trim() : ""
  const notesDisplay = notesRaw
    ? notesRaw
    : "Tidak ada catatan tambahan"

  const gps = ev
    ? parseGps(ev.gps_lat, ev.gps_lng)
    : null
  const mapsUrl = gps
    ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}`
    : null
  const mapsQrSrc = mapsUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${QR_PX}x${QR_PX}&color=${PRIMARY_QR_HEX}&data=${encodeURIComponent(
        mapsUrl
      )}`
    : null

  const evidencePath = `/receipt/${encodeURIComponent(token)}/evidence`
  const evidenceAbsolute = origin ? `${origin}${evidencePath}` : ""
  const evidenceQrSrc = evidenceAbsolute
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${QR_PX}x${QR_PX}&color=${PRIMARY_QR_HEX}&data=${encodeURIComponent(
        evidenceAbsolute
      )}`
    : null

  const evRecord = ev as Record<string, unknown> | null
  const receiveWhen =
    (typeof evRecord?.timestamp === "string" && evRecord.timestamp
      ? evRecord.timestamp
      : null) ||
    (typeof evRecord?.created_at === "string" && evRecord.created_at
      ? evRecord.created_at
      : null) ||
    (typeof handover.received_at === "string" && handover.received_at
      ? handover.received_at
      : "") ||
    ""

  const handoverTs = formatTrustTimestampId(receiveWhen)
  const scannerDeviceRaw = evRecord?.device_id
  const deviceIdDisplay =
    scannerDeviceRaw != null && String(scannerDeviceRaw).trim()
      ? shortenDeviceIdForDisplay(String(scannerDeviceRaw).trim(), 120)
      : "System Verified"
  const gpsCoords = ev
    ? formatGpsCoords(ev.gps_lat, ev.gps_lng)
    : "—"
  const acceptedTs =
    handover.status === "accepted"
      ? formatTrustTimestampId(
          (handover.received_at as string) || receiveWhen
        )
      : null

  const qrImgClass =
    "h-[128px] w-[128px] shrink-0 rounded-sm border border-[var(--primary-color)] bg-white p-1"
  const qrLinkClass =
    "flex flex-col items-center justify-center rounded-sm transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]"

  return (
    <div
      className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between"
      style={{ ["--primary-color" as string]: "#3E2723" }}
    >
      <main className="mx-auto w-full max-w-md space-y-6 p-6 pt-10 text-[var(--primary-color)]">
        {/* Section 1 — Header */}
        <section aria-labelledby="receipt-header" className="text-left">
          <div className="relative flex flex-row items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-row items-start gap-3">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 object-contain"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <h1
                  id="receipt-header"
                  className="text-xl font-bold uppercase tracking-wide text-[var(--primary-color)]"
                >
                  Tanda Terima
                </h1>
                {businessDisplayName ? (
                  <p className="mt-0.5 text-xs font-medium text-[#9A8F88]">
                    {businessDisplayName}
                  </p>
                ) : null}
              </div>
            </div>
            {handover.serial_number ? (
              <div className="shrink-0 text-right text-xs font-semibold leading-tight tracking-wide text-[var(--primary-color)]">
                {handover.serial_number}
              </div>
            ) : null}
          </div>
        </section>

        <div className="border-t border-[#ECE7E3]" />

        {/* Section 2 — Kontak (WhatsApp & Email terpisah) */}
        <section aria-labelledby="receipt-contacts" className="space-y-3 text-sm">
          <h2
            id="receipt-contacts"
            className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]"
          >
            Kontak
          </h2>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-2">
              <span className="shrink-0 text-[#9A8F88]">Pengirim:</span>
              <span className="text-right font-medium text-[var(--primary-color)]">
                {handover.sender_name || "-"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="shrink-0 text-[#9A8F88]">Penerima:</span>
              <span className="text-right font-medium text-[var(--primary-color)]">
                {handover.receiver_target_name}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="shrink-0 text-[#9A8F88]">Alamat:</span>
              <span className="min-w-0 max-w-[65%] text-right text-[var(--primary-color)]">
                {destinationAddress || "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="shrink-0 text-[#9A8F88]">Status:</span>
              <span className="text-right font-medium text-[var(--primary-color)]">
                {formatStatus(handover.status)}
              </span>
            </div>
          </div>
          <div className="space-y-2 rounded-md border border-[#E5E0DB] bg-[#FAF9F6] px-3 py-2.5">
            <div className="flex justify-between gap-2">
              <span className="shrink-0 font-medium text-[#9A8F88]">WhatsApp</span>
              <span className="min-w-0 text-right font-medium text-[var(--primary-color)] tabular-nums">
                {receiverWhatsapp || "—"}
              </span>
            </div>
            {receiverEmail ? (
              <>
                <div className="border-t border-[#ECE7E3]" />
                <div className="flex justify-between gap-2">
                  <span className="shrink-0 font-medium text-[#9A8F88]">Email</span>
                  <span className="min-w-0 break-all text-right font-medium text-[var(--primary-color)]">
                    {receiverEmail}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </section>

        <div className="border-t border-[#ECE7E3]" />

        {/* Section 3 — Rincian & detail penerimaan */}
        <section aria-labelledby="receipt-items" className="space-y-4">
          <div className="space-y-2">
            <h2
              id="receipt-items"
              className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]"
            >
              Rincian Paket
            </h2>
            <div className="space-y-1 text-sm text-[var(--primary-color)]">
              {handover.handover_items?.map(
                (item: { id?: string; description?: string }, idx: number) => (
                  <div key={item.id ?? `item-${idx}`}>• {item.description}</div>
                )
              )}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]">
              Detail Penerimaan
            </h3>
            <div className="space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-[#9A8F88]">Metode:</span>
                <span className="text-right text-[var(--primary-color)]">
                  {formatMetode(ev?.receive_method as string)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#9A8F88]">Waktu:</span>
                <span className="text-right text-[var(--primary-color)]">
                  {formatTanggalIndonesia(receiveWhen)}
                </span>
              </div>
              {ev?.receiver_name && (
                <div className="flex justify-between gap-2">
                  <span className="text-[#9A8F88]">Diterima oleh:</span>
                  <span className="text-right text-[var(--primary-color)]">
                    {String(ev.receiver_name)}
                  </span>
                </div>
              )}
              {ev?.receiver_relation && (
                <div className="flex justify-between gap-2">
                  <span className="text-[#9A8F88]">Hubungan:</span>
                  <span className="text-right text-[var(--primary-color)]">
                    {String(ev.receiver_relation)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="border-t border-[#ECE7E3]" />

        {/* Section 4 — Keterangan / Catatan (sebelum QR & verifikasi) */}
        <section aria-labelledby="receipt-notes" className="space-y-2">
          <h2
            id="receipt-notes"
            className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]"
          >
            Keterangan
          </h2>
          <p className="text-sm leading-relaxed text-[var(--primary-color)]">
            {notesDisplay}
          </p>
        </section>

        <div className="border-t border-[#ECE7E3]" />

        {/* Section 5 — Pusat QR (2 kolom, tap) */}
        <section aria-labelledby="receipt-qr" className="space-y-3">
          <h2
            id="receipt-qr"
            className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]"
          >
            Pusat QR
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex min-h-[180px] flex-col items-center justify-start text-center">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[var(--primary-color)]">
                Google Maps
              </p>
              {mapsUrl && mapsQrSrc ? (
                <a
                  href={mapsUrl}
                  className={qrLinkClass}
                  aria-label="Buka lokasi di Google Maps"
                >
                  <Image
                    src={mapsQrSrc}
                    alt=""
                    width={QR_PX}
                    height={QR_PX}
                    className={qrImgClass}
                  />
                </a>
              ) : (
                <span className="text-xs text-[#9A8F88]">—</span>
              )}
            </div>
            <div className="flex min-h-[180px] flex-col items-center justify-start text-center">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[var(--primary-color)]">
                Evidence
              </p>
              {evidenceQrSrc ? (
                <a
                  href={evidencePath}
                  className={qrLinkClass}
                  aria-label="Buka halaman bukti foto dan evidence"
                >
                  <Image
                    src={evidenceQrSrc}
                    alt=""
                    width={QR_PX}
                    height={QR_PX}
                    className={qrImgClass}
                  />
                </a>
              ) : (
                <span className="text-xs text-[#9A8F88]">Memuat…</span>
              )}
            </div>
          </div>
        </section>

        <div className="border-t border-[#ECE7E3]" />

        {/* Section 6 — Verifikasi digital (Device ID = receive_event.device_id) */}
        <section aria-labelledby="receipt-verify" className="space-y-2">
          <h2
            id="receipt-verify"
            className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]"
          >
            Verifikasi digital
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-[#9A8F88]">Metode:</span>
              <span className="text-right text-[var(--primary-color)]">
                {formatMetode(ev?.receive_method as string)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="shrink-0 text-[#9A8F88]">Device ID:</span>
              <span className="max-w-[60%] text-right break-words text-[var(--primary-color)]">
                {deviceIdDisplay}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#9A8F88]">Timestamp:</span>
              <span className="text-right text-[var(--primary-color)]">{handoverTs}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#9A8F88]">GPS:</span>
              <span className="text-right text-[var(--primary-color)]">{gpsCoords}</span>
            </div>
            {handover.status === "accepted" ? (
              <div className="flex justify-between gap-2 pt-1">
                <span className="shrink-0 text-[#9A8F88]">Approval:</span>
                <span className="max-w-[70%] text-right text-[var(--primary-color)]">
                  Disetujui secara digital pada {acceptedTs ?? "-"}
                </span>
              </div>
            ) : null}
          </div>
        </section>

        <div className="border-t border-[#ECE7E3]" />

        <p className="text-center text-[9px] leading-relaxed text-[#9A8F88]">
          Dokumen ini merupakan Tanda Terima Sah yang diterbitkan secara
          otomatis oleh NEST-System. Keaslian data dijamin melalui verifikasi
          Device ID, Timestamp, dan Geo-tagging sebagai pengganti tanda tangan
          basah.
        </p>
        <p className="mt-2 text-center text-[8px] leading-relaxed text-[#9A8F88]">
          © 2026 NEST76 Studio. Tanda Terima — generated securely. All logs are
          encrypted and archived.
        </p>
      </main>

      <div className="flex justify-center px-6 pb-6 text-sm">
        <Link
          href="/dashboard"
          className="font-medium text-[var(--primary-color)] underline-offset-2 hover:underline"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
