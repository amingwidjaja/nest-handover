"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { resolveNestEvidencePublicUrl } from "@/lib/nest-evidence-upload"
import {
  formatDeviceIdLine,
  formatGpsCoords,
  formatTrustTimestampId,
  isQrReceiveMethod,
  shortenDeviceIdForDisplay
} from "@/lib/receipt-trust"

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
    if (!handover?.handover_items) return
    const raw = firstHandoverItemPhotoUrl(handover.handover_items)
    const resolved = resolveNestEvidencePublicUrl(raw)
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="text-center space-y-2">
          <div className="text-sm text-[#9A8F88]">Menyiapkan data...</div>
        </div>
      </div>
    )
  }

  if (!handover) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] text-[#3E2723]">
        Data serah terima tidak ditemukan
      </div>
    )
  }

  const ev = normalizeReceiveEvent(handover.receive_event)
  const companyName =
    typeof handover.profiles?.company_name === "string"
      ? handover.profiles.company_name.trim()
      : ""
  const hasCompanyBrand = !!companyName
  const brandTitle = hasCompanyBrand ? companyName : "Tanda Terima"
  const logoUrl =
    hasCompanyBrand && handover.profiles?.company_logo_url
      ? resolveNestEvidencePublicUrl(handover.profiles.company_logo_url)
      : null

  const photoSrc = resolveNestEvidencePublicUrl(
    firstHandoverItemPhotoUrl(handover.handover_items)
  )

  const gps = ev
    ? parseGps(ev.gps_lat, ev.gps_lng)
    : null
  const mapsUrl = gps
    ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}`
    : null
  const qrSrc = mapsUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=48x48&data=${encodeURIComponent(
        mapsUrl
      )}`
    : null

  const receiveWhen =
    (ev?.timestamp as string) || (ev?.created_at as string) || ""
  const handoverTs = formatTrustTimestampId(receiveWhen)
  const deviceLine = formatDeviceIdLine(
    ev?.device_model as string | undefined,
    shortenDeviceIdForDisplay(ev?.device_id as string | undefined, 120)
  )
  const gpsCoords = ev
    ? formatGpsCoords(ev.gps_lat, ev.gps_lng)
    : "—"
  const isQr = isQrReceiveMethod(ev?.receive_method as string | undefined)
  const acceptedTs =
    handover.status === "accepted"
      ? formatTrustTimestampId(
          (handover.received_at as string) || receiveWhen
        )
      : null

  const formattedDateOnly = receiveWhen
    ? formatTanggalIndonesia(receiveWhen)
    : "-"

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col justify-between">
      <main className="p-6 pt-10 max-w-md mx-auto w-full space-y-6">
        <div className="relative flex flex-row items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-row items-start justify-center gap-3 sm:justify-start">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 object-contain"
              />
            ) : null}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="text-xl font-light text-[#3E2723]">{brandTitle}</h1>
              <p className="mt-1 text-xs tracking-wide text-[#9A8F88]">
                Tanda Terima
              </p>
            </div>
          </div>
          {handover.serial_number ? (
            <div className="shrink-0 text-right text-xs font-semibold leading-tight tracking-wide text-[#3E2723]">
              {handover.serial_number}
            </div>
          ) : null}
        </div>

        <div className="my-2 border-t border-[#ECE7E3]" />

        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="shrink-0 text-[#9A8F88]">Pengirim:</span>
            <span className="text-right font-medium text-[#3E2723]">
              {handover.sender_name || "-"}
            </span>
          </div>

          <div className="flex justify-between gap-2">
            <span className="shrink-0 text-[#9A8F88]">Penerima:</span>
            <span className="text-right font-medium text-[#3E2723]">
              {handover.receiver_target_name}
            </span>
          </div>

          <div className="flex justify-between gap-2">
            <span className="shrink-0 text-[#9A8F88]">Status:</span>
            <span className="text-right font-medium text-[#3E2723]">
              {formatStatus(handover.status)}
            </span>
          </div>
        </div>

        <div className="my-1 border-t border-[#ECE7E3]" />

        <div className="space-y-2">
          <div className="mt-6 flex gap-3 items-start">
            {photoSrc ? (
              <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[10px] border border-[#E5E0DB]">
                <img
                  src={photoSrc}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => {
                    console.error(
                      "[receipt] Product photo failed to load:",
                      photoSrc
                    )
                  }}
                />
              </div>
            ) : (
              <div className="h-[104px] w-[104px] shrink-0 rounded-[10px] border border-[#E5E0DB] bg-[#FAF9F6]" />
            )}

            <div className="flex-1 min-w-0">
              <div className="mb-1 text-[11px] uppercase tracking-widest text-[#9A8F88]">
                Rincian Paket
              </div>

              <div className="space-y-1 text-sm text-[#3E2723]">
                {handover.handover_items?.map((item: any) => (
                  <div key={item.id}>
                    • {item.description}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="my-2 border-t border-[#ECE7E3]" />

        <div className="space-y-2 text-sm">
          <div className="text-[11px] uppercase tracking-widest text-[#9A8F88]">
            Detail Penerimaan
          </div>

          <div className="space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-[#9A8F88]">Metode:</span>
              <span className="text-right text-[#3E2723]">
                {formatMetode(ev?.receive_method as string)}
              </span>
            </div>

            <div className="flex justify-between gap-2">
              <span className="text-[#9A8F88]">Waktu:</span>
              <span className="text-right text-[#3E2723]">
                {formatTanggalIndonesia(
                  (ev?.timestamp as string) || (ev?.created_at as string) || ""
                )}
              </span>
            </div>

            {ev?.receiver_name && (
              <div className="flex justify-between gap-2">
                <span className="text-[#9A8F88]">Diterima oleh:</span>
                <span className="text-right text-[#3E2723]">
                  {String(ev.receiver_name)}
                </span>
              </div>
            )}

            {ev?.receiver_relation && (
              <div className="flex justify-between gap-2">
                <span className="text-[#9A8F88]">Hubungan:</span>
                <span className="text-right text-[#3E2723]">
                  {String(ev.receiver_relation)}
                </span>
              </div>
            )}

            {gps && mapsUrl && qrSrc ? (
              <div className="mt-3 flex flex-row items-start gap-3 pt-1">
                <Image
                  src={qrSrc}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[11px] leading-snug text-[#9A8F88]">
                    Verified Location: {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                  </p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-[#3E2723] underline"
                  >
                    Buka di Google Maps
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="my-2 border-t border-[#ECE7E3]" />

        <p className="text-sm leading-relaxed text-[#3E2723]">
          Paket telah diterima oleh {String(ev?.receiver_name || "-")} pada{" "}
          {formattedDateOnly} melalui metode{" "}
          {formatMetode(ev?.receive_method as string)}.
        </p>

        <div className="my-2 border-t border-[#ECE7E3]" />

        {isQr ? (
          <div className="rounded-lg border border-[#E5E0DB] bg-[#FAF9F6] p-4">
            <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wide text-[#3E2723]">
              Tanda tangan digital (QR)
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-[11px] text-[#9A8F88]">Device ID</div>
                <div className="font-semibold leading-snug text-[#3E2723] break-words">
                  {deviceLine}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#9A8F88]">Timestamp</div>
                <div className="font-semibold text-[#3E2723]">{handoverTs}</div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="text-[11px] uppercase tracking-widest text-[#9A8F88]">
          Verifikasi digital
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-[#9A8F88]">Metode:</span>
            <span className="text-right text-[#3E2723]">
              {formatMetode(ev?.receive_method as string)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="shrink-0 text-[#9A8F88]">Device ID:</span>
            <span className="max-w-[60%] text-right break-words text-[#3E2723]">
              {deviceLine}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#9A8F88]">Timestamp:</span>
            <span className="text-right text-[#3E2723]">{handoverTs}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#9A8F88]">GPS:</span>
            <span className="text-right text-[#3E2723]">{gpsCoords}</span>
          </div>
          {handover.status === "accepted" ? (
            <div className="flex justify-between gap-2 pt-1">
              <span className="shrink-0 text-[#9A8F88]">Approval:</span>
              <span className="max-w-[70%] text-right text-[#3E2723]">
                Disetujui secara digital pada {acceptedTs ?? "-"}
              </span>
            </div>
          ) : null}
        </div>

        <div className="my-3 border-t border-[#ECE7E3]" />

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
        <Link href="/dashboard" className="text-[#9A8F88]">
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
