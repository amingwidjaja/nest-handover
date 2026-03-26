"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback } from "react"
import { HANDOVER_ACTIVE_LIMITS } from "@/lib/handover-limits"
import { User, Store, ArrowRight, ShieldCheck } from "lucide-react"

function ChooseTypeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/paket"

  const go = useCallback(
    (type: "personal" | "umkm") => {
      try {
        localStorage.setItem("nest_onboarding_type", type)
        localStorage.setItem("nest_onboarding_redirect", redirect)
      } catch { /* ignore */ }
      router.push(`/register?type=${type}&redirect=${encodeURIComponent(redirect)}`)
    },
    [redirect, router]
  )

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#3E2723] flex flex-col items-center p-6 md:p-12">
      <main className="max-w-md w-full flex flex-col">
        
        {/* Branding Header */}
        <div className="text-center mb-10 space-y-4">
          <ShieldCheck className="w-10 h-10 mx-auto text-[#3E2723] opacity-80" strokeWidth={1.5} />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tighter uppercase">Mulai Sekarang</h1>
            <p className="text-[10px] font-bold text-[#A1887F] tracking-[0.2em] uppercase opacity-70">
              Pilih Profil Anda
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* PERSONAL OPTION */}
          <button
            type="button"
            onClick={() => go("personal")}
            className="group w-full text-left bg-white border border-[#D7CCC8]/50 p-6 hover:border-[#3E2723] transition-all shadow-sm relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#FAF9F6] text-[#3E2723]">
                <User className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#3E2723]" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#3E2723] mb-2">
              Akun Pribadi
            </h3>
            <p className="text-sm text-[#8D6E63] leading-relaxed">
              Untuk penggunaan pribadi & kirim bingkisan. Batas <span className="font-bold text-[#3E2723]">{HANDOVER_ACTIVE_LIMITS.personal} paket aktif</span>.
            </p>
          </button>

          {/* UMKM OPTION */}
          <button
            type="button"
            onClick={() => go("umkm")}
            className="group w-full text-left bg-white border border-[#D7CCC8]/50 p-6 hover:border-[#3E2723] transition-all shadow-sm relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#3E2723] text-white font-bold">
                <Store className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#3E2723]" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#3E2723] mb-2">
              Akun UMKM / Bisnis
            </h3>
            <p className="text-sm text-[#8D6E63] leading-relaxed">
              Profesional & terpercaya. Batas <span className="font-bold text-[#3E2723]">{HANDOVER_ACTIVE_LIMITS.umkm} paket aktif</span>. Sertakan Nama Usaha & Logo.
            </p>
          </button>
        </div>

        {/* Info Box - Refined for Clarity */}
<div className="mt-10 p-5 bg-[#EFEBE9]/40 border-l-[3px] border-[#3E2723] space-y-3">
  <div className="flex items-center gap-2">
    <span className="h-1.5 w-1.5 rounded-full bg-[#3E2723] animate-pulse" />
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#3E2723]">
      Panduan Protokol
    </p>
  </div>
  
  <p className="text-[11px] text-[#5D4037] leading-relaxed">
    Mode <strong className="text-[#3E2723]">Pribadi</strong> dirancang untuk kecepatan tanpa embel-embel bisnis. Mode <strong className="text-[#3E2723]">UMKM</strong> mengaktifkan fitur Branding (Nama Bisnis & Logo) serta batas paket aktif yang lebih besar.
  </p>
  
  <p className="text-[11px] font-medium text-[#8D6E63] italic border-t border-[#D7CCC8]/50 pt-2">
    Ragu? Mulai dengan Pribadi sekarang, Anda bisa upgrade ke UMKM kapan saja melalui pengaturan profil.
  </p>
</div>

        <p className="mt-16 text-[9px] text-center text-[#3E2723] font-mono tracking-[0.2em] uppercase font-bold opacity-60">
          © 2026 NEST76 STUDIO • Build with Passion and Integrity
        </p>
      </main>
    </div>
  )
}

export default function ChooseTypePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-[#3E2723]/20 border-t-[#3E2723] rounded-full animate-spin" />
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#A1887F]">
            Menyiapkan NEST76 PAKET...
          </p>
        </div>
      }
    >
      <ChooseTypeInner />
    </Suspense>
  )
}