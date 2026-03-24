import Link from "next/link"
import type { Metadata } from "next"
import { AuthAwarePaketCta } from "@/components/auth-aware-paket-cta"

export const metadata: Metadata = {
  title: "NEST76 | Studio Sistem Digital",
  description:
    "Tanda Terima Digital — bukti kirim jelas, tanpa kertas. Rapi, cepat, dan 100% GRATIS.",
}

export default function Home() {
  return (
    <main className="bg-[#0A0A0A] text-[#EDEDED] min-h-screen selection:bg-[#EDEDED] selection:text-[#0A0A0A] font-sans relative overflow-hidden">
      
      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(30,30,30,1)_0%,rgba(10,10,10,1)_70%)]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20 md:py-32 relative z-10">
        
        {/* HERO SECTION */}
        <header className="mb-28 md:mb-36">
  <div className="flex items-center gap-3 mb-10">
    <div className="h-2 w-2 rounded-full bg-[#333] animate-pulse" />
    <div className="text-[10px] tracking-[0.4em] uppercase opacity-30 font-mono">
      Systems Online / Jakarta, ID
    </div>
  </div>
  
  <h1 className="text-7xl md:text-8xl font-light tracking-tighter leading-none mb-10 text-white">
    NEST<span className="text-[#222]">76</span>
  </h1>

  <p className="text-xl md:text-2xl font-light text-[#888] max-w-2xl leading-relaxed">
    Membangun <strong className="text-white font-normal">infrastruktur digital</strong> yang presisi. Kami menyederhanakan alur kerja yang rumit menjadi sistem yang reliabel.
  </p>
</header>

        {/* SOLUTIONS GRID */}
        <section className="mb-32 md:mb-40">
          <div className="flex items-center gap-5 mb-16">
            <h2 className="text-xs uppercase tracking-[0.4em] opacity-40 whitespace-nowrap font-mono text-white">Solusi Digital</h2>
            <div className="h-[1px] w-full bg-[#1A1A1A]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-16 md:gap-x-16 items-start">
            <div className="md:col-span-7 group">
              <AuthAwarePaketCta
                loggedInHref="/paket"
                guestHref="/choose-type?redirect=/paket"
                className="block cursor-pointer"
              >
                <div className="mb-8 overflow-hidden bg-[#111] border border-[#2A2A2A] aspect-[16/10] flex items-center justify-center group-hover:border-[#EDEDED] transition-all duration-500 relative rounded-lg shadow-2xl shadow-black/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <span className="text-[11px] tracking-[0.3em] opacity-30 uppercase font-mono group-hover:opacity-100 group-hover:text-white transition-all duration-500">
                    Nest Paket / System Live
                  </span>
                </div>
                
                <h3 className="text-3xl font-light mb-3 flex items-center gap-4 text-white">
                  NEST Paket
                  <span className="text-[10px] tracking-[0.2em] font-mono font-bold bg-[#EDEDED] text-[#0A0A0A] px-2.5 py-1 rounded">AKTIF</span>
                </h3>
                <p className="text-lg text-[#888] font-light leading-relaxed max-w-2xl">
                  Tanda Terima Digital untuk paket dan logistik. Verifikasi lokasi <span className="text-white">real-time</span>.
                </p>
              </AuthAwarePaketCta>
            </div>

            <div className="md:col-span-5 space-y-16 pt-4">
              <div className="opacity-40 border-l-2 border-[#1A1A1A] pl-8 py-2">
                <h3 className="text-2xl font-light mb-2 text-white italic">NEST Factory</h3>
                <p className="text-base text-[#888] font-light">Sistem pemantauan lini produksi.</p>
              </div>
              <div className="opacity-40 border-l-2 border-[#1A1A1A] pl-8 py-2">
                <h3 className="text-2xl font-light mb-2 text-white italic">NEST School</h3>
                <p className="text-base text-[#888] font-light">Administrasi institusi pendidikan.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-36 flex flex-col md:flex-row justify-between items-center gap-10 border-t border-[#1A1A1A] pt-16 text-[#666]">
          <div className="text-[11px] tracking-[0.3em] uppercase font-mono text-center md:text-left">
            © 2026 NEST76 STUDIO · Born in '76, Built for the Future.
          </div>
          <div className="flex gap-10 text-[11px] tracking-[0.3em] uppercase font-mono hover:text-white transition-colors cursor-pointer">
            Instagram · Github · Hubungi Kami
          </div>
        </footer>
      </div>
    </main>
  )
}