'use client'

import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home } from "lucide-react"

type StudioRole = "OWNER" | "STAFF" | null
type HandoverMode = "lite" | "pro" | null
type ActiveTab = 0 | 1 | 2  // 0: Dalam Proses, 1: Terkirim Selesai, 2: Diterima

export default function DashboardPage() {
  const router = useRouter()

  const [handovers, setHandovers] = useState<any[]>([])
  const [received, setReceived] = useState<any[]>([])
  const [studioRole, setStudioRole] = useState<StudioRole>(null)
  const [handoverMode, setHandoverMode] = useState<HandoverMode>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>(0)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [headerH, setHeaderH] = useState(142)

  const timerRef = useRef<any>(null)
  const handoversRef = useRef<any[]>([])
  const touchStartX = useRef<number | null>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!headerRef.current) return
    const obs = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height
      if (h) setHeaderH(Math.ceil(h))
    })
    obs.observe(headerRef.current)
    return () => obs.disconnect()
  }, [studioRole, handoverMode])

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

  const loadSent = useCallback(async function () {
    const modeParam = handoverMode ? `?mode=${handoverMode}` : ""
    const res = await fetch(`/api/handover/list${modeParam}`, { cache: "no-store" })
    const data = await res.json()
    const rows = data.handovers || []
    setHandovers(rows)
    if (rows.length) {
      setHighlightId(rows[0].id)
      setTimeout(() => setHighlightId(null), 3000)
    }
  }, [handoverMode])

  const loadReceived = useCallback(async function () {
    try {
      const res = await fetch("/api/handover/received", { cache: "no-store" })
      const data = await res.json()
      setReceived(data.received || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadSent()
    loadReceived()
  }, [loadSent, loadReceived])

  // Poll for receipt generation on accepted handovers
  useEffect(() => {
    const needsReceipt = handovers.some(h => h.status === "accepted" && !h.receipt_url)
    if (!needsReceipt) return
    async function pollOnce() {
      const stuck = handoversRef.current.filter((h: any) => h.status === "accepted" && !h.receipt_url)
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
      if (stuck.some((h: any) => !h.share_token)) await loadSent()
    }
    pollOnce()
    const id = window.setInterval(pollOnce, 5000)
    return () => window.clearInterval(id)
  }, [handovers, loadSent])

  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 40) return
    if (dx < 0 && activeTab < 2) setActiveTab((activeTab + 1) as ActiveTab)
    if (dx > 0 && activeTab > 0) setActiveTab((activeTab - 1) as ActiveTab)
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
    cancelSelect(); loadSent()
  }

  const pending  = handovers.filter(h => h.status === "created")
  const done     = handovers.filter(h => h.status === "received" || h.status === "accepted")

  function getDateLabel(dateString: string) {
    const d = new Date(dateString)
    const now = new Date()
    const toDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
    if (toDay(d) === toDay(now)) return "Hari ini"
    if (toDay(d) === toDay(now) - 86400000) return "Kemarin"
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(d)
  }
  function isToday(ds: string) {
    const d = new Date(ds), now = new Date()
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }

  function handleClick(h: any) {
    if (selectMode) { toggleSelect(h.id); return }
    if (h.status === "created") {
      router.push(`/package?handover_id=${encodeURIComponent(h.id)}`); return
    }
    if (h.status === "accepted") {
      if (h.share_token) { router.push(`/receipt/${h.share_token}`); return }
      return
    }
    if (h.status === "received" && h.share_token) {
      router.push(`/receipt/${h.share_token}`); return
    }
    router.push(`/handover/${h.id}`)
  }

  function receiptLink(h: any) {
    if (selectMode) return null
    if (h.status === "accepted") {
      if (h.share_token) return (
        <span className={`text-[11px] font-medium ${h.receipt_url ? "text-[#3B6D11]" : "text-[#A1887F] italic"}`}>
          {h.receipt_url ? "Siap Unduh PDF" : "Menyiapkan PDF…"}
        </span>
      )
      return null
    }
    if (h.status === "received" && h.share_token) return (
      <span className="text-[11px] font-medium text-[#5D4037]">
        Lihat Tanda Terima
      </span>
    )
    return null
  }

  function daysOld(dateString: string): number {
    return Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000)
  }

  // Row untuk tab Terkirim (sent)
  function SentRow({ h }: { h: any }) {
    const today   = isToday(h.created_at)
    const date    = getDateLabel(h.created_at)
    const name    = h.receiver_target_name || "-"
    const pkg     = h.handover_items?.length ? h.handover_items[0].description : "-"
    const addr    = h.destination_address || null
    const checked = selected.includes(h.id)
    const link    = receiptLink(h)
    const isAccepted = h.status === "accepted"
    const age     = h.status === "created" ? daysOld(h.created_at) : 0
    const expiring = age >= 5

    return (
      <div
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
        onClick={() => handleClick(h)}
        onContextMenu={e => { e.preventDefault(); if (!selectMode) startSelect(h.id) }}
        onTouchStart={() => { timerRef.current = setTimeout(() => { if (!selectMode) startSelect(h.id) }, 500) }}
        onTouchEnd={() => clearTimeout(timerRef.current)}
        onTouchMove={() => clearTimeout(timerRef.current)}
        className={`px-5 py-3.5 border-b border-[#E0DED7] cursor-pointer
          ${highlightId === h.id ? "bg-[#A1887F]/10" : ""}
          ${checked ? "bg-[#A1887F]/20" : "active:bg-[#F5F4F0]"}`}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {today && <span className="w-1.5 h-1.5 rounded-full bg-[#A1887F] shrink-0" />}
            <span className="font-medium text-[13px] text-[#3E2723] truncate">{name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAccepted
              ? <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#EAF3DE] text-[#3B6D11]">✓ Disetujui</span>
              : <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#FFF8E7] text-[#854F0B]">Menunggu</span>
            }
            <span className="text-[11px] text-[#A1887F] tabular-nums">{date}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-[#7D6E68] italic truncate flex-1">{pkg}</span>
          {selectMode && (
            <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center
              ${checked ? "bg-[#3E2723] border-[#3E2723]" : "border-[#C4B8B0]"}`}>
              {checked && <span className="text-[8px] text-white font-bold">✓</span>}
            </div>
          )}
        </div>
        {expiring && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#FFF8E7] border border-[#F5D87A]/60 px-2.5 py-1.5">
            <span className="text-[10px]">⚠</span>
            <span className="text-[11px] font-medium text-[#854F0B]">
              {age >= 7 ? "Paket ini akan segera dihapus" : `Kedaluwarsa dalam ${7 - age} hari — selesaikan atau hapus`}
            </span>
          </div>
        )}
        {(addr || link) && (
          <div className="flex items-center justify-between gap-2 mt-1.5">
            {addr ? <span className="text-[11px] text-[#A1887F] truncate flex-1">{addr}</span> : <span />}
            {link}
          </div>
        )}
      </div>
    )
  }

  // Row untuk tab Diterima
  function ReceivedRow({ r }: { r: any }) {
    const h = r.handover
    if (!h) return null
    const date = getDateLabel(r.received_at || h.created_at)
    const today = isToday(r.received_at || h.created_at)
    const sender = h.sender_name || "-"
    const pkg = h.handover_items?.length ? h.handover_items[0].description : "-"
    const addr = h.destination_address || h.destination_city || null

    return (
      <div
        onClick={() => h.share_token && router.push(`/receipt/${h.share_token}`)}
        className="px-5 py-3.5 border-b border-[#E0DED7] cursor-pointer active:bg-[#F5F4F0]"
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {today && <span className="w-1.5 h-1.5 rounded-full bg-[#5D9E75] shrink-0" />}
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1887F]">Dari</span>
            <span className="font-medium text-[13px] text-[#3E2723] truncate ml-1">{sender}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#EAF3DE] text-[#3B6D11]">✓ Diterima</span>
            <span className="text-[11px] text-[#A1887F] tabular-nums">{date}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-[#7D6E68] italic truncate flex-1">{pkg}</span>
          {h.share_token && (
            <span className="text-[11px] font-medium text-[#5D4037] shrink-0">Lihat Tanda Terima</span>
          )}
        </div>
        {addr && (
          <span className="text-[11px] text-[#A1887F] truncate block mt-1">{addr}</span>
        )}
      </div>
    )
  }

  const showTeamFeed = studioRole === "OWNER" && handoverMode === "pro"
  const tabs = [
    { label: "Dalam Proses", count: pending.length },
    { label: "Terkirim",     count: done.length },
    { label: "Diterima",     count: received.length },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-[#3E2723]">

      {/* ── FIXED HEADER ── */}
      <div ref={headerRef} className="fixed top-0 inset-x-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#3E2723]/5">

        {/* Logo row */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-[#E0DED7]/60">
          <Link href="/paket" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nest-paket.png" alt="" className="h-6 w-auto shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3E2723]">NEST76 PAKET</span>
          </Link>
          <Link href="/paket" aria-label="Beranda">
            <Home className="h-5 w-5 text-[#3E2723] opacity-70" strokeWidth={1.75} />
          </Link>
        </div>

        {/* Judul row */}
        <div className="px-6 pt-2.5 pb-1">
          <h1 className="text-lg font-medium tracking-tight">
            {studioRole === "STAFF" ? "Paket Anda" : "Daftar Paket"}
          </h1>
        </div>

        {studioRole === "STAFF" && (
          <div className="px-6 pb-2">
            <Link href="/handover/select" className="text-[11px] font-medium text-[#3E2723] underline decoration-[#3E2723]/30 underline-offset-2">
              + Formulir baru
            </Link>
          </div>
        )}

        {showTeamFeed && (
          <div className="px-6 pb-3 border-b border-[#E0DED7]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#A1887F] mb-2">Aktivitas tim</p>
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {handovers.filter(h => h.staff_display_name).slice(0, 8).map(h => (
                <div key={`feed-${h.id}`} className="flex justify-between gap-2 text-[11px]">
                  <span className="font-medium text-[#5D4037]">{h.staff_display_name}</span>
                  <span className="text-[#A1887F] truncate">{h.receiver_target_name || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab row — 3 tabs */}
        <div className="flex">
          {tabs.map(({ label, count }, i) => (
            <button key={i} onClick={() => { setActiveTab(i as ActiveTab); if (i === 2 && selectMode) cancelSelect() }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium border-b-2 transition-colors
                ${activeTab === i ? "border-[#3E2723] text-[#3E2723]" : "border-transparent text-[#A1887F]"}`}
            >
              {label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                  ${activeTab === i
                    ? i === 0 ? "bg-[#FAEEDA] text-[#854F0B]"
                      : i === 2 ? "bg-[#EAF3DE] text-[#3B6D11]"
                      : "bg-[#F0EDE8] text-[#5D4037]"
                    : "bg-[#F0EDE8] text-[#A1887F]"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div
        className="flex-1 pb-16 overflow-hidden"
        style={{ paddingTop: headerH }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-250 ease-out"
          style={{ transform: `translateX(${activeTab === 0 ? "0%" : activeTab === 1 ? "-33.333%" : "-66.666%"})`, width: "300%" }}
        >
          {/* Tab 0: Dalam Proses */}
          <div className={`w-1/3 ${activeTab !== 0 ? "pointer-events-none" : ""}`}>
            {pending.length === 0 ? (
              <div className="px-5 py-10 text-center space-y-3">
                <p className="text-[12px] text-[#A1887F]">Belum ada paket dalam proses.</p>
                <Link href="/handover/select"
                  className="inline-block text-[12px] font-medium text-[#3E2723] underline decoration-[#3E2723]/30 underline-offset-2">
                  Buat Tanda Terima baru →
                </Link>
              </div>
            ) : (
              <>
                {pending.map(h => <SentRow key={h.id} h={h} />)}
                <div className="px-5 py-5 text-center">
                  <Link href="/handover/select"
                    className="text-[12px] font-medium text-[#3E2723] underline decoration-[#3E2723]/30 underline-offset-2">
                    + Buat Tanda Terima Baru
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Tab 1: Terkirim Selesai */}
          <div className={`w-1/3 ${activeTab !== 1 ? "pointer-events-none" : ""}`}>
            {done.length === 0 ? (
              <p className="px-5 py-10 text-center text-[12px] text-[#A1887F] italic">
                Belum ada paket yang selesai.
              </p>
            ) : (
              done.map(h => <SentRow key={h.id} h={h} />)
            )}
          </div>

          {/* Tab 2: Diterima */}
          <div className={`w-1/3 ${activeTab !== 2 ? "pointer-events-none" : ""}`}>
            {received.length === 0 ? (
              <div className="px-5 py-10 text-center space-y-2">
                <p className="text-[12px] text-[#A1887F]">
                  Belum ada paket yang tercatat diterima oleh akun ini.
                </p>
                <p className="text-[11px] text-[#C4B8B0]">
                  Paket akan muncul di sini saat kamu konfirmasi terima dalam keadaan login.
                </p>
              </div>
            ) : (
              received.map(r => <ReceivedRow key={r.id} r={r} />)
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 inset-x-0 z-[50] border-t border-[#3E2723]/5 bg-[#FAF9F6]/85 backdrop-blur-md px-6 py-6 text-center">
        <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#3E2723]/70">
          NEST76 STUDIO • PRODUCT OF THE ARCHIVE
        </p>
        <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.3em] text-[#3E2723]/40">
          © 2026 ALL RIGHTS RESERVED
        </p>
      </div>

      {selectMode && activeTab !== 2 && (
        <div className="fixed bottom-0 inset-x-0 z-[60] flex items-center justify-between bg-[#3E2723] px-6 py-4 text-white">
          <span className="text-sm">{selected.length} dipilih</span>
          <div className="flex gap-6 text-sm">
            <button onClick={cancelSelect}>Batal</button>
            <button onClick={deleteSelected}>Hapus</button>
          </div>
        </div>
      )}
    </div>
  )
}
