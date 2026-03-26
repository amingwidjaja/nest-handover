"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { PaketHubSkeleton } from "@/components/nest/paket-skeleton"
import { StudioFooter } from "@/components/nest/studio-footer"
import { StudioHeader } from "@/components/nest/studio-header" // Tambahin ini
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
      const { data: { session } } = await supabase.auth.getSession()

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
        const pendingList = data.handovers.filter((h: any) => h.status !== "accepted")
        setPending(pendingList.length)
        if (data.handovers.length) {
          setLast(new Date(data.handovers[0].created_at).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short"
          }))
        }
      } catch (e) { console.error(e) }
    }
    gate()
  }, [router])

  if (!authReady) return <PaketHubSkeleton />

  return (
    /* h-screen + overflow-hidden: WAJIB biar nempel setinggi layar HP */
    <div className="flex h-screen flex-col overflow-hidden bg-[#FAF9F6] text-[#3E2723]">
      <StudioHeader />

      {/* justify-between: Rahasia biar konten & footer kepisah jauh ke ujung-ujung */}
      <motion.main 
        className="flex flex-1 flex-col justify-between px-6 pt-20 pb-4" 
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* --- BAGIAN ATAS (LOGO & BUTTONS) --- */}
        <div className="flex flex-col items-center">
          <div className="mx-auto flex w-full max-sm flex-col items-center gap-6">
            
            {/* LOGO GAHAR */}
            <motion.div variants={item} className="flex flex-col items-center gap-4">
              <img
                src="/logo-nest-paket.png"
                alt="NEST76"
                className="h-32 w-auto rounded-lg grayscale brightness-75 contrast-125"
              />
              <h2 className="text-center text-[10px] font-black tracking-[0.4em] opacity-60 uppercase">
                Studio Archive
              </h2>
            </motion.div>

            {/* GREETING */}
            <motion.div variants={item} className="space-y-1 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9A8F88]">
                Selamat datang,
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-[#3E2723]">Halo, {userName}</h1>
            </motion.div>

            {/* BUTTONS */}
            <motion.div variants={item} className="w-full space-y-3">
              <Link
                href="/handover/select"
                className={`${btn} flex w-full items-center justify-center gap-2 rounded-xl bg-[#3E2723] py-4 text-xs font-bold uppercase tracking-[0.3em] text-[#FAF9F6] shadow-lg`}
              >
                <Plus className="h-5 w-5" strokeWidth={3} />
                Buat Tanda Terima
              </Link>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/dashboard"
                  className={`${btn} flex flex-col items-center justify-center gap-2 rounded-xl border border-[#3E2723]/15 bg-white py-3 text-[9px] font-black uppercase tracking-widest text-[#3E2723]`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Daftar Paket
                </Link>
                <Link
                  href="/profile"
                  className={`${btn} flex flex-col items-center justify-center gap-2 rounded-xl border border-[#3E2723]/15 bg-white py-3 text-[9px] font-black uppercase tracking-widest text-[#3E2723]`}
                >
                  <UserCircle className="h-4 w-4" />
                  Profil
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- BAGIAN BAWAH (STATS & FOOTER) --- */}
        <div className="w-full space-y-2">
          <motion.div
            variants={item}
            className="mx-auto w-full max-w-sm rounded-xl border border-[#3E2723]/10 bg-[#EFEBE9]/60 px-5 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Paket aktif</span>
                <span className="text-xl font-black tabular-nums leading-none">{pending}</span>
              </div>
              <div className="h-8 w-px bg-[#3E2723]/20" />
              <div className="flex flex-col text-right">
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Update</span>
                <span className="text-[10px] font-bold uppercase tracking-tight">{last ?? "—"}</span>
              </div>
            </div>
          </motion.div>

          {/* FOOTER NEMPEL BAWAH & GA BENING LAGI */}
          <StudioFooter />
        </div>
      </motion.main>
    </div>
  )
}