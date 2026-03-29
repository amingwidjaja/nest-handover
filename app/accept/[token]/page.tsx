'use client'

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { resolveEvidencePhotoUrl } from "@/lib/nest-evidence-upload"
import { PublicReceiptHeader, ReceiptFooter } from "@/components/nest/receipt-header-footer"

function AcceptForm() {
  const params  = useParams()
  const router  = useRouter()
  const token   = params.token as string

  const [handover,   setHandover]   = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [accepting,  setAccepting]  = useState(false)
  const [done,       setDone]       = useState(false)
  const [savedDash,  setSavedDash]  = useState(false)

  // Checklist state
  const [checkConfirm, setCheckConfirm] = useState(false)
  const [checkDash,    setCheckDash]    = useState(false)

  // Reject state
  const [rejectMode,   setRejectMode]   = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejecting,    setRejecting]    = useState(false)
  const [rejected,     setRejected]     = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/handover/receipt-data?token=${token}`)
        const data = await res.json()
        setHandover(data?.id ? data : null)
      } catch { setHandover(null) }
      finally { setLoading(false) }
    }
    load()
  }, [token])

  async function handleAccept() {
    if (!checkConfirm || accepting) return
    setAccepting(true)
    try {
      const res = await fetch("/api/handover/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, save_to_dash: checkDash }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        if (data.error === "not_received_yet") {
          alert("Paket belum diterima secara fisik. Tunggu konfirmasi penerima terlebih dahulu.")
          return
        }
        alert(data.message || data.error || "Gagal mengkonfirmasi penerimaan")
        return
      }

      setSavedDash(data.saved_to_dash)
      setDone(true)
    } catch {
      alert("Terjadi kesalahan. Coba lagi.")
    } finally {
      setAccepting(false)
    }
  }

  async function handleReject() {
    if (rejecting) return
    setRejecting(true)
    try {
      const res = await fetch("/api/handover/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rejection_reason: rejectReason }),
      })
      const data = await res.json()
      if (data.success) setRejected(true)
      else alert(data.error || "Gagal menolak paket")
    } catch {
      alert("Terjadi kesalahan. Coba lagi.")
    } finally {
      setRejecting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
      <span className="text-sm text-[#A1887F] animate-pulse">Memuat…</span>
    </div>
  )

  if (!handover) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-8 text-center">
      <p className="text-sm text-[#A1887F]">Dokumen tidak ditemukan atau sudah kadaluarsa.</p>
    </div>
  )

  // ── Status guards ────────────────────────────────────────────

  // Belum ada proxy yang terima fisik
  if (handover.status === "created") return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center px-8 gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#E0DED7]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A1887F" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <h2 className="text-lg font-light">Menunggu penerimaan fisik</h2>
      <p className="text-sm text-[#A1887F] max-w-xs leading-relaxed">
        Paket ini belum dikonfirmasi diterima oleh kurir atau perantara.
        Link ini akan aktif setelah penerimaan fisik dikonfirmasi.
      </p>
    </div>
  )

  // Sudah accepted
  if (handover.status === "accepted") return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center px-8 gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#E0DED7]">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <path d="M6 16L13 23L26 9" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="text-lg font-light">Sudah dikonfirmasi</h2>
      <p className="text-sm text-[#A1887F]">Penerimaan ini telah disetujui.</p>
      {handover.share_token && (
        <button
          onClick={() => router.push(`/receipt/${handover.share_token}`)}
          className="mt-2 text-[12px] font-medium text-[#3E2723] underline decoration-[#3E2723]/30 underline-offset-2"
        >
          Lihat tanda terima →
        </button>
      )}
    </div>
  )

  // Rejected
  if (handover.status === "rejected") return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center px-8 gap-3 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-100 bg-red-50">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <path d="M8 8L24 24M24 8L8 24" stroke="#991B1B" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-sm text-[#A1887F]">Paket ini telah ditolak.</p>
    </div>
  )

  // ── Done state ───────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center px-8 gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#E0DED7]">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M6 16L13 23L26 9" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-light tracking-tight">Penerimaan dikonfirmasi</h2>
        <p className="text-sm text-[#A1887F] max-w-xs leading-relaxed">
          Terima kasih. Pengirim mendapat notifikasi otomatis.
        </p>
      </div>

      {/* Dashboard upsell — kalau berhasil simpan */}
      {savedDash && (
        <div className="rounded-xl border border-[#E0DED7] bg-white px-5 py-4 max-w-xs w-full text-left space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#A1887F]">Tersimpan</p>
          <p className="text-sm text-[#3E2723]">
            Detail penerimaan ini tersimpan di dashboard NEST Paket kamu.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-1 text-[12px] font-medium text-[#3E2723] underline decoration-[#3E2723]/30 underline-offset-2"
          >
            Lihat di dashboard →
          </button>
        </div>
      )}

      {/* Upsell daftar — kalau checkDash tapi tidak ada session */}
      {checkDash && !savedDash && (
        <div className="rounded-xl border border-[#E0DED7] bg-white px-5 py-4 max-w-xs w-full text-left space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#A1887F]">Belum tersimpan</p>
          <p className="text-sm text-[#3E2723] leading-relaxed">
            Daftar NEST Paket gratis untuk menyimpan semua riwayat penerimaan di satu tempat.
          </p>
          <button
            onClick={() => router.push(`/register?next=/accept/${token}`)}
            className="mt-1 text-[12px] font-medium text-[#3E2723] underline decoration-[#3E2723]/30 underline-offset-2"
          >
            Daftar sekarang →
          </button>
        </div>
      )}

      <button
        onClick={() => router.push(`/receipt/${token}`)}
        className="text-[12px] text-[#A1887F] underline underline-offset-2"
      >
        Lihat tanda terima
      </button>
    </div>
  )

  // ── Rejected done ────────────────────────────────────────────
  if (rejected) return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center justify-center px-8 gap-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-red-100 bg-red-50">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M8 8L24 24M24 8L8 24" stroke="#991B1B" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 className="text-xl font-light">Paket ditolak</h2>
      <p className="text-sm text-[#A1887F] max-w-xs">
        Pengirim sudah diberitahu. Terima kasih sudah mengkonfirmasi.
      </p>
    </div>
  )

  // ── Main accept view — status: received ──────────────────────
  const firstItem  = handover.handover_items?.[0]
  const itemPhoto  = resolveEvidencePhotoUrl(firstItem?.photo_url)
  const addrParts  = [
    handover.destination_address,
    handover.destination_district,
    handover.destination_city,
  ].map((s: any) => String(s ?? "").trim()).filter(Boolean)

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col">
      <PublicReceiptHeader serialNumber={handover.serial_number} />

      <main className="flex-1 px-6 pt-24 pb-48 max-w-md mx-auto w-full">

        {/* Title */}
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F] mb-1">
            Konfirmasi Penerimaan
          </p>
          <h1 className="text-2xl font-light tracking-tight">Ada kiriman untuk kamu</h1>
        </div>

        {/* Dari siapa */}
        <div className="space-y-3 mb-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F]">Dari</p>
            <p className="text-base font-medium">{handover.sender_name || "-"}</p>
          </div>

          <div className="border-t border-[#E0DED7]" />

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F]">Untuk</p>
            <p className="text-base font-medium">{handover.receiver_target_name || "-"}</p>
            {addrParts.length > 0 && (
              <p className="text-sm text-[#7D6E68] leading-relaxed">{addrParts.join(", ")}</p>
            )}
          </div>
        </div>

        {/* Foto barang */}
        {itemPhoto && (
          <div className="mb-6 flex justify-center">
            <div className="w-3/4 aspect-square rounded-2xl overflow-hidden border border-[#E0DED7]">
              <img src={itemPhoto} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Daftar barang */}
        {handover.handover_items?.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F] mb-2">Isi Kiriman</p>
            <div>
              {handover.handover_items.map((item: any, i: number) => (
                <div key={item.id || i} className="flex items-center gap-3 py-2.5 border-b border-[#E0DED7]">
                  <span className="text-[12px] tabular-nums text-[#A1887F] w-5 text-right shrink-0">{i + 1}.</span>
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

        {/* Info: sudah diterima fisik oleh proxy */}
        <div className="mb-8 rounded-xl bg-[#F5F4F0] border border-[#E0DED7] px-4 py-3">
          <p className="text-[11px] text-[#7D6E68] leading-relaxed">
            Kiriman ini sudah diterima secara fisik. Konfirmasikan di bawah untuk menyelesaikan proses penerimaan.
          </p>
        </div>

        {/* ── CHECKLIST ── */}
        <div className="mb-8 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F]">Konfirmasi</p>

          {/* Checklist 1 — wajib */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setCheckConfirm(v => !v)}
              className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors
                ${checkConfirm
                  ? "bg-[#3E2723] border-[#3E2723]"
                  : "border-[#C4B8B0] bg-white"}`}
            >
              {checkConfirm && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-sm text-[#3E2723] leading-relaxed">
              Saya mengkonfirmasi bahwa kiriman dari <strong className="font-medium">{handover.sender_name || "pengirim"}</strong> telah saya terima.
            </span>
          </label>

          {/* Checklist 2 — opsional, dashboard upsell */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setCheckDash(v => !v)}
              className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors
                ${checkDash
                  ? "bg-[#3E2723] border-[#3E2723]"
                  : "border-[#C4B8B0] bg-white"}`}
            >
              {checkDash && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-sm text-[#7D6E68] leading-relaxed">
              Simpan detail penerimaan ini di dashboard NEST Paket saya.
            </span>
          </label>
        </div>

        {/* Reject form inline */}
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
                className="flex-1 py-2.5 rounded-xl text-[11px] font-medium border border-[#E0DED7] text-[#A1887F]"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-red-800 text-white disabled:opacity-50"
              >
                {rejecting ? "Mengirim…" : "Konfirmasi Tolak"}
              </button>
            </div>
          </div>
        )}

        <p className="text-[10px] text-[#A1887F] leading-relaxed">
          Konfirmasi ini bersifat final dan akan tercatat secara digital beserta waktu penerimaan.
        </p>
      </main>

      <ReceiptFooter />

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 inset-x-0 px-6 py-4 bg-[#FAF9F6]/95 backdrop-blur-sm border-t border-[#E0DED7] space-y-2 max-w-md mx-auto z-[60]">
        <button
          onClick={handleAccept}
          disabled={!checkConfirm || accepting || rejectMode}
          className="w-full py-4 bg-[#3E2723] text-[#FAF9F6] text-sm font-medium tracking-wide disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {accepting ? "Menyimpan…" : "Konfirmasi Terima"}
        </button>
        {!rejectMode && (
          <button
            onClick={() => setRejectMode(true)}
            className="w-full py-3 text-[11px] font-medium text-red-700 border border-red-100 active:scale-[0.98] transition-transform"
          >
            Tolak Kiriman
          </button>
        )}
      </div>
    </div>
  )
}

export default function AcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <span className="text-sm text-[#A1887F] animate-pulse">Memuat…</span>
      </div>
    }>
      <AcceptForm />
    </Suspense>
  )
}
