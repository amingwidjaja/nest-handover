'use client'

import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { resolveNestEvidencePublicUrl } from "@/lib/nest-evidence-upload"

type StudioRole = "OWNER" | "STAFF" | null
type HandoverMode = "lite" | "pro" | null

export default function DashboardPage() {
  const router = useRouter()

  const [handovers, setHandovers] = useState<any[]>([])
  const [studioRole, setStudioRole] = useState<StudioRole>(null)
  const [handoverMode, setHandoverMode] = useState<HandoverMode>(null)
  const [activeTab, setActiveTab] = useState<0 | 1>(0)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const timerRef = useRef<any>(null)
  const handoversRef = useRef<any[]>([])
  const swipeRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => { handoversRef.current = handovers }, [handovers])

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile")
        if (!res.ok) return
        const data = await res.json()
        const profile = data.profile
        if (!profile) return
        setStudioRole(profile.role ?? null)
        const stored = localStorage.getItem("handover_mode")
        if (stored === "lite" || stored === "pro") setHandoverMode(stored)
      } catch { /* ignore */ }
    }
    loadProfile()
  }, [])

  const load = useCallback(async function () {
    const modeParam = handoverMode ? `?mode=${handoverMode}` : ""
    const res = await fetch(`/api/handover/list${modeParam}`, { cache: "no-store" })
    const data = await res.json()
    const rows = data.handovers || []
    setHandovers(rows)
    if (rows.length) {
      window.scrollTo({ top: 0 })
      setHighlightId(rows[0].id)
      setTimeout(() => setHighlightId(null), 3000)
    }
  }, [handoverMode])

  useEffect(() => { load() }, [load])

  // Poll receipt PDF for accepted handovers
  useEffect(() => {
    const needsReceipt = handovers.some(h => h.status === "accepted" && !h.receipt_url)
    if (!needsReceipt) return
    async function pollOnce() {
      const stuck = handoversRef.current.filter(
        (h: any) => h.status === "accepted" && !h.receipt_url
      )
      if (!stuck.length) return
      for (const h of stuck) {
        if (!h.share_token) continue
        try {
          const res = await fetch(`/api/handover/receipt-data?token=${encodeURIComponent(String(h.share_token))}`, { cache: "no-store" })
          if (!res.ok) continue
          const data = await res.json()
          if (data?.id && data.receipt_url) {
            setHandovers(prev => prev.map(row =>
              row.id === h.id ? { ...row, receipt_url: data.receipt_url, status: data.status ?? row.status } : row
            ))
          }
        } catch { /* ignore */ }
      }
      if (stuck.some((h: any) => !h.share_token)) await load()
    }
    pollOnce()
    const id = window.setInterval(pollOnce, 5000)
    return () => window.clearInterval(id)
  }, [handovers, load])

  // Swipe gesture
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 40) return
    if (dx < 0 && activeTab === 0) setActiveTab(1)
    if (dx > 0 && activeTab === 1) setActiveTab(0)
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }
  function startSelect(id: string) { setSelectMode(true); setSelected([id]) }
  function cancelSelect() { setSelectMode(false); setSelected([]) }

  async function deleteSelected() {
    if (!selected.length) return
    if (!confirm("Hapus paket yang dipilih?")) return
    const res = await fetch("/api/handover/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data?.error || "Paket tidak bisa dihapus"); return }
    cancelSelect(); load()
  }

  const pending  = handovers.filter(h => h.status === "created")
  const received = handovers.filter(h => h.status === "received" || h.status === "accepted")

  function formatDate(dateString: string) {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(dateString))
  }
  function getDateLabel(dateString: string) {
    const d = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (target.getTime() === today.getTime()) return "Hari ini"
    if (target.getTime() === yesterday.getTime()) return "Kemarin"
    return formatDate(dateString)
  }
  function isToday(dateString: string) {
    const d = new Date(dateString)
    const now = new Date()
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }

  function handleClick(h: any) {
    if (selectMode) { toggleSelect(h.id); return }
    if (h.status === "created") { router.push(`/package?handover_id=${encodeURIComponent(h.id)}`); return }
    router.push(`/handover/${h.id}`)
  }

  function receiptLink(h: any) {
    if (selectMode) return null
    if (h.status === "accepted") {
      const pdf = h.receipt_url ? resolveNestEvidencePublicUrl(h.receipt_url) : null
      if (pdf) return (
        <a href={pdf} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          className="text-[11px] font-medium text-[#5D4037] underline decoration-[#5D4037]/40 underline-offset-2">
          Lihat Tanda Terima
        </a>
      )
      return <span className="text-[10px] text-[#A1887F] italic">Menyiapkan PDF…</span>
    }
    if (h.status === "received" && h.share_token) return (
      <Link href={`/receipt/${h.share_token}`} onClick={e => e.stopPropagation()}
        className="text-[11px] font-medium text-[#5D4037] underline decoration-[#5D4037]/40 underline-offset-2">
        Lihat Tanda Terima
      </Link>
    )
    return null
  }

  function Row({ h }: { h: any }) {
    const today  = isToday(h.created_at)
    const date   = getDateLabel(h.created_at)
    const name   = h.receiver_target_name || "-"
    const pkg    = h.handover_items?.length ? h.handover_items[0].description : "-"
    const addr   = h.destination_address || null
    const checked = selected.includes(h.id)
    const link   = receiptLink(h)

    return (
      <div
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
        onClick={() => handleClick(h)}
        onContextMenu={e => { e.preventDefault(); if (!selectMode) startSelect(h.id) }}
        onTouchStart={() => { timerRef.current = setTimeout(() => { if (!selectMode) startSelect(h.id) }, 500) }}
        onTouchEnd={() => clearTimeout(timerRef.current)}
        onTouchMove={() => clearTimeout(timerRef.current)}
        className={`px-5 py-3.5 border-b border-[#E0DED7] cursor-pointer transition-colors
          ${highlightId === h.id ? "bg-[#A1887F]/10" : ""}
          ${checked ? "bg-[#A1887F]/20" : "active:bg-[#F5F4F0]"}`}
      >
        {/* Baris 1 — Nama + Tanggal */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {today && <span className="w-1.5 h-1.5 rounded-full bg-[#A1887F] shrink-0" />}
            <span className="font-medium text-[13px] text-[#3E2723] truncate">{name}</span>
          </div>
          <span className="text-[11px] text-[#A1887F] shrink-0 tabular-nums">{date}</span>
        </div>

        {/* Baris 2 — Isi paket */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-[#7D6E68] italic truncate flex-1">{pkg}</span>
          {selectMode && (
            <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center
              ${checked ? "bg-[#3E2723] border-[#3E2723]" : "border-[#C4B8B0]"}`}>
              {checked && <span className="text-[8px] text-white font-bold">✓</span>}
            </div>
          )}
        </div>

        {/* Baris 3 — Alamat (jika ada) + Link tanda terima */}
        {(addr || link) && (
          <div className="flex items-center justify-between gap-2 mt-1.5">
            {addr
              ? <span className="text-[11px] text-[#A1887F] truncate flex-1">{addr}</span>
              : <span />
            }
            {link}
          </div>
        )}
      </div>
    )
  }

  const showTeamFeed = studioRole === "OWNER" && handoverMode === "pro"

  return (
    <>
      {/* ── STICKY: Judul + Tab ── */}
      <div className="sticky top-0 z-10 bg-[#FAF9F6]">
        <div className="pb-2 pt-2">
          <h1 className="text-xl font-medium tracking-tight">
            {studioRole === "STAFF" ? "Paket Anda" : "Daftar Paket"}
          </h1>
        </div>

        {studioRole === "STAFF" && (
          <div className="border-b border-[#E0DED7] py-3">
            <Link href="/handover/select"
              className="text-sm font-medium text-[#3E2723] underline decoration-[#3E2723]/30 underline-offset-4">
              Formulir baru — buat tanda terima
            </Link>
          </div>
        )}

        {showTeamFeed && (
          <section className="border-b border-[#E0DED7] bg-[#F7F6F3]/90 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F] mb-3">Aktivitas tim</p>
            <div className="max-h-36 space-y-2 overflow-y-auto">
              {handovers.filter(h => h.staff_display_name).slice(0, 12).map(h => (
                <div key={`feed-${h.id}`}
                  className="flex items-center justify-between gap-3 border-t border-[#E0DED7]/70 pt-2 first:border-t-0 first:pt-0">
                  <span className="text-[11px] font-semibold text-[#5D4037]">{h.staff_display_name}</span>
                  <span className="min-w-0 flex-1 truncate text-right text-[10px] text-[#A1887F]">
                    {h.receiver_target_name || "—"}
                  </span>
                </div>
              ))}
              {handovers.filter(h => h.staff_display_name).length === 0 && (
                <p className="text-[11px] italic text-[#A1887F]">Belum ada aktivitas staf tercatat.</p>
              )}
            </div>
          </section>
        )}

        {/* Tab bar */}
        <div className="flex border-b border-[#E0DED7]">
          {([{ label: "Dalam Proses", count: pending.length }, { label: "Selesai", count: received.length }] as const).map(({ label, count }, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i as 0 | 1)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[12px] font-medium transition-colors border-b-2
                ${activeTab === i ? "border-[#3E2723] text-[#3E2723]" : "border-transparent text-[#A1887F]"}`}
            >
              {label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                  ${activeTab === i
                    ? i === 0 ? "bg-[#FAEEDA] text-[#854F0B]" : "bg-[#EAF3DE] text-[#3B6D11]"
                    : "bg-[#F0EDE8] text-[#A1887F]"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── PANELS ── */}
      <div
        ref={swipeRef}
        className="overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-250 ease-out"
          style={{ transform: `translateX(${activeTab === 0 ? "0%" : "-50%"})`, width: "200%" }}
        >
          {/* Panel 0 — Dalam Proses */}
          <div className="w-1/2">
            {pending.length === 0 ? (
              <div className="px-5 py-8 text-center space-y-3">
                <p className="text-[12px] text-[#A1887F]">Belum ada paket dalam proses.</p>
                <Link href="/handover/select"
                  className="inline-block text-[12px] font-medium text-[#3E2723] underline decoration-[#3E2723]/30 underline-offset-2">
                  Buat Tanda Terima baru →
                </Link>
              </div>
            ) : (
              <>
                {pending.map(h => <Row key={h.id} h={h} />)}
                <div className="px-5 py-5 text-center">
                  <Link href="/handover/select"
                    className="text-[12px] font-medium text-[#3E2723] underline decoration-[#3E2723]/30 underline-offset-2">
                    + Buat Tanda Terima Baru
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Panel 1 — Selesai */}
          <div className="w-1/2">
            {received.length === 0 ? (
              <p className="px-5 py-8 text-center text-[12px] text-[#A1887F] italic">
                Belum ada paket yang diterima.
              </p>
            ) : (
              received.map(h => <Row key={h.id} h={h} />)
            )}
          </div>
        </div>
      </div>

      {/* Select mode bar */}
      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-between bg-[#3E2723] px-6 py-4 text-white">
          <span className="text-sm">{selected.length} dipilih</span>
          <div className="flex gap-6 text-sm">
            <button onClick={cancelSelect}>Batal</button>
            <button onClick={deleteSelected}>Hapus</button>
          </div>
        </div>
      )}
    </>
  )
}
