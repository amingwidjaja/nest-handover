"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback } from "react"
import { HANDOVER_ACTIVE_LIMITS } from "@/lib/handover-limits"

function ChooseTypeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/paket"

  const go = useCallback(
    (type: "personal" | "umkm") => {
      try {
        localStorage.setItem("nest_onboarding_type", type)
        localStorage.setItem("nest_onboarding_redirect", redirect)
      } catch {
        /* ignore */
      }
      router.push(
        `/register?type=${type}&redirect=${encodeURIComponent(redirect)}`
      )
    },
    [redirect, router]
  )

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col">
      <main className="flex-1 px-6 py-12 max-w-lg mx-auto w-full flex flex-col">
        <p className="text-[10px] tracking-[0.35em] uppercase opacity-40 font-mono mb-4">
          NEST · Tanda Terima Digital
        </p>
        <h1 className="text-2xl font-light mb-2">Pilih jenis akun</h1>
        <p className="text-sm text-[#8D6E63] mb-8 leading-relaxed">
          Sebelum daftar, tentukan profil yang sesuai. Batas paket aktif dan fitur
          berbeda untuk Personal vs UMKM.
        </p>

        <div className="space-y-4 flex-1">
          <button
            type="button"
            onClick={() => go("personal")}
            className="w-full text-left rounded-sm border border-[#E0DED7] bg-white/60 hover:border-[#3E2723] transition-colors p-5 shadow-sm"
          >
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#5D4037] mb-1">
              Personal
            </div>
            <p className="text-sm leading-relaxed opacity-90">
              Untuk pengiriman pribadi. Batas{" "}
              <span className="font-medium text-[#3E2723]">
                {HANDOVER_ACTIVE_LIMITS.personal} paket aktif
              </span>{" "}
              sekaligus. Cukup nama & email untuk mulai.
            </p>
          </button>

          <button
            type="button"
            onClick={() => go("umkm")}
            className="w-full text-left rounded-sm border border-[#E0DED7] bg-white/60 hover:border-[#3E2723] transition-colors p-5 shadow-sm"
          >
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#5D4037] mb-1">
              UMKM
            </div>
            <p className="text-sm leading-relaxed opacity-90">
              Untuk bisnis. Batas{" "}
              <span className="font-medium text-[#3E2723]">
                {HANDOVER_ACTIVE_LIMITS.umkm} paket aktif
              </span>
              . Sertakan{" "}
              <span className="font-medium">nama bisnis, alamat, dan logo</span>{" "}
              (logo opsional saat daftar).
            </p>
          </button>
        </div>

        <p className="text-[11px] text-[#A1887F] leading-relaxed mt-10 mb-6 border-t border-[#E8E4DD] pt-6">
          <span className="font-medium text-[#6D4C41]">Disclaimer:</span> Data
          kamu hanya untuk identitas Tanda Terima Digital &amp; tidak
          disebarluaskan.
        </p>

        <div className="flex justify-between text-sm text-[#A1887F]">
          <Link
            href={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="underline underline-offset-2"
          >
            Sudah punya akun? Masuk
          </Link>
          <Link href="/" className="opacity-70">
            ← Beranda
          </Link>
        </div>
      </main>
    </div>
  )
}

export default function ChooseTypePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-sm text-[#A1887F]">
          Memuat…
        </div>
      }
    >
      <ChooseTypeInner />
    </Suspense>
  )
}
