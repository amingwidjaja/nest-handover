"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { NestPrimaryLink } from "@/components/nest/primary-button"
import { PaketHubSkeleton } from "@/components/nest/paket-skeleton"
import { LayoutDashboard, UserCircle, Plus, Package2 } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease }
  }
}

export default function HomePage() {
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
      
      setUserName(profile.display_name?.split(' ')[0] || "User")
      setAuthReady(true)

      async function load() {
        try {
          const res = await fetch("/api/handover/list")
          const data = await res.json()
          if (!data.handovers) return
          const pendingList = data.handovers.filter((h: any) => h.status !== "accepted")
          setPending(pendingList.length)
          if (data.handovers.length) {
            setLast(new Date(data.handovers[0].created_at).toLocaleDateString("id-ID", { 
              day: "2-digit", month: "short" 
            }))
          }
        } catch (e) { console.error(e) }
      }
      load()
    }
    gate()
  }, [router])

  if (!authReady) return <PaketHubSkeleton />

  return (
    // ANTI-SCROLL: Gunakan h-screen overflow-hidden. safe area padding buat mobile notch.
    <div className="flex h-screen flex-col items-center justify-center overflow-hidden bg-[#FAF9F6] px-8 text-center text-[#3E2723] pt-[safe] pb-[safe]">
      <motion.div
        // Container utama dipaksa full height h-full dan justify-between buat misahin header, middle, footer
        className="flex h-full w-full max-w-sm flex-col items-center justify-between"
        variants={container}
        initial="hidden"
        animate="show"
      >
        
        {/* 1. Header: Product Logo (User Request - Back in Business!) */}
        <motion.div variants={item} className="flex w-full items-center justify-center gap-2 pt-8">
            <span className="h-[1px] w-6 bg-[#3E2723]/30" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#3E2723]">
                NEST76 PAKET
            </h2>
            <span className="h-[1px] w-6 bg-[#3E2723]/30" />
        </motion.div>

        {/* 2. Middle Content Stack (Centered) */}
        <div className="flex flex-col items-center justify-center flex-grow -mt-10 w-full">
            {/* Branding Icon */}
            <motion.div variants={item} className="mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3E2723] text-[#FAF9F6] shadow-md">
                 <Package2 className="h-6 w-6" />
              </div>
            </motion.div>

            {/* Greeting */}
            <motion.div variants={item} className="mb-10 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#9A8F88]">Selamat Datang,</p>
              <h1 className="text-3xl font-semibold tracking-tight">Halo, {userName}</h1>
            </motion.div>

            {/* Action Buttons (The Gaptek-Proof) */}
            <div className="w-full max-w-xs space-y-3">
              <motion.div variants={item}>
                <NestPrimaryLink
                  href="/handover/select"
                  className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#3E2723] py-4.5 font-bold uppercase tracking-widest text-[#FAF9F6] shadow-xl transition-all active:scale-[0.95]"
                >
                  <Plus className="h-5 w-5" /> Buat Tanda Terima
                </NestPrimaryLink>
              </motion.div>

              <motion.div variants={item} className="grid grid-cols-2 gap-3">
                <Link
                  href="/dashboard"
                  className="flex flex-col items-center justify-center gap-2 rounded-sm border border-[#3E2723]/10 bg-white py-4 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all hover:bg-[#EFEBE9] active:scale-[0.93]"
                >
                  <LayoutDashboard className="h-5 w-5 opacity-70" />
                  Daftar Paket
                </Link>
                <Link
                  href="/profile"
                  className="flex flex-col items-center justify-center gap-2 rounded-sm border border-[#3E2723]/10 bg-white py-4 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all hover:bg-[#EFEBE9] active:scale-[0.93]"
                >
                  <UserCircle className="h-5 w-5 opacity-70" />
                  Profil Saya
                </Link>
              </motion.div>
            </div>
        </div>

        {/* 3. Footer Content Stack (Stats & Signature) */}
        <div className="w-full pb-8 flex flex-col items-center gap-6">
            {/* Status Mini-Card */}
            {(pending > 0 || last) && (
              <motion.div
                variants={item}
                className="w-full rounded-sm bg-[#3E2723]/5 p-3 text-[10px] uppercase tracking-widest opacity-80"
              >
                <div className="flex justify-around">
                  {pending > 0 && <div><span className="font-black text-xs">{pending}</span> PAKET AKTIF</div>}
                  {last && <div>TERAKHIR: <span className="font-black text-xs">{last}</span></div>}
                </div>
              </motion.div>
            )}

            {/* Signature */}
            <motion.div variants={item} className="space-y-0.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#3E2723]/50">
                A PRODUCT OF NEST76 STUDIO
              </p>
              <p className="text-[8px] font-mono opacity-30">© 2026 EDITION</p>
            </motion.div>
        </div>
      </motion.div>
    </div>
  )
}