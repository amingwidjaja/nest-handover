"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { resolveEvidencePhotoUrl } from "@/lib/nest-evidence-upload"

/**
 * Bukti foto & evidence for a public receipt (same token as parent receipt page).
 */
export default function ReceiptEvidencePage() {
  const params = useParams()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [handover, setHandover] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const res = await fetch(`/api/handover/receipt-data?token=${token}`)
      const data = await res.json()
      if (!cancelled) {
        setHandover(data?.id ? data : null)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <p className="text-sm text-[#9A8F88]">Memuat bukti…</p>
      </div>
    )
  }

  if (!handover) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FAF9F6] px-6 text-center text-[#3E2723]">
        <p>Data tidak ditemukan</p>
        <Link href={`/receipt/${encodeURIComponent(token)}`} className="text-sm underline">
          Kembali ke Tanda Terima
        </Link>
      </div>
    )
  }

  const items = (handover.handover_items as Array<{ id?: string; photo_url?: string | null }>) ?? []
  let ev = handover.receive_event as Record<string, unknown> | null | undefined
  if (Array.isArray(ev)) ev = ev[0] ?? null
  const proofUrl = ev?.photo_url
    ? resolveEvidencePhotoUrl(String(ev.photo_url))
    : null

  return (
    <div
      className="min-h-screen bg-[#FAF9F6] text-[var(--primary-color,#3E2723)]"
      style={{ ["--primary-color" as string]: "#3E2723" }}
    >
      <main className="mx-auto max-w-md space-y-6 px-6 py-10">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-wide">Bukti foto & evidence</h1>
          <p className="mt-1 text-xs text-[#9A8F88]">
            {typeof handover.serial_number === "string" ? handover.serial_number : ""}
          </p>
        </div>

        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]">
            Foto barang
          </p>
          <div className="space-y-4">
            {items.map((item, idx) => {
              const u = item.photo_url
                ? resolveEvidencePhotoUrl(String(item.photo_url))
                : null
              return (
                <div
                  key={item.id ?? `item-${idx}`}
                  className="overflow-hidden rounded-lg border border-[#E5E0DB] bg-white"
                >
                  {u ? (
                    <img src={u} alt="" className="h-auto w-full object-cover" />
                  ) : (
                    <div className="flex h-32 items-center justify-center text-xs text-[#9A8F88]">
                      Tidak ada foto
                    </div>
                  )}
                  {item.description ? (
                    <p className="border-t border-[#ECE7E3] px-3 py-2 text-sm">{String(item.description)}</p>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>

        {proofUrl ? (
          <section className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8F88]">
              Bukti penerimaan
            </p>
            <div className="overflow-hidden rounded-lg border border-[#E5E0DB]">
              <img src={proofUrl} alt="" className="h-auto w-full object-cover" />
            </div>
          </section>
        ) : null}

        <Link
          href={`/receipt/${encodeURIComponent(token)}`}
          className="inline-flex w-full items-center justify-center rounded-sm border border-[var(--primary-color,#3E2723)] bg-[var(--primary-color,#3E2723)] px-4 py-3 text-center text-sm font-medium text-[#FAF9F6]"
        >
          Kembali ke Tanda Terima
        </Link>
      </main>
    </div>
  )
}
