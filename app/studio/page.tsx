"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

const INK = "#3E2723"
const BG = "#FAF9F6"

function StudioInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/paket"

  const [orgName, setOrgName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState<"create" | "join" | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetch("/api/profile")
      const j = await res.json()
      if (cancelled) return
      const p = j.profile as { org_id?: string | null } | null
      if (p?.org_id) {
        router.replace(redirect)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [redirect, router])

  async function createOrg(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!orgName.trim()) {
      setMsg("Nama studio wajib diisi.")
      return
    }
    setLoading("create")
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim() })
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.error || "Gagal membuat studio.")
        return
      }
      router.replace(redirect)
      router.refresh()
    } catch {
      setMsg("Terjadi kesalahan koneksi.")
    } finally {
      setLoading(null)
    }
  }

  async function joinOrg(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!inviteCode.trim()) {
      setMsg("Kode undangan wajib diisi.")
      return
    }
    setLoading("join")
    try {
      const res = await fetch("/api/organizations/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: inviteCode.trim() })
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.error || "Tidak dapat bergabung.")
        return
      }
      router.replace(redirect)
      router.refresh()
    } catch {
      setMsg("Terjadi kesalahan koneksi.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: BG, color: INK }}
    >
      <div className="absolute right-6 top-6 flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#3E2723]/60">
          Systems Online
        </span>
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-14">
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#9A8F88]">
          NEST76 STUDIO
        </p>
        <h1 className="mt-2 text-2xl font-light tracking-tight">
          Studio UMKM
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6D5D54]">
          Buat studio baru sebagai pemilik, atau masukkan kode undangan untuk
          bergabung sebagai staf.
        </p>

        <form onSubmit={createOrg} className="mt-10 space-y-4 border-t border-[#E0DED7] pt-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F]">
            Pemilik — buat studio
          </p>
          <input
            className="line-input w-full"
            placeholder="Nama UMKM / studio"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading !== null}
            className="w-full rounded-sm bg-[#3E2723] py-3 text-sm font-medium text-[#FAF9F6] disabled:opacity-50"
          >
            {loading === "create" ? "Memproses…" : "Buat studio"}
          </button>
        </form>

        <form onSubmit={joinOrg} className="mt-10 space-y-4 border-t border-[#E0DED7] pt-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1887F]">
            Staf — gabung dengan kode
          </p>
          <input
            className="line-input w-full font-mono uppercase tracking-widest"
            placeholder="Kode undangan"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          />
          <button
            type="submit"
            disabled={loading !== null}
            className="w-full border border-[#3E2723]/35 bg-white py-3 text-sm font-medium text-[#3E2723] disabled:opacity-50"
          >
            {loading === "join" ? "Memproses…" : "Gabung"}
          </button>
        </form>

        {msg && (
          <p className="mt-6 text-center text-xs text-[#5D4037]">{msg}</p>
        )}

        <Link
          href="/paket"
          className="mt-auto pt-12 text-center text-xs text-[#A1887F] underline underline-offset-4"
        >
          ← Kembali
        </Link>
      </main>
    </div>
  )
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center text-sm text-[#A1887F]"
          style={{ backgroundColor: "#FAF9F6" }}
        >
          Memuat…
        </div>
      }
    >
      <StudioInner />
    </Suspense>
  )
}
