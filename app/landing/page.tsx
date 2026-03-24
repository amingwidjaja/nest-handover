import Link from "next/link"
import { Bot, Sparkles } from "lucide-react"
import { AuthAwarePaketCta } from "@/components/auth-aware-paket-cta"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] flex flex-col items-center justify-center px-6 py-20">
      <p className="text-[10px] tracking-[0.4em] uppercase opacity-40 font-mono mb-6">
        NEST · Landing
      </p>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extralight tracking-tight mb-4 text-center max-w-3xl leading-tight">
        Bukti kirim jadi lebih jelas. Say bye-bye ke kertas! 🌿
      </h1>
      <p className="text-sm text-[#888] max-w-lg text-center mb-12 leading-relaxed">
        Solusi Tanda Terima Digital yang rapi, cepat, dan 100% GRATIS.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <AuthAwarePaketCta
          loggedInHref="/paket"
          guestHref="/choose-type?redirect=/paket"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#EDEDED] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.25em] rounded-sm hover:bg-white transition-colors"
        >
          <Sparkles className="w-4 h-4 opacity-70" strokeWidth={1.5} aria-hidden />
          Kirim
          <Bot className="w-4 h-4 opacity-70" strokeWidth={1.5} aria-hidden />
        </AuthAwarePaketCta>
        <span className="text-[10px] text-[#555] opacity-80 max-w-[200px] leading-snug">
          Ikon AI (placeholder) untuk fitur cerdas mendatang.
        </span>
      </div>

      <Link href="/" className="mt-16 text-[10px] tracking-[0.3em] uppercase opacity-40 hover:opacity-70">
        ← Studio
      </Link>
    </main>
  )
}
