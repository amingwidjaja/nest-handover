'use client'

import { useParams, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef, Suspense } from "react"
import { getClientDeviceMeta } from "@/lib/receipt-trust"
import { resolveEvidencePhotoUrl } from "@/lib/nest-evidence-upload"
import { PublicReceiptHeader, ReceiptFooter } from "@/components/nest/receipt-header-footer"

interface GpsCoords { lat: number; lng: number; accuracy: number }

function ReceiveForm() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string

  const receiverType     = searchParams.get("rt") === "proxy" ? "proxy" : "direct"
  const receiverName     = searchParams.get("rn") || ""
  const receiverRelation = searchParams.get("rr") || ""

  const [handover,    setHandover]    = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [confirming,  setConfirming]  = useState(false)
  const [done,        setDone]        = useState(false)

  // Reject state
  const [rejectMode,   setRejectMode]   = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejecting,    setRejecting]    = useState(false)
  const [rejected,     setRejected]     = useState(false)

  const gpsRef      = useRef<GpsCoords | null>(null)
  const watchIdRef  = useRef<number | null>(null)

  useEffect(() => {
    loadHandover()
    startSilentGps()
    return stopSilentGps
  }, [token])

  async function loadHandover() {
    try {
      const res  = await fetch(`/api/handover/receipt-data?token=${token}`)
      const data = await res.json()
      setHandover(data?.id ? data : null)
    } catch { setHandover(null) }
    finally  { setLoading(false) }
  }

  function startSilentGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => { gpsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy } },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }
  function stopSilentGps() {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
  }

  async function confirm() {
    if (confirming) return
    setConfirming(true)
    const { device_id, device_model } = getClientDeviceMeta()
    const gps = gpsRef.current
    const res = await fetch("/api/handover/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        receiver_name:     receiverName,
        receiver_relation: receiverRelation,
        receive_method:    receiverType === "direct" ? "direct_qr" : "proxy_qr",
        receiver_type:     receiverType,
        device_id,
        device_model,
        gps_lat:           gps?.lat ?? null,
        gps_lng:           gps?.lng ?? null,
        gps_accuracy:      gps?.accuracy ?? null,
      }),
    })
    const data = await res.json()
    setConfirming(false)
    if (data.success) setDone(true)
    else alert(data.error || "Gagal menyimpan penerimaan")
  }

  async function submitReject() {
    if (rejecting) return
    setRejecting(true)
    const res = await fetch("/api/handover/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, rejection_reason: rejectReason }),
    })
    const data = await res.json()
    setRejecting(false)
    if (data.success) setRejected(true)
    else alert(data.error || "Gagal menolak paket")
  }

  // ── States ──────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
      <span className="text-sm text-[#A1887F] animate-pulse">Memuat…</span>
    </div>
  )

  if (!handover) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-8 text-center">
      <p className="text-sm text-[#A1887F]">Dokumen tidak ditemukan.</p>
    </div>
  )

  if (handover.status === "received" || handover.status === "accepted") return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center px-8">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#E0DED7]">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <path d="M6 16L13 23L26 9" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-sm text-[#A1887F] text-center">Dokumen ini sudah dikonfirmasi.</p>
    </div>
  )

  if (handover.status === "rejected") return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center px-8 gap-3">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <path d="M8 8L24 24M24 8L8 24" stroke="#991B1B" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-sm text-[#A1887F] text-center">Paket ini telah ditolak.</p>
    </div>
  )

  // Done after confirm
  if (done) return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center px-8">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[#E0DED7]">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M6 16L13 23L26 9" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="text-xl font-light mb-3 text-center">
        {receiverType === "direct" ? "Paket berhasil diterima" : "Paket berhasil dititipkan"}
      </h2>
      <p className="text-sm text-[#A1887F] text-center max-w-xs">
        Terima kasih. Pengirim mendapat notifikasi otomatis.
      </p>
    </div>
  )

  // Done after reject
  if (rejected) return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center px-8 gap-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-red-100 bg-red-50">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M8 8L24 24M24 8L8 24" stroke="#991B1B" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 className="text-xl font-light text-center">Paket ditolak</h2>
      <p className="text-sm text-[#A1887F] text-center max-w-xs">
        Pengirim sudah diberitahu. Terima kasih sudah mengkonfirmasi.
      </p>
    </div>
  )

  // ── Main view ────────────────────────────────────────────────
  const firstItem = handover.handover_items?.[0]
  const itemPhoto = resolveEvidencePhotoUrl(firstItem?.photo_url)

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col">
      <PublicReceiptHeader serialNumber={handover.serial_number} />
      <main className="flex-1 px-6 pt-24 pb-44 max-w-md mx-auto w-full">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-tight">Konfirmasi Terima</h1>
        </div>

        {/* Pengirim & Penerima */}
        <div className="space-y-3 mb-8 text-sm">
          <div className="flex justify-between">
            <span className="text-[#A1887F]">Dari</span>
            <span className="font-medium">{handover.sender_name || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A1887F]">Untuk</span>
            <span className="font-medium">{handover.receiver_target_name || "-"}</span>
          </div>
          {receiverType === "proxy" && receiverName && (
            <div className="flex justify-between">
              <span className="text-[#A1887F]">Diterima oleh</span>
              <span className="font-medium">{receiverName}{receiverRelation ? ` (${receiverRelation})` : ""}</span>
            </div>
          )}
          {handover.destination_address && (
            <div className="flex justify-between gap-4">
              <span className="text-[#A1887F] shrink-0">Alamat</span>
              <span className="text-right text-xs leading-relaxed">{handover.destination_address}</span>
            </div>
          )}
        </div>

        {/* Items */}
        {handover.handover_items?.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F] mb-3">Isi Paket</p>
            <div className="space-y-3">
              {handover.handover_items.map((item: any, i: number) => (
                <div key={item.id || i} className="flex gap-3 items-center">
                  {i === 0 && itemPhoto ? (
                    <div className="w-14 h-14 rounded-xl border border-[#E0DED7] overflow-hidden shrink-0">
                      <img src={itemPhoto} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-[#E0DED7] bg-[#F5F4F0] shrink-0 flex items-center justify-center">
                      <span className="text-[10px] text-[#A1887F]">{i + 1}</span>
                    </div>
                  )}
                  <span className="text-sm">{item.description || "-"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {handover.notes && (
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F] mb-2">Catatan</p>
            <p className="text-sm leading-relaxed text-[#5D4037]">{handover.notes}</p>
          </div>
        )}

        {/* Reject form (inline, muncul saat klik Tolak) */}
        {rejectMode && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50/40 p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-800">Alasan penolakan</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Tulis alasan (opsional) — pengirim akan menerima pesan ini"
              rows={3}
              className="w-full text-sm bg-white border border-red-100 rounded-xl px-3 py-2 outline-none resize-none placeholder:text-[#C4B8B0] text-[#3E2723]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectMode(false)}
                className="flex-1 py-2.5 rounded-xl text-[11px] font-medium border border-[#E0DED7] text-[#A1887F] active:scale-[0.98] transition-transform"
              >
                Batal
              </button>
              <button
                onClick={submitReject}
                disabled={rejecting}
                className="flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-red-800 text-white disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {rejecting ? "Mengirim…" : "Konfirmasi Tolak"}
              </button>
            </div>
          </div>
        )}

        <p className="text-[10px] text-[#A1887F] leading-relaxed">
          Dengan mengklik Terima, Anda mengkonfirmasi bahwa paket di atas telah
          diterima. Lokasi dan waktu akan dicatat sebagai bukti digital.
        </p>
      </main>

      <ReceiptFooter />

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 inset-x-0 px-6 py-4 bg-[#FAF9F6]/95 backdrop-blur-sm border-t border-[#E0DED7] space-y-2 max-w-md mx-auto z-[60]">
        <button
          onClick={confirm}
          disabled={confirming || rejectMode}
          className="w-full py-4 bg-[#3E2723] text-[#FAF9F6] text-sm font-medium tracking-wide disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {confirming ? "Menyimpan…" : "Terima Paket"}
        </button>
        {!rejectMode && (
          <button
            onClick={() => setRejectMode(true)}
            className="w-full py-3 text-[11px] font-medium text-red-700 border border-red-100 active:scale-[0.98] transition-transform"
          >
            Tolak Paket
          </button>
        )}
      </div>
    </div>
  )
}

export default function ReceivePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <span className="text-sm text-[#A1887F] animate-pulse">Memuat…</span>
      </div>
    }>
      <ReceiveForm />
    </Suspense>
  )
}
