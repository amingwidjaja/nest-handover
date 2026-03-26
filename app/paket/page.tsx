"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { PaketHubSkeleton } from "@/components/nest/paket-skeleton"
import { LayoutDashboard, UserCircle, Plus } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease }
  }
}

const btn =
  "transition-transform active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E2723]/20"

function firstName(displayName: string | null | undefined): string {
  const t = displayName?.trim()
  if (!t) return "User"
  return t.split(/\s+/)[0] || "User"
}

export default function PaketHomePage() {
  const router = useRouter()
  const [pending, setPending] = useState(0)
  const [last, setLast] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [userName, setUserName] = useState("User")

  useEffect(() => {
    async function gate() {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/login?redirect=/paket")
        return
      }

      const pr = await fetch("/api/profile")
      const pj = await pr.json()
      const profile = pj.profile

      if (!profile || !profile.onboarded_at) {
        router.replace("/choose-type?redirect=/paket")
        return
      }

      setUserName(firstName(profile.display_name))
      setAuthReady(true)

      try {
        const res = await fetch("/api/handover/list")
        const data = await res.json()
        if (!data.handovers) return
        const pendingList = data.handovers.filter(
          (h: { status: string }) => h.status !== "accepted"
        )
        setPending(pendingList.length)
        if (data.handovers.length) {
          setLast(
            new Date(data.handovers[0].created_at).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short"
            })
          )
        }
      } catch (e) {
        console.error(e)
      }
    }
    gate()
  }, [router])

  if (!authReady) return <PaketHubSkeleton />

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FAF9F6] text-[#3E2723]">
      <motion.div
        className="flex min-h-0 flex-1 flex-col"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Ganti justify-center ke justify-start dan tambah pt-12 (atau pt-16) */}
<div className="flex min-h-0 flex-1 flex-col justify-start px-6 pt-12 pb-5">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6">
          <motion.div variants={item} className="flex flex-col items-center gap-3">
      <img
        src="/logo-nest-paket.png"
        alt="NEST76 Paket"
        className="h-16 w-auto rounded-2xl shadow-lg shadow-[#3E2723]/10 ring-1 ring-[#3E2723]/5"
      />
      <h2 className="text-center text-xl font-bold tracking-tight text-[#3E2723]">
        NEST76 PAKET
      </h2>
    </motion.div>

          <motion.div variants={item} className="space-y-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#9A8F88]">
              Selamat datang,
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Halo, {userName}
            </h1>
          </motion.div>

          <motion.div variants={item} className="w-full space-y-3">
            <Link
              href="/handover/select"
              className={`${btn} flex w-full items-center justify-center gap-2 rounded-xl bg-[#3E2723] py-4 text-sm font-bold uppercase tracking-[0.28em] text-[#FAF9F6] shadow-lg shadow-[#3E2723]/25`}
            >
              <Plus className="h-5 w-5 shrink-0" strokeWidth={2.5} />
              Buat Tanda Terima
            </Link>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/dashboard"
                className={`${btn} flex flex-col items-center justify-center gap-2 rounded-xl border border-[#3E2723]/12 bg-white py-4 text-[10px] font-bold uppercase tracking-wider text-[#3E2723] shadow-sm`}
              >
                <LayoutDashboard className="h-5 w-5 text-[#3E2723]" strokeWidth={1.75} />
                Daftar Paket
              </Link>
              <Link
                href="/profile"
                className={`${btn} flex flex-col items-center justify-center gap-2 rounded-xl border border-[#3E2723]/12 bg-white py-4 text-[10px] font-bold uppercase tracking-wider text-[#3E2723] shadow-sm`}
              >
                <UserCircle className="h-5 w-5 text-[#3E2723]" strokeWidth={1.75} />
                Profil Saya
              </Link>
            </div>
          </motion.div>
        </div>
        </div>

        <footer className="shrink-0 space-y-4 px-6 pb-6 pt-2">
  {/* Stats Box tetep sama */}
  <motion.div
    variants={item}
    className="mx-auto w-full max-w-sm rounded-xl border border-[#3E2723]/8 bg-[#EFEBE9]/50 px-4 py-3 text-center"
  >
    <div className="flex items-center justify-around gap-4 text-[10px] font-semibold uppercase tracking-widest text-[#5D4037]">
      <div>
        <span className="block text-lg font-bold tabular-nums text-[#3E2723]">{pending}</span>
        <span className="opacity-80">Paket aktif</span>
      </div>
      <div className="h-8 w-px bg-[#3E2723]/10" aria-hidden />
      <div className="min-w-0 flex-1 text-left">
        <span className="block text-[9px] opacity-70">Terakhir update</span>
        <span className="font-bold text-[#3E2723] truncate block">{last ?? "—"}</span>
      </div>
    </div>
  </motion.div>

  {/* THE ULTIMATE COPYRIGHT */}
  <motion.div variants={item} className="space-y-1 text-center">
    <p className="text-[9px] font-bold tracking-[0.3em] text-[#3E2723]/50 uppercase">
      NEST76 STUDIO • PRODUCT OF THE ARCHIVE
    </p>
    <p className="text-[8px] font-medium tracking-[0.15em] text-[#3E2723]/30 uppercase">
      © 2026 ALL RIGHTS RESERVED
    </p>
  </motion.div>
</footer>
      </motion.div>
    </div>
  )
}
