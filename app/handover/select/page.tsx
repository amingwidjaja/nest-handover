"use client"

import React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { HANDOVER_MODE_KEY, type HandoverMode } from "@/lib/handover-mode"
import { StudioHeader } from "@/components/nest/studio-header"
import { StudioFooter } from "@/components/nest/studio-footer"

const PRIMARY = "#3E2723"
const BG = "#FAF9F6"

const ease = [0.22, 1, 0.36, 1] as const

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.04 }
  }
}

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.44, ease }
  }
}

const cardMotion = {
  whileTap: { scale: 0.95 },
  whileHover: { y: -2 },
  transition: { type: "spring" as const, stiffness: 460, damping: 34 }
}

function clearLiteOnlyDrafts() {
  try {
    localStorage.removeItem("draft_destination_address")
    localStorage.removeItem("draft_destination_lat")
    localStorage.removeItem("draft_destination_lng")
    localStorage.removeItem("draft_destination_city")
    localStorage.removeItem("draft_destination_postcode")
    localStorage.removeItem("draft_receiver_email")
    localStorage.removeItem("draft_address")
    localStorage.removeItem("draft_lat")
    localStorage.removeItem("draft_lng")
  } catch {
    /* ignore */
  }
}

export default function HandoverSelectModePage() {
  const router = useRouter()
  const [pendingHandovers, setPendingHandovers] = React.useState<{ id: string; receiver_target_name: string; created_at: string; destination_address?: string | null }[]>([])

  React.useEffect(() => {
    async function checkPending() {
      try {
        const res = await fetch("/api/handover/list")
        const data = await res.json()
        const pending = (data.handovers ?? []).filter((h: any) => h.status === "created")
        setPendingHandovers(pending)
      } catch { /* ignore */ }
    }
    checkPending()
  }, [])

  function choose(mode: HandoverMode) {
    try {
      localStorage.setItem(HANDOVER_MODE_KEY, mode)
      if (mode === "lite") clearLiteOnlyDrafts()
    } catch {
      /* ignore */
    }
    router.push("/handover/create")
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: BG, color: PRIMARY }}
    >
      <StudioHeader />

      <motion.main
        className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 pb-32 pt-24 sm:px-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.header variants={item} className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em]" style={{ color: PRIMARY }}>
            NEST76 STUDIO
          </p>
          <h1 className="text-[1.65rem] font-light leading-tight tracking-tight sm:text-3xl" style={{ color: PRIMARY }}>
            Pilih cara dokumentasi
          </h1>
          <p className="text-[13px] leading-relaxed opacity-80" style={{ color: PRIMARY }}>
            Satu ketukan — menu berikut mengatur alur formulir Anda.
          </p>
        </motion.header>

        {pendingHandovers.length > 0 && (
          <motion.div variants={item} className="rounded-xl border border-[#E0DED7] bg-white overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A1887F] px-4 pt-4 pb-2">
              Paket belum selesai
            </p>
            {pendingHandovers.slice(0, 3).map((h) => {
              const isPro = Boolean(h.destination_address)
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => { window.location.href = `/package?handover_id=${encodeURIComponent(h.id)}` }}
                  className="w-full flex items-center justify-between px-4 py-3 border-t border-[#E0DED7] text-left active:bg-[#F5F4F0] transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        isPro ? "bg-[#EAF3DE] text-[#3B6D11]" : "bg-[#F0EDE8] text-[#A1887F]"
                      }`}>
                        {isPro ? "PRO" : "LITE"}
                      </span>
                      <p className="text-sm font-medium text-[#3E2723]">{h.receiver_target_name || "-"}</p>
                    </div>
                    <p className="text-[11px] text-[#A1887F]">
                      {new Date(h.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#3E2723] font-medium shrink-0 ml-3">Lanjut →</span>
                </button>
              )
            })}
            <div className="border-t border-[#E0DED7] px-4 py-3">
              <p className="text-[11px] text-[#A1887F]">Atau pilih mode di bawah untuk buat paket baru.</p>
            </div>
          </motion.div>
        )}

        <motion.button
          type="button"
          variants={item}
          onClick={() => choose("lite")}
          className="group w-full rounded-sm bg-white/70 px-6 py-7 text-left shadow-sm nest-border-drawing-dashed sm:px-8 sm:py-8"
          style={{ color: PRIMARY }}
          {...cardMotion}
        >
          <div className="flex flex-col items-start gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: PRIMARY }}>
              RINGKAS
            </span>
            <span className="text-[1.35rem] font-light tracking-[0.06em] sm:text-2xl" style={{ color: PRIMARY }}>
              NEST-LITE
            </span>
            <p className="text-[13px] leading-[1.65] sm:text-[14px]" style={{ color: PRIMARY }}>
              Mode instan untuk dokumentasi harian tanpa birokrasi alamat. Cukup
              catat barangnya, biar sistem yang mengunci waktu serah terimanya.
              Cocok untuk mahasiswa, karyawan kantor, atau sekadar pengingat:
              &ldquo;Barang gue ada di siapa?&rdquo;.
            </p>
          </div>
        </motion.button>

        <motion.button
          type="button"
          variants={item}
          onClick={() => choose("pro")}
          className="group w-full rounded-sm bg-white px-6 py-7 text-left shadow-md nest-border-drawing sm:px-8 sm:py-8"
          style={{ color: PRIMARY }}
          {...cardMotion}
        >
          <div className="flex flex-col items-start gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: PRIMARY }}>
              LENGKAP
            </span>
            <span className="text-[1.35rem] font-light tracking-[0.06em] sm:text-2xl" style={{ color: PRIMARY }}>
              NEST-PRO
            </span>
            <p className="text-[13px] leading-[1.65] sm:text-[14px]" style={{ color: PRIMARY }}>
              Standar profesional untuk UMKM dan kebutuhan resmi. Membangun
              integritas pengiriman dengan validasi Alamat presisi, Geo-Tagging
              otomatis, dan sistem notifikasi otomatis. Dokumentasi sah yang
              siap untuk skala bisnis.
            </p>
          </div>
        </motion.button>

        <motion.p
          variants={item}
          className="mx-auto mt-4 max-w-md text-center text-[10px] leading-relaxed sm:text-[11px]"
          style={{ color: PRIMARY }}
        >
          © 2026 NEST76 STUDIO • Membangun alat yang membantu manusia, bukan
          menggantikannya. Precision in every hand-off.
        </motion.p>
      </motion.main>

      <StudioFooter />
    </div>
  )
}
