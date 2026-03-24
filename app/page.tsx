import Link from "next/link"
import type { Metadata } from "next"
import { AuthAwarePaketCta } from "@/components/auth-aware-paket-cta"

export const metadata: Metadata = {
  title: "NEST76 | Studio Sistem Digital",
  description: "Membangun infrastruktur digital yang presisi. Kami menyederhanakan alur kerja yang rumit menjadi sistem yang reliabel.",
}

export default function Home() {
  return (
    <main className="bg-[#0A0A0A] text-[#EDEDED] min-h-screen selection:bg-[#EDEDED] selection:text-[#0A0A0A] font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(30,30,30,1)_0%,rgba(10,10,10,1)_70%)]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20 md:py-32 relative z-10">
        <header className="mb-28 md:mb-36">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-2 w-2 rounded-full bg-[#333] animate-pulse" />
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-30 font-mono text-white">
              Systems Online / Jakarta, ID
            </div>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-light tracking-tighter leading-none mb-10 text-white">
            NEST<span className="text-[#222]">76</span>
          </h1>

          <p className="text-xl md:text-2xl font-light text-[#888] max-w-2xl leading-relaxed">
            Membangun <strong className="text-white font-normal">infrastruktur digital</strong> yang presisi. Kami menyederhanakan alur kerja yang rumit menjadi sistem yang reliabel.
          </p>

          <div className="mt-12">
            <AuthAwarePaketCta
              loggedInHref="/paket"
              guestHref="/choose-type?redirect=/paket"
              className="inline-flex items-center justify-center px-12 py-5 bg-[#EDEDED] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.3em] rounded-sm hover:bg-white transition-all duration-300 shadow-xl shadow-black/20"
            >
              Kirim
            </AuthAwarePaketCta>
          </div>
        </header>

        {/* SOLUTIONS SECTION */}
        <section className="mb-40">
           <div className="flex items-center gap-5 mb-16 opacity-20">
            <h2 className="text-xs uppercase tracking-[0.5em] font-mono text-white">Product 01</h2>
            <div className="h-[1px] w-full bg-white" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="group">
              <h3 className="text-3xl font-light mb-6 text-white group-hover:italic transition-all">NEST Paket</h3>
              <p className="text-lg text-[#666] leading-relaxed mb-8 group-hover:text-[#AAA] transition-colors">
                Tanda Terima Digital dengan verifikasi lokasi <span className="text-white italic">real-time</span>. Didesain untuk efisiensi logistik tanpa kertas.
              </p>
              <div className="h-[1px] w-12 bg-white/20 group-hover:w-full group-hover:bg-white transition-all duration-700" />
            </div>
            
            <div className="aspect-video bg-[#0F0F0F] border border-white/5 rounded flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity">
               <span className="text-[10px] tracking-[0.5em] uppercase font-mono">System Live</span>
            </div>
          </div>
        </section>

        <footer className="pt-16 border-t border-white/5 text-[10px] tracking-[0.4em] uppercase opacity-20 flex justify-between">
          <div>© 2026 NEST76 STUDIO</div>
          <div className="flex gap-8">
            <span className="hover:opacity-100 cursor-pointer">Github</span>
            <span className="hover:opacity-100 cursor-pointer">Twitter</span>
          </div>
        </footer>
      </div>
    </main>
  )
}