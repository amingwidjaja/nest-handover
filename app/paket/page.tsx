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
      
      setUserName(profile.display_name?.split(' ')[0] || "User") // Ambil nama depan aja biar akrab
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] px-8 py-10 text-center text-[#3E2723]">
      <motion.div
        className="flex w-full max-w-sm flex-col items-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Logo Branding */}
        <motion.div variants={item} className="mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3E2723] text-[#FAF9F6] shadow-lg">
             <Package2 className="h-7 w-7" />
          </div>
        </motion.div>

        {/* Header Title */}
        <motion.div variants={item} className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#9A8F88]">NEST76 PAKET</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Halo, {userName}</h1>
        </motion.div>

        {/* Action Stack */}
        <div className="w-full space-y-4">
          <motion.div variants={item}>
            <NestPrimaryLink
              href="/handover/select"
              className="flex w-full items-center justify-center gap-3 rounded-sm bg-[#3E2723] py-5 font-bold uppercase tracking-widest text-[#FAF9F6] shadow-xl transition-all active:scale-[0.96]"
            >
              <Plus className="h-5 w-5" /> Buat Tanda Terima
            </NestPrimaryLink>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center gap-2 rounded-sm border-[1.5px] border-[#3E2723]/10 bg-white py-4 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all hover:bg-[#EFEBE9] active:scale-[0.94]"
            >
              <LayoutDashboard className="h-5 w-5 opacity-80" />
              Daftar Paket
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center justify-center gap-2 rounded-sm border-[1.5px] border-[#3E2723]/10 bg-white py-4 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all hover:bg-[#EFEBE9] active:scale-[0.94]"
            >
              <UserCircle className="h-5 w-5 opacity-80" />
              Profil Saya
            </Link>
          </motion.div>
        </div>

        {/* Status Mini-Card */}
        {(pending > 0 || last) && (
          <motion.div 
            variants={item}
            className="mt-10 w-full rounded-sm bg-[#3E2723]/5 p-4 text-[10px] uppercase tracking-widest opacity-80"
          >
            <div className="flex justify-around">
              {pending > 0 && <div><span className="font-bold">{pending}</span> Paket Aktif</div>}
              {last && <div>Terakhir: <span className="font-bold">{last}</span></div>}
            </div>
          </motion.div>
        )}

        {/* Signature */}
        <motion.div variants={item} className="mt-12 space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 italic">
            Product of NEST76 STUDIO
          </p>
          <p className="text-[8px] font-mono opacity-25">VER 2.0.26</p>
        </motion.div>
      </motion.div>
    </div>
  )
}