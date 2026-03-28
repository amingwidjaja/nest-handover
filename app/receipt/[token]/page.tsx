"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { resolveEvidencePhotoUrl } from "@/lib/nest-evidence-upload"
import { formatGpsCoords, formatTrustTimestampId } from "@/lib/receipt-trust"

const PRIMARY_QR_HEX = "3E2723"
const QR_PX = 128

function fmt(dateString: string) {
  if (!dateString) return "-"
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Jakarta"
  }).format(new Date(dateString)) + " WIB"
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

  const [rejectMode,   setRejectMode]   = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejecting,    setRejecting]    = useState(false)
  const [rejected,     setRejected]     = useState(false)

  useEffect(() => {
    fetch(`/api/handover/receipt-data?token=${token}`)
      .then(r => r.json())
      .then(d => { setHandover(d?.id ? d : null); setLoading(false) })
  }, [token])

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin)
  }, [])

  async function submitReject() {
    if (rejecting) return
    setRejecting(true)
    try {
      const res  = await fetch("/api/handover/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rejection_reason: rejectReason }),
      })
      const data = await res.json()
      if (data.success) {
        setRejected(true)
        setHandover((p: any) => ({ ...p, status: "rejected", rejection_reason: rejectReason }))
      } else alert(data.error || "Gagal menolak paket")
    } catch { alert("Terjadi kesalahan koneksi") }
    finally { setRejecting(false) }
  }

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
  const receiverWa    = String(handover.receiver_whatsapp ?? "").trim() ||
    (String(handover.receiver_contact ?? "").includes("@") ? "" : String(handover.receiver_contact ?? "").trim())
  const receiverEmail = String(handover.receiver_email ?? "").trim() || null
  const address       = String(handover.destination_address ?? "").trim()
  const notes         = String(handover.notes ?? "").trim()

  const gpsCoords   = ev ? formatGpsCoords(ev.gps_lat, ev.gps_lng) : "—"
  const handoverTs  = formatTrustTimestampId(receiveWhen)
  const acceptedTs  = handover.status === "accepted"
    ? formatTrustTimestampId(receiveWhen)
    : null

  const qrImgClass  = "h-[128px] w-[128px] shrink-0 rounded-sm border border-[#3E2723] bg-white p-1"
  const qrLinkClass = "flex flex-col items-center justify-center rounded-sm transition-transform active:scale-95"

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between" style={{ ["--primary-color" as string]: "#3E2723" }}>
      <main className="mx-auto w-full max-w-md space-y-6 p-6 pt-10 text-[#3E2723]">

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
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]">Kontak</h2>
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
                <div key={item.id ?? idx}>• {item.description}</div>
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

        {/* ── QR CENTER — 3 kolom: Receipt, Maps, Evidence ── */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]">QR Dokumen</h2>
          <div className="grid grid-cols-3 gap-3">

            {/* QR — halaman ini */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[9px] font-medium uppercase tracking-wide text-center">Tanda Terima</p>
              {receiptQrSrc ? (
                <Image src={receiptQrSrc} alt="" width={QR_PX} height={QR_PX}
                  className="h-[90px] w-[90px] rounded-sm border border-[#3E2723] bg-white p-0.5" />
              ) : <span className="text-[10px] text-[#9A8F88]">—</span>}
            </div>

            {/* QR — Google Maps */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[9px] font-medium uppercase tracking-wide text-center">Lokasi GPS</p>
              {mapsUrl && mapsQrSrc ? (
                <a href={mapsUrl} className={qrLinkClass} aria-label="Buka lokasi">
                  <Image src={mapsQrSrc} alt="" width={QR_PX} height={QR_PX}
                    className="h-[90px] w-[90px] rounded-sm border border-[#3E2723] bg-white p-0.5" />
                </a>
              ) : <span className="text-[10px] text-[#9A8F88]">—</span>}
            </div>

            {/* QR — Evidence foto */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[9px] font-medium uppercase tracking-wide text-center">Foto Bukti</p>
              {evidenceQrSrc ? (
                <a href={evidencePath} className={qrLinkClass} aria-label="Buka bukti foto">
                  <Image src={evidenceQrSrc} alt="" width={QR_PX} height={QR_PX}
                    className="h-[90px] w-[90px] rounded-sm border border-[#3E2723] bg-white p-0.5" />
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
              <span className="text-[#9A8F88]">Timestamp:</span>
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

        <p className="text-center text-[9px] leading-relaxed text-[#9A8F88]">
          Dokumen ini merupakan Tanda Terima Sah yang diterbitkan secara otomatis
          oleh NEST-System. Keaslian data dijamin melalui verifikasi Device ID,
          Timestamp, dan Geo-tagging sebagai pengganti tanda tangan basah.
        </p>
        <p className="text-center text-[8px] text-[#9A8F88]">
          © 2026 NEST76 Studio. Tanda Terima — generated securely.
        </p>
      </main>

      {/* ── TOLAK PAKET ── */}
      {handover.status === "received" && !rejected && (
        <div className="border-t border-[#ECE7E3] px-6 py-5 space-y-3">
          {!rejectMode ? (
            <button onClick={() => setRejectMode(true)}
              className="w-full py-3 text-[11px] font-medium text-red-700 border border-red-100 rounded-sm active:scale-[0.98] transition-transform">
              Tolak Paket Ini
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-red-800">Alasan penolakan</p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Tulis alasan (opsional) — pengirim akan diberitahu" rows={3}
                className="w-full text-sm bg-white border border-red-100 rounded-sm px-3 py-2 outline-none resize-none placeholder:text-[#C4B8B0] text-[#3E2723]" />
              <div className="flex gap-2">
                <button onClick={() => { setRejectMode(false); setRejectReason("") }}
                  className="flex-1 py-2.5 text-[11px] font-medium border border-[#E0DED7] text-[#A1887F] active:scale-[0.98] transition-transform">
                  Batal
                </button>
                <button onClick={submitReject} disabled={rejecting}
                  className="flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider bg-red-800 text-white disabled:opacity-50 active:scale-[0.98] transition-transform">
                  {rejecting ? "Mengirim…" : "Konfirmasi Tolak"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {rejected && (
        <div className="border-t border-red-100 bg-red-50/40 px-6 py-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-red-800 mb-1">Paket ditolak</p>
          <p className="text-[11px] text-red-700">Pengirim sudah diberitahu via WhatsApp.</p>
        </div>
      )}

      <div className="flex justify-center px-6 pb-6 text-sm">
        <Link href="/dashboard" className="font-medium text-[#3E2723] underline-offset-2 hover:underline">
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
