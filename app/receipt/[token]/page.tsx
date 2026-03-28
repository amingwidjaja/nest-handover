"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { resolveEvidencePhotoUrl } from "@/lib/nest-evidence-upload"
import { formatGpsCoords, formatTrustTimestampId } from "@/lib/receipt-trust"
import { StudioHeader } from "@/components/nest/studio-header"
import { StudioFooter } from "@/components/nest/studio-footer"
import { resolveNestEvidencePublicUrl } from "@/lib/nest-evidence-upload"

const PRIMARY_QR_HEX = "3E2723"
const QR_PX = 128

function fmt(dateString: string) {
  if (!dateString) return "-"
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Jakarta"
  }).format(new Date(dateString)).replace("pukul", "pk.") + " WIB"
}

function fmtMetode(method: string) {
  switch (method) {
    case "direct_qr":    return "QR Code"
    case "direct_photo": return "Foto Tanda Terima"
    case "proxy_qr":     return "QR Code (Diwakilkan)"
    case "proxy_photo":  return "Foto Tanda Terima (Diwakilkan)"
    case "GPS":          return "Validasi GPS"
    default:             return "-"
  }
}

function fmtStatus(status: string) {
  switch (status) {
    case "draft":    return "Draft"
    case "created":  return "Dibuat"
    case "received": return "Diterima"
    case "accepted": return "Diterima & Disetujui"
    case "rejected": return "Ditolak"
    default:         return status || "-"
  }
}

function parseGps(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  if (lat == null || lng == null) return null
  const a = typeof lat === "string" ? parseFloat(lat) : Number(lat)
  const b = typeof lng === "string" ? parseFloat(lng) : Number(lng)
  return (isNaN(a) || isNaN(b)) ? null : { lat: a, lng: b }
}

function normalizeEv(ev: unknown) {
  if (ev == null) return null
  if (Array.isArray(ev)) return ev[0] ?? null
  return ev as Record<string, unknown>
}

// Parse user-agent to readable model name
function parseDeviceModel(deviceModel: unknown, deviceId: unknown): string {
  const model = String(deviceModel ?? "").trim()
  if (model && model !== "—") return model
  const ua = String(deviceId ?? "").trim()
  if (!ua) return "System Verified"
  if (/iPhone/i.test(ua)) return "iPhone"
  if (/Android/i.test(ua)) {
    const m = ua.match(/;\s*([^;)]+)\sBuild/)
    return m?.[1]?.trim() || "Android"
  }
  if (/Windows NT/i.test(ua)) return "Windows PC"
  if (/Mac OS X/i.test(ua)) return "Mac"
  return "Web Browser"
}

export default function ReceiptPage() {
  const params = useParams()
  const token = params.token as string

  const [handover, setHandover] = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [origin,   setOrigin]   = useState("")

  useEffect(() => {
    fetch(`/api/handover/receipt-data?token=${token}`)
      .then(r => r.json())
      .then(d => { setHandover(d?.id ? d : null); setLoading(false) })
  }, [token])

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin)
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <span className="text-sm text-[#9A8F88]">Menyiapkan data…</span>
    </div>
  )

  if (!handover) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] text-[#3E2723]">
      Data serah terima tidak ditemukan
    </div>
  )

  const ev  = normalizeEv(handover.receive_event)
  const evR = ev as Record<string, unknown> | null

  // Timestamps
  const receiveWhen =
    (typeof evR?.received_at === "string" && evR.received_at ? evR.received_at : null) ||
    (typeof handover.received_at === "string" ? handover.received_at : "") || ""

  // GPS
  const gps     = ev ? parseGps(ev.gps_lat, ev.gps_lng) : null
  const mapsUrl = gps ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}` : null

  // QR sources
  const qrColor = PRIMARY_QR_HEX
  const mapsQrSrc = mapsUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${QR_PX}x${QR_PX}&color=${qrColor}&data=${encodeURIComponent(mapsUrl)}`
    : null
  const evidencePath = `/receipt/${encodeURIComponent(token)}/evidence`
  const evidenceAbs  = origin ? `${origin}${evidencePath}` : ""
  const evidenceQrSrc = evidenceAbs
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${QR_PX}x${QR_PX}&color=${qrColor}&data=${encodeURIComponent(evidenceAbs)}`
    : null

  // Receipt page QR (this page itself)
  const receiptAbs = origin ? `${origin}/receipt/${encodeURIComponent(token)}` : ""
  const receiptQrSrc = receiptAbs
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${QR_PX}x${QR_PX}&color=${qrColor}&data=${encodeURIComponent(receiptAbs)}`
    : null

  // Device — readable model, not raw UA
  const isQR       = String(ev?.receive_method ?? "").includes("qr")
  const deviceRole = isQR ? "Device Penerima" : "Device Pengirim"
  const deviceName = parseDeviceModel(ev?.device_model, ev?.device_id)

  // Business info
  const bp = handover.business_profile as any
  const businessName = bp?.display_name?.trim() || handover.profiles?.company_name?.trim() || ""
  const logoUrl =
    (bp?.logo_url ? resolveEvidencePhotoUrl(bp.logo_url) : null) ||
    (handover.profiles?.company_logo_url ? resolveEvidencePhotoUrl(handover.profiles.company_logo_url) : null)

  // Contact
  const receiverWaRaw = String(handover.receiver_whatsapp ?? "").trim() ||
    (String(handover.receiver_contact ?? "").includes("@") ? "" : String(handover.receiver_contact ?? "").trim())
  // Format 628xx → 08xx
  const receiverWa = receiverWaRaw.startsWith("62")
    ? "0" + receiverWaRaw.slice(2)
    : receiverWaRaw
  const receiverEmail = String(handover.receiver_email ?? "").trim() || null

  // Alamat lengkap
  const addrParts = [
    handover.destination_address,
    handover.destination_district,
    handover.destination_city,
    handover.destination_postal_code,
  ].map(s => String(s ?? "").trim()).filter(Boolean)
  const address = addrParts.join(", ")

  const notes = String(handover.notes ?? "").trim()

  const gpsCoords   = ev ? formatGpsCoords(ev.gps_lat, ev.gps_lng) : "—"
  const handoverTs  = formatTrustTimestampId(receiveWhen)
  const acceptedTs  = handover.status === "accepted"
    ? formatTrustTimestampId(receiveWhen)
    : null

  const qrImgClass  = "h-[128px] w-[128px] shrink-0 rounded-sm border border-[#3E2723] bg-white p-1"
  const qrLinkClass = "flex flex-col items-center justify-center rounded-sm transition-transform active:scale-95"

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col" style={{ ["--primary-color" as string]: "#3E2723" }}>
      <StudioHeader />
      <main className="mx-auto w-full max-w-md space-y-6 p-6 pt-24 pb-44 text-[#3E2723]">

        {/* ── HEADER ── */}
        <section className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {logoUrl && (
              <Image src={logoUrl} alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold uppercase tracking-wide">Tanda Terima</h1>
              {businessName && <p className="mt-0.5 text-xs text-[#9A8F88]">{businessName}</p>}
            </div>
          </div>
          {handover.serial_number && (
            <span className="shrink-0 text-right text-xs font-semibold tracking-wide">{handover.serial_number}</span>
          )}
        </section>

        <div className="border-t border-[#ECE7E3]" />

        {/* ── KONTAK ── */}
        <section className="space-y-3 text-sm">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]">Pihak yang Bertransaksi</h2>
          <div className="space-y-1.5">
            {[
              ["Pengirim", handover.sender_name || "-"],
              ["Penerima", handover.receiver_target_name || "-"],
              address ? ["Alamat", address] : null,
              ["Status", null], // handled separately
            ].filter(Boolean).map((row, i) => {
              if (!row) return null
              const [label, value] = row as [string, string]
              if (label === "Status") return (
                <div key="status" className="flex justify-between gap-2">
                  <span className="shrink-0 text-[#9A8F88]">Status:</span>
                  <span className={`text-right font-medium ${handover.status === "rejected" ? "text-red-700" : ""}`}>
                    {fmtStatus(handover.status)}
                  </span>
                </div>
              )
              return (
                <div key={i} className="flex justify-between gap-2">
                  <span className="shrink-0 text-[#9A8F88]">{label}:</span>
                  <span className="text-right max-w-[65%]">{value}</span>
                </div>
              )
            })}
            {handover.status === "rejected" && handover.rejection_reason && (
              <div className="flex justify-between gap-2">
                <span className="shrink-0 text-[#9A8F88]">Alasan:</span>
                <span className="text-right text-red-700 max-w-[65%]">{handover.rejection_reason}</span>
              </div>
            )}
          </div>
          <div className="space-y-2 rounded-md border border-[#E5E0DB] bg-[#FAF9F6] px-3 py-2.5">
            <div className="flex justify-between gap-2">
              <span className="font-medium text-[#9A8F88]">WhatsApp</span>
              <span className="text-right font-medium tabular-nums">{receiverWa || "—"}</span>
            </div>
            {receiverEmail && <>
              <div className="border-t border-[#ECE7E3]" />
              <div className="flex justify-between gap-2">
                <span className="font-medium text-[#9A8F88]">Email</span>
                <span className="text-right break-all font-medium">{receiverEmail}</span>
              </div>
            </>}
          </div>
        </section>

        <div className="border-t border-[#ECE7E3]" />

        {/* ── RINCIAN PAKET ── */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]">Rincian Paket</h2>
            <div className="space-y-1 text-sm">
              {handover.handover_items?.map((item: any, idx: number) => (
                <div key={item.id ?? idx}>{idx + 1}. {item.description}</div>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]">Detail Penerimaan</h3>
            <div className="space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-[#9A8F88]">Metode:</span>
                <span className="text-right">{fmtMetode(ev?.receive_method as string)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#9A8F88]">Waktu:</span>
                <span className="text-right">{fmt(receiveWhen)}</span>
              </div>
              {ev?.receiver_name && (
                <div className="flex justify-between gap-2">
                  <span className="text-[#9A8F88]">Diterima oleh:</span>
                  <span className="text-right">{String(ev.receiver_name)}</span>
                </div>
              )}
              {ev?.receiver_relation && (
                <div className="flex justify-between gap-2">
                  <span className="text-[#9A8F88]">Hubungan:</span>
                  <span className="text-right">{String(ev.receiver_relation)}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── KETERANGAN — hanya tampil kalau ada ── */}
        {notes && <>
          <div className="border-t border-[#ECE7E3]" />
          <section className="space-y-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]">Keterangan</h2>
            <p className="text-sm leading-relaxed">{notes}</p>
          </section>
        </>}

        <div className="border-t border-[#ECE7E3]" />

        {/* ── QR CENTER — 2 kolom: Maps + Evidence ── */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-4">

            {/* QR — Google Maps */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-center">Lokasi GPS</p>
              {mapsUrl && mapsQrSrc ? (
                <a href={mapsUrl} className={qrLinkClass} aria-label="Buka lokasi">
                  <Image src={mapsQrSrc} alt="" width={QR_PX} height={QR_PX} className={qrImgClass} />
                </a>
              ) : <span className="text-[10px] text-[#9A8F88]">—</span>}
            </div>

            {/* QR — Evidence foto */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-center">Foto Bukti</p>
              {evidenceQrSrc ? (
                <a href={evidencePath} className={qrLinkClass} aria-label="Buka bukti foto">
                  <Image src={evidenceQrSrc} alt="" width={QR_PX} height={QR_PX} className={qrImgClass} />
                </a>
              ) : <span className="text-[10px] text-[#9A8F88]">Memuat…</span>}
            </div>

          </div>
        </section>

        <div className="border-t border-[#ECE7E3]" />

        {/* ── VERIFIKASI DIGITAL ── */}
        <section className="space-y-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]">Verifikasi Digital</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-[#9A8F88]">Metode:</span>
              <span className="text-right">{fmtMetode(ev?.receive_method as string)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="shrink-0 text-[#9A8F88]">{deviceRole}:</span>
              <span className="text-right">{deviceName}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#9A8F88]">Waktu Penerimaan:</span>
              <span className="text-right">{handoverTs}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#9A8F88]">GPS:</span>
              <span className="text-right">{gpsCoords}</span>
            </div>
            {handover.status === "accepted" && acceptedTs && (
              <div className="flex justify-between gap-2 pt-1 border-t border-[#ECE7E3]">
                <span className="shrink-0 text-[#9A8F88]">Disetujui:</span>
                <span className="text-right max-w-[60%]">{acceptedTs}</span>
              </div>
            )}
          </div>
        </section>

        <div className="border-t border-[#ECE7E3]" />

        {/* ── ACTION BUTTONS ── */}
        <div className="flex gap-3 pt-2">
          {handover.receipt_url && (
            <a
              href={resolveNestEvidencePublicUrl(handover.receipt_url) ?? "#"}
              download={`TTD-${handover.serial_number || handover.id}.pdf`}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#E0DED7] rounded-sm text-[12px] font-medium text-[#3E2723] active:scale-[0.97] transition-transform"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Unduh PDF
            </a>
          )}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Tanda Terima Digital NEST76\nNo: ${handover.serial_number || ""}\nLihat di: ${origin}/verify/${token}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 py-3 bg-[#25D366] rounded-sm text-[12px] font-medium text-white active:scale-[0.97] transition-transform ${handover.receipt_url ? "flex-1" : "w-full"}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            {handover.receipt_url ? "WhatsApp" : "Bagikan via WhatsApp"}
          </a>
        </div>

        <div className="border-t border-[#ECE7E3]" />

        <p className="text-center text-[11px] leading-relaxed text-[#9A8F88]">
          Dokumen ini merupakan Tanda Terima Sah yang diterbitkan secara otomatis
          oleh NEST-System. Keaslian data dijamin melalui verifikasi Device ID,
          Timestamp, dan Geo-tagging sebagai pengganti tanda tangan basah.
        </p>
      </main>

      <StudioFooter />
    </div>
  )
}
