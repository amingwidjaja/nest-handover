"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { PaketHubSkeleton } from "@/components/nest/paket-skeleton"
import { LayoutDashboard, UserCircle, Plus } from "lucide-react"
import Link from "next/link"

const ease = [0.22, 1, 0.36, 1] as const

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease }
  }
}

const btn =
  "transition-transform active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E2723]/20"

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

      setUserName(profile.display_name?.split(" ")[0] || "User")
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
      } catch {
        // ignore
      }
    }
    gate()
  }, [router])

  if (!authReady) return <PaketHubSkeleton />

  return (
    <motion.div
      className="flex flex-col items-center justify-start"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
        <motion.div variants={item} className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-nest-paket.png"
            alt="NEST76"
            className="h-36 w-auto rounded-lg grayscale brightness-90 contrast-125"
          />
          <h2 className="text-center text-sm font-black uppercase tracking-[0.4em] text-[#3E2723] opacity-80">
            Studio Archive
          </h2>
        </motion.div>

        <motion.div variants={item} className="space-y-1 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#9A8F88]">
            Selamat datang,
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Halo, {userName}
          </h1>
        </motion.div>

        <motion.div variants={item} className="w-full space-y-3">
          <Link
            href="/handover/select"
            className={`${btn} flex w-full items-center justify-center gap-2 rounded-xl bg-[#3E2723] py-5 text-xs font-bold uppercase tracking-[0.3em] text-[#FAF9F6] shadow-xl shadow-[#3E2723]/20`}
          >
            <Plus className="h-5 w-5" strokeWidth={3} />
            Buat Tanda Terima
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard"
              className={`${btn} flex flex-col items-center justify-center gap-2 rounded-xl border border-[#3E2723]/10 bg-white py-4 text-[10px] font-black uppercase tracking-widest text-[#3E2723] shadow-sm`}
            >
              <LayoutDashboard className="h-5 w-5" strokeWidth={2} />
              Daftar Paket
            </Link>
            <Link
              href="/profile"
              className={`${btn} flex flex-col items-center justify-center gap-2 rounded-xl border border-[#3E2723]/10 bg-white py-4 text-[10px] font-black uppercase tracking-widest text-[#3E2723] shadow-sm`}
            >
              <UserCircle className="h-5 w-5" strokeWidth={2} />
              Profil
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="mx-auto mt-auto w-full max-w-sm space-y-4 pt-10">
        <motion.div
          variants={item}
          className="rounded-xl border border-[#3E2723]/10 bg-[#EFEBE9]/60 px-5 py-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#5D4037]/80">
                Paket aktif
              </span>
              <span className="mt-1 text-2xl font-black tabular-nums leading-none text-[#3E2723]">
                {pending}
              </span>
            </div>
            <div className="h-10 w-px bg-[#3E2723]/20" aria-hidden />
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#5D4037]/80">
                Terakhir update
              </span>
              <span className="mt-1 text-xs font-bold uppercase tracking-tight text-[#3E2723]">
                {last ?? "—"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
