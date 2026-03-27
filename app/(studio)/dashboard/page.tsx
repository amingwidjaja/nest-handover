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
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const timerRef = useRef<any>(null)
  const handoversRef = useRef<any[]>([])

  useEffect(() => {
    handoversRef.current = handovers
  }, [handovers])

  // Fetch profile once on mount to get role + mode
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile")
        if (!res.ok) return
        const data = await res.json()
        const profile = data.profile
        if (!profile) return
        setStudioRole(profile.role ?? null)
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("handover_mode")
          if (stored === "lite" || stored === "pro") {
            setHandoverMode(stored)
          }
        }
      } catch {
        // ignore
      }
    }
    loadProfile()
  }, [])

  const load = useCallback(async function load() {
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

  useEffect(() => {
    load()
  }, [load])

  // Poll for receipt PDF on accepted handovers
  useEffect(() => {
    const needsReceipt = handovers.some(
      (h) => h.status === "accepted" && !h.receipt_url
    )
    if (!needsReceipt) return

    async function pollOnce() {
      const stuck = handoversRef.current.filter(
        (h: { status?: string; receipt_url?: string | null }) =>
          h.status === "accepted" && !h.receipt_url
      )
      if (!stuck.length) return

      for (const h of stuck) {
        if (!h.share_token) continue
        try {
          const res = await fetch(
            `/api/handover/receipt-data?token=${encodeURIComponent(String(h.share_token))}`,
            { cache: "no-store" }
          )
          if (!res.ok) continue
          const data = await res.json()
          if (data?.id && data.receipt_url) {
            setHandovers((prev) =>
              prev.map((row) =>
                row.id === h.id
                  ? { ...row, receipt_url: data.receipt_url, status: data.status ?? row.status }
                  : row
              )
            )
          }
        } catch { /* ignore */ }
      }

      if (stuck.some((h: { share_token?: string }) => !h.share_token)) {
        await load()
      }
    }

    pollOnce()
    const id = window.setInterval(pollOnce, 5000)
    return () => window.clearInterval(id)
  }, [handovers, load])

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function startSelect(id: string) {
    setSelectMode(true)
    setSelected([id])
  }

  function cancelSelect() {
    setSelectMode(false)
    setSelected([])
  }

  async function deleteSelected() {
    if (selected.length === 0) return
    if (!confirm("Hapus paket yang dipilih?")) return

    const res = await fetch("/api/handover/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data?.error || "Paket tidak bisa dihapus")
      return
    }
    cancelSelect()
    load()
  }

  const pending = handovers.filter((h) => h.status === "created")
  const received = handovers.filter(
    (h) => h.status === "received" || h.status === "accepted"
  )

  function formatDate(dateString: string) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(new Date(dateString))
  }

  function getDateLabel(dateString: string) {
    const d = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (target.getTime() === today.getTime()) return "Hari ini"
    if (target.getTime() === yesterday.getTime()) return "Kemarin"
    return formatDate(dateString)
  }

  function isToday(dateString: string) {
    const d = new Date(dateString)
    const now = new Date()
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    )
  }

  function handleClick(h: any) {
    if (selectMode) { toggleSelect(h.id); return }
    if (h.status === "created") {
      router.push(`/handover/create?id=${encodeURIComponent(h.id)}`)
      return
    }
    router.push(`/handover/${h.id}`)
  }

  function receiptCell(h: any) {
    if (selectMode) return null
    if (h.status === "accepted") {
      const pdf = h.receipt_url ? resolveNestEvidencePublicUrl(h.receipt_url) : null
      if (pdf) {
        return (
          <a
            href={pdf}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[9px] font-semibold uppercase tracking-wide text-[#5D4037] underline decoration-[#5D4037]/50"
          >
            Lihat Tanda Terima
          </a>
        )
      }
      return <span className="text-[8px] leading-tight text-[#A1887F]">Menyiapkan PDF…</span>
    }
    if (h.status === "received" && h.share_token) {
      return (
        <Link
          href={`/receipt/${h.share_token}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[9px] font-semibold uppercase tracking-wide text-[#5D4037] underline decoration-[#5D4037]/50"
        >
          Lihat Tanda Terima
        </Link>
      )
    }
    return null
  }

  function row(h: any) {
    const date = getDateLabel(h.created_at)
    const receiver = h.receiver_target_name || "-"
    const packageName = h.handover_items?.length ? h.handover_items[0].description : "-"
    const checked = selected.includes(h.id)
    const today = isToday(h.created_at)

    return (
      <div
        key={h.id}
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
        onClick={() => handleClick(h)}
        onContextMenu={(e) => { e.preventDefault(); if (!selectMode) startSelect(h.id) }}
        onTouchStart={() => {
          timerRef.current = setTimeout(() => { if (!selectMode) startSelect(h.id) }, 500)
        }}
        onTouchEnd={() => clearTimeout(timerRef.current)}
        onTouchMove={() => clearTimeout(timerRef.current)}
        className={`
          px-6 py-4 flex items-center justify-between text-[13px]
          cursor-pointer border-b border-[#E0DED7]
          ${highlightId === h.id ? "new-row" : ""}
          ${checked ? "bg-[#A1887F]/30" : ""}
        `}
      >
        <div className="w-20 flex items-center gap-2">
          {today && <span className="w-[4px] h-5 rounded-sm bg-[#A1887F] shrink-0" />}
          <span className="text-[#A1887F] whitespace-nowrap">{date}</span>
        </div>
        <span className="flex-1 font-medium truncate px-2">{receiver}</span>
        <span className="flex-1 min-w-0 italic text-[#A1887F] truncate">{packageName}</span>
        <div className="w-[5.5rem] shrink-0 text-right flex flex-col items-end justify-center gap-0.5">
          {receiptCell(h)}
        </div>
        <span className="w-6 shrink-0 text-right tabular-nums">
          {selectMode ? "" : h.status === "accepted" ? "✓" : "○"}
        </span>
      </div>
    )
  }

  const showTeamFeed = studioRole === "OWNER" && handoverMode === "pro"

  return (
    <>
      <div className="shrink-0 pb-4 pt-2">
        <h1 className="text-xl font-medium tracking-tight">
          {studioRole === "STAFF" ? "Paket Anda" : "Daftar Paket"}
        </h1>
      </div>

      {studioRole === "STAFF" && (
        <div className="shrink-0 border-b border-[#E0DED7] bg-[#FAF9F6] py-4">
          <Link
            href="/handover/select"
            className="text-sm font-medium text-[#3E2723] underline decoration-[#3E2723]/30 underline-offset-4"
          >
            Formulir baru — buat tanda terima
          </Link>
        </div>
      )}

      {showTeamFeed && (
        <section className="shrink-0 border-b border-[#E0DED7] bg-[#F7F6F3]/90 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F] mb-3">
            Aktivitas tim
          </p>
          <div className="max-h-36 space-y-2 overflow-y-auto">
            {handovers.filter((h) => h.staff_display_name).slice(0, 12).map((h) => (
              <div
                key={`feed-${h.id}`}
                className="flex items-center justify-between gap-3 border-t border-[#E0DED7]/70 pt-2 first:border-t-0 first:pt-0"
              >
                <span className="text-[11px] font-semibold text-[#5D4037]">{h.staff_display_name}</span>
                <span className="min-w-0 flex-1 truncate text-right text-[10px] text-[#A1887F]">
                  {h.receiver_target_name || "—"}
                </span>
              </div>
            ))}
            {handovers.filter((h) => h.staff_display_name).length === 0 && (
              <p className="text-[11px] italic text-[#A1887F]">Belum ada aktivitas staf tercatat.</p>
            )}
          </div>
        </section>
      )}

      <section className="flex flex-col border-b border-[#E0DED7]">
        <div className="py-2 text-[10px] font-bold uppercase tracking-widest text-[#A1887F] bg-[#F2F1ED]/50">
          Dalam Proses
        </div>
        <div>{pending.map(row)}</div>
      </section>

      <section className="flex flex-col">
        <div className="py-2 text-[10px] font-bold uppercase tracking-widest text-[#A1887F] bg-[#F2F1ED]/50">
          Paket Telah Diterima
        </div>
        <div>{received.map(row)}</div>
      </section>

      <div className="border-t border-[#E0DED7] p-6">
        <p className="text-center text-[10px] italic leading-relaxed text-[#A1887F]">
          Foto akan dihapus otomatis setelah 30 hari. Paket yang dititipkan akan
          dianggap telah diterima oleh penerima setelah 3 hari.
        </p>
      </div>

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
