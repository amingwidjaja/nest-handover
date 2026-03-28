"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { resolveEvidencePhotoUrl, resolveNestEvidencePublicUrl } from "@/lib/nest-evidence-upload"
import { PublicReceiptHeader, ReceiptFooter } from "@/components/nest/receipt-header-footer"

function fmt(dateString: string) {
  if (!dateString) return "-"
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "short", year: "numeric",
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
    default:             return "-"
  }
}

function fmtWa(raw: string): string {
  const t = raw.trim()
  return t.startsWith("62") ? "0" + t.slice(2) : t
}

function normalizeEv(ev: unknown) {
  if (ev == null) return null
  if (Array.isArray(ev)) return ev[0] ?? null
  return ev as Record<string, unknown>
}

export default function VerifyPage() {
  const params = useParams()
  const token  = params.token as string

  const [handover, setHandover] = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)

  // Reject state
  const [rejectMode,   setRejectMode]   = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejecting,    setRejecting]    = useState(false)
  const [rejected,     setRejected]     = useState(false)

  useEffect(() => {
    fetch(`/api/handover/receipt-data?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d?.id) { setHandover(d); setLoading(false) }
        else { setError(true); setLoading(false) }
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [token])

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
      <span className="text-sm text-[#9A8F88] animate-pulse">Memuat…</span>
    </div>
  )

  if (error || !handover) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#FAF9F6] px-8 text-center">
      <p className="text-sm font-medium text-[#3E2723]">Tanda terima tidak ditemukan</p>
      <p className="text-[12px] text-[#A1887F]">Link mungkin sudah tidak berlaku atau salah.</p>
    </div>
  )

  const ev      = normalizeEv(handover.receive_event)
  const evR     = ev as Record<string, unknown> | null
  const status  = handover.status as string

  // Alamat lengkap
  const addrParts = [
    handover.destination_address,
    handover.destination_district,
    handover.destination_city,
    handover.destination_postal_code,
  ].map((s: any) => String(s ?? "").trim()).filter(Boolean)
  const address = addrParts.join(", ")

  const receiveWhen =
    (typeof evR?.received_at === "string" ? evR.received_at : null) ||
    handover.received_at || ""

  const proofUrl = evR?.photo_url ? resolveEvidencePhotoUrl(String(evR.photo_url)) : null
  const itemPhoto = handover.handover_items?.[0]?.photo_url
    ? resolveEvidencePhotoUrl(handover.handover_items[0].photo_url)
    : null

  const isReceived = status === "received"
  const isAccepted = status === "accepted"
  const isRejected = status === "rejected"
  const isDone     = isAccepted || isRejected

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col">
      <PublicReceiptHeader serialNumber={handover.serial_number} />

      <main className="flex-1 mx-auto w-full max-w-md px-6 pt-24 pb-44 space-y-6">

        {/* ── STATUS BANNER ── */}
        {isAccepted && (
          <div className="rounded-sm bg-[#EAF3DE] border border-[#C5E0A8] px-4 py-3 flex items-center gap-2">
            <span className="text-[#3B6D11] font-bold text-lg">✓</span>
            <div>
              <p className="text-[12px] font-bold text-[#3B6D11]">Paket Diterima & Disetujui</p>
              <p className="text-[11px] text-[#5A9A2A]">{fmt(receiveWhen)}</p>
            </div>
          </div>
        )}
        {isReceived && (
          <div className="rounded-sm bg-[#FFF8E7] border border-[#F5C842] px-4 py-3">
            <p className="text-[12px] font-bold text-[#854F0B]">Menunggu Konfirmasi Pengirim</p>
            <p className="text-[11px] text-[#A07030]">Paket sudah diterima, menunggu disetujui.</p>
          </div>
        )}
        {isRejected && (
          <div className="rounded-sm bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-[12px] font-bold text-red-800">Paket Ditolak</p>
            {handover.rejection_reason && (
              <p className="text-[11px] text-red-700 mt-0.5">{handover.rejection_reason}</p>
            )}
          </div>
        )}

        {/* ── HEADER DOC ── */}
        <section>
          <h1 className="text-2xl font-light tracking-tight">Tanda Terima</h1>
          {handover.profiles?.company_name && (
            <p className="text-[12px] text-[#A1887F] mt-0.5">{handover.profiles.company_name}</p>
          )}
        </section>

        <div className="border-t border-[#ECE7E3]" />

        {/* ── PIHAK ── */}
        <section className="space-y-3 text-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F]">Pihak yang Bertransaksi</p>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-2">
              <span className="text-[#A1887F]">Pengirim</span>
              <span className="font-medium text-right">{handover.sender_name || "-"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#A1887F]">Penerima</span>
              <span className="font-medium text-right">{handover.receiver_target_name || "-"}</span>
            </div>
            {address && (
              <div className="flex justify-between gap-2">
                <span className="shrink-0 text-[#A1887F]">Alamat</span>
                <span className="text-right max-w-[65%] text-[12px]">{address}</span>
              </div>
            )}
          </div>
        </section>

        <div className="border-t border-[#ECE7E3]" />

        {/* ── RINCIAN PAKET ── */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F]">Rincian Paket</p>

          {/* Foto barang pertama kalau ada */}
          {itemPhoto && (
            <div className="rounded-sm border border-[#E0DED7] overflow-hidden">
              <img src={itemPhoto} alt="" className="w-full h-48 object-cover" />
            </div>
          )}

          <div className="space-y-1 text-sm">
            {handover.handover_items?.map((item: any, idx: number) => (
              <div key={item.id ?? idx}>• {item.description}</div>
            ))}
          </div>
        </section>

        {/* ── DETAIL PENERIMAAN — hanya kalau sudah received/accepted ── */}
        {(isReceived || isAccepted) && evR && (
          <>
            <div className="border-t border-[#ECE7E3]" />
            <section className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F]">Detail Penerimaan</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-[#A1887F]">Metode</span>
                  <span className="text-right">{fmtMetode(String(evR.receive_method ?? ""))}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#A1887F]">Waktu</span>
                  <span className="text-right">{fmt(receiveWhen)}</span>
                </div>
                {evR.receiver_name && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[#A1887F]">Diterima oleh</span>
                    <span className="text-right">{String(evR.receiver_name)}</span>
                  </div>
                )}
                {evR.receiver_relation && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[#A1887F]">Hubungan</span>
                    <span className="text-right">{String(evR.receiver_relation)}</span>
                  </div>
                )}
              </div>

              {/* Foto bukti penerimaan */}
              {proofUrl && (
                <div className="rounded-sm border border-[#E0DED7] overflow-hidden mt-2">
                  <img src={proofUrl} alt="Bukti penerimaan" className="w-full h-auto object-cover" />
                </div>
              )}
            </section>
          </>
        )}

        {/* ── KETERANGAN ── */}
        {handover.notes && (
          <>
            <div className="border-t border-[#ECE7E3]" />
            <section className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F]">Keterangan</p>
              <p className="text-sm leading-relaxed">{handover.notes}</p>
            </section>
          </>
        )}

        {/* ── TOLAK — hanya kalau status received ── */}
        {isReceived && !rejected && (
          <>
            <div className="border-t border-[#ECE7E3]" />
            <section className="space-y-3">
              {!rejectMode ? (
                <button onClick={() => setRejectMode(true)}
                  className="w-full py-3 text-[11px] font-medium text-red-700 border border-red-100 rounded-sm active:scale-[0.98] transition-transform">
                  Tolak Paket Ini
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-red-800">Alasan Penolakan</p>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="Tulis alasan (opsional) — pengirim akan diberitahu"
                    rows={3}
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
            </section>
          </>
        )}

        {rejected && (
          <div className="rounded-sm bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-[12px] font-bold text-red-800">Paket ditolak</p>
            <p className="text-[11px] text-red-700">Pengirim sudah diberitahu.</p>
          </div>
        )}

        <div className="border-t border-[#ECE7E3]" />

        <p className="text-center text-[11px] leading-relaxed text-[#9A8F88]">
          Dokumen ini diterbitkan otomatis oleh NEST76 STUDIO sebagai bukti serah terima digital yang sah.
        </p>

      </main>

      <ReceiptFooter />
    </div>
  )
}
