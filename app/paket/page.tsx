"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { NestPrimaryLink } from "@/components/nest/primary-button"
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
      if (!session) { router.replace("/login?redirect=/paket"); return; }

      const pr = await fetch("/api/profile")
      const pj = await pr.json()
      const profile = pj.profile
      if (!profile || !profile.onboarded_at) { router.replace("/choose-type?redirect=/paket"); return; }
      
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
            setLast(new Date(data.handovers[0].created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }))
          }
        } catch (e) { console.error(e) }
      }
      load()
    }
    gate()
  }, [router])

  if (!authReady) return <PaketHubSkeleton />

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#FAF9F6] px-8 text-center text-[#3E2723]">
      
      {/* Background Subtle Branding - Pemanis Visual */}
      <div className="absolute top-10 flex w-full items-center justify-center gap-3 opacity-20">
        <span className="h-[1px] w-8 bg-[#3E2723]" />
        <p className="text-[10px] font-bold uppercase tracking-[0.5em]">NEST76 PAKET</p>
        <span className="h-[1px] w-8 bg-[#3E2723]" />
      </div>

      <motion.div
        className="flex w-full max-w-sm flex-col items-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* 1. Profile Logo Image */}
        <motion.div variants={item} className="mb-6">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-sm border border-[#3E2723]/5">
            <img 
              src="/logo-nest-paket.png" 
              alt="Logo NEST76" 
              className="h-full w-full object-contain"
            />
          </div>
        </motion.div>

        {/* 2. Greeting Section */}
        <motion.div variants={item} className="mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A8F88]">Selamat Datang,</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{userName}</h1>
        </motion.div>

        {/* 3. Main Action Buttons */}
        <div className="w-full space-y-3.5">
          <motion.div variants={item}>
            <NestPrimaryLink
              href="/handover/select"
              className="flex w-full items-center justify-center gap-3 rounded-sm bg-[#3E2723] py-5 font-bold uppercase tracking-widest text-[#FAF9F6] shadow-xl transition-all active:scale-[0.96]"
            >
              <Plus className="h-5 w-5" /> Buat Tanda Terima
            </NestPrimaryLink>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-2 gap-3.5">
            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center gap-2 rounded-sm border border-[#3E2723]/10 bg-white py-4 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all hover:bg-[#F5F4F0] active:scale-[0.94]"
            >
              <LayoutDashboard className="h-5 w-5 opacity-80" />
              Daftar Paket
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center justify-center gap-2 rounded-sm border border-[#3E2723]/10 bg-white py-4 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all hover:bg-[#F5F4F0] active:scale-[0.94]"
            >
              <UserCircle className="h-5 w-5 opacity-80" />
              Profil Saya
            </Link>
          </motion.div>
        </div>

        {/* 4. Stats & Signature (Tightened Spacing) */}
        <div className="mt-12 w-full space-y-8">
          {(pending > 0 || last) && (
            <motion.div 
              variants={item}
              className="flex justify-around rounded-sm bg-[#3E2723]/5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] opacity-70"
            >
              {pending > 0 && <div>{pending} PAKET AKTIF</div>}
              {last && <div>TERAKHIR: {last}</div>}
            </motion.div>
          )}

          <motion.div variants={item} className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#3E2723]/40">
              A PRODUCT OF NEST76 STUDIO
            </p>
            <p className="text-[8px] font-mono opacity-20 tracking-widest uppercase">
              2026 Edition • Local Build
            </p>
          </motion.div>
        </div>

      </motion.div>
    </div>
  )
}