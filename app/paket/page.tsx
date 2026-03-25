"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"
import { NestPrimaryLink } from "@/components/nest/primary-button"
import { PaketHubSkeleton } from "@/components/nest/paket-skeleton"

const ease = [0.22, 1, 0.36, 1] as const

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease }
  }
}

export default function HomePage() {
  const router = useRouter()

  const [pending, setPending] = useState(0)
  const [last, setLast] = useState<string | null>(null)
  const [savedSerial, setSavedSerial] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)

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
      const profile = pj.profile as {
        onboarded_at?: string | null
        user_type?: string
        org_id?: string | null
      } | null
      if (!profile || !profile.onboarded_at) {
        router.replace("/choose-type?redirect=/paket")
        return
      }
      if (profile.user_type === "umkm" && !profile.org_id) {
        router.replace("/studio?redirect=/paket")
        return
      }
      setAuthReady(true)

      async function load() {
        const res = await fetch("/api/handover/list")
        const data = await res.json()

        if (!data.handovers) return

        const pendingList = data.handovers.filter(
          (h: { status: string }) => h.status !== "accepted"
        )

        setPending(pendingList.length)

        if (data.handovers.length) {
          const date = new Date(data.handovers[0].created_at).toLocaleDateString(
            "id-ID",
            { day: "2-digit", month: "short", year: "numeric" }
          )

          setLast(date)
        }
      }

      load()
    }

    gate()
  }, [router])

  useEffect(() => {
    if (typeof window === "undefined") return
    const sn = new URLSearchParams(window.location.search).get("sn")
    if (sn) setSavedSerial(sn)
  }, [])

  if (!authReady) {
    return <PaketHubSkeleton />
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FAF9F6] px-8 text-center text-[#3E2723]">
      <motion.div
        className="flex flex-col"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {savedSerial && (
          <motion.div
            variants={item}
            className="nest-border-drawing mx-auto mb-2 mt-6 max-w-md rounded-sm bg-white/80 px-4 py-3 text-left shadow-sm"
          >
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#8D6E63]">
              Tersimpan
            </p>
            <p className="break-all font-mono text-sm font-medium text-[#3E2723]">
              {savedSerial}
            </p>
            <button
              type="button"
              onClick={() => {
                setSavedSerial(null)
                router.replace("/paket")
              }}
              className="mt-2 text-[11px] text-[#8D6E63] underline underline-offset-2"
            >
              Tutup
            </button>
          </motion.div>
        )}

        <motion.div variants={item}>
          <img
            src="/logo-nest-paket.png"
            alt="NEST76 STUDIO"
            className="mx-auto mt-20 w-44"
          />
        </motion.div>

        <motion.div variants={item} className="mt-2 text-base tracking-widest opacity-60">
          NEST76 STUDIO
        </motion.div>

        <motion.h1
          variants={item}
          className="mx-auto mb-4 mt-10 max-w-md text-xl font-light leading-snug sm:text-2xl"
        >
          Bukti kirim jadi lebih jelas. Say bye-bye ke kertas! 🌿
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mb-12 max-w-lg px-2 text-sm font-light leading-relaxed opacity-80 sm:text-base"
        >
          Solusi Tanda Terima Digital yang rapi, cepat, dan 100% GRATIS.
        </motion.p>

        <motion.div variants={item} className="mx-auto w-full max-w-xs">
          <NestPrimaryLink
            href="/handover/select"
            className="nest-border-drawing block w-full rounded-sm bg-[#3E2723] py-4 font-medium text-[#FAF9F6] shadow-sm"
          >
            Buat Tanda Terima Digital
          </NestPrimaryLink>
        </motion.div>

        <motion.div variants={item}>
          <Link href="/profile" className="mt-4 block text-sm opacity-50">
            Profil
          </Link>
        </motion.div>

        <motion.div variants={item}>
          <Link href="/dashboard" className="mt-6 block text-base opacity-60">
            Lihat Daftar Paket
          </Link>
        </motion.div>
      </motion.div>

      {(pending > 0 || last) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35, ease }}
          className="mb-8 text-xs leading-relaxed opacity-50"
        >
          {pending > 0 && <div>{pending} paket sedang dalam proses</div>}

          {last && <div>Terakhir dibuat {last}</div>}
        </motion.div>
      )}
    </div>
  )
}
