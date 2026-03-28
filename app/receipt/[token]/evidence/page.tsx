"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { resolveEvidencePhotoUrl } from "@/lib/nest-evidence-upload"

export default function ReceiptEvidencePage() {
  const params  = useParams()
  const token   = params.token as string
  const [loading,  setLoading]  = useState(true)
  const [handover, setHandover] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/handover/receipt-data?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled) { setHandover(d?.id ? d : null); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [token])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
      <span className="text-sm text-[#9A8F88] animate-pulse">Memuat bukti…</span>
    </div>
  )

  if (!handover) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FAF9F6] px-6 text-center text-[#3E2723]">
      <p className="text-sm text-[#A1887F]">Data tidak ditemukan</p>
      <Link href={`/receipt/${encodeURIComponent(token)}`}
        className="text-sm font-medium text-[#3E2723] underline underline-offset-2">
        Kembali ke Tanda Terima
      </Link>
    </div>
  )

  const items = (handover.handover_items as Array<{ id?: string; photo_url?: string | null; description?: string }>) ?? []
  let ev = handover.receive_event as Record<string, unknown> | null | undefined
  if (Array.isArray(ev)) ev = ev[0] ?? null
  const proofUrl = ev?.photo_url ? resolveEvidencePhotoUrl(String(ev.photo_url)) : null
  const serial   = typeof handover.serial_number === "string" ? handover.serial_number : ""

  // Filter items yang punya foto
  const itemsWithPhoto = items.filter(i => i.photo_url && String(i.photo_url).trim())
  const itemsNoPhoto   = items.filter(i => !i.photo_url || !String(i.photo_url).trim())

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col">

      {/* ── HEADER ── */}
      <header className="border-b border-[#E0DED7] bg-[#FAF9F6]/95 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nest-paket.png" alt="" className="h-6 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3E2723]">
                NEST76 PAKET
              </p>
              {serial && (
                <p className="text-[10px] font-mono text-[#A1887F] truncate">{serial}</p>
              )}
            </div>
          </div>
          <Link
            href={`/receipt/${encodeURIComponent(token)}`}
            className="flex items-center gap-1 text-[11px] font-medium text-[#A1887F] shrink-0 active:scale-[0.97] transition-transform"
          >
            <ChevronLeft size={14} strokeWidth={2} />
            Tanda Terima
          </Link>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="flex-1 mx-auto w-full max-w-md px-6 py-8 space-y-8">

        {/* Title */}
        <div>
          <h1 className="text-2xl font-light tracking-tight">Bukti Foto</h1>
          <p className="mt-1 text-[12px] text-[#A1887F]">
            Dokumentasi visual serah terima paket
          </p>
        </div>

        {/* Foto barang */}
        {items.length > 0 && (
          <section className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F]">
              Foto Barang
            </p>
            <div className="space-y-4">
              {items.map((item, idx) => {
                const u = item.photo_url ? resolveEvidencePhotoUrl(String(item.photo_url)) : null
                return (
                  <div key={item.id ?? `item-${idx}`}
                    className="rounded-sm border border-[#E0DED7] bg-white overflow-hidden">
                    {u ? (
                      <img src={u} alt="" className="w-full h-auto object-cover" />
                    ) : (
                      <div className="flex h-32 items-center justify-center">
                        <span className="text-[11px] text-[#A1887F] italic">Tidak ada foto</span>
                      </div>
                    )}
                    {item.description && (
                      <div className="border-t border-[#E0DED7] px-4 py-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F] mr-2">
                          Barang {idx + 1}
                        </span>
                        <span className="text-sm">{item.description}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Foto bukti penerimaan */}
        {proofUrl && (
          <section className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F]">
              Bukti Penerimaan
            </p>
            <div className="rounded-sm border border-[#E0DED7] overflow-hidden">
              <img src={proofUrl} alt="Bukti penerimaan" className="w-full h-auto object-cover" />
            </div>
            <p className="text-[11px] text-[#A1887F] leading-relaxed">
              Foto ini diambil pada saat serah terima berlangsung sebagai bukti digital yang sah.
            </p>
          </section>
        )}

        {/* Kalau tidak ada foto sama sekali */}
        {!proofUrl && itemsWithPhoto.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-[#A1887F] italic">Tidak ada foto yang tersedia.</p>
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#E0DED7] px-6 py-6 text-center">
        <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#3E2723]/70">
          NEST76 STUDIO • PRODUCT OF THE ARCHIVE
        </p>
        <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.3em] text-[#3E2723]/40">
          © 2026 ALL RIGHTS RESERVED
        </p>
      </footer>

    </div>
  )
}
