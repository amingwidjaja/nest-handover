import Link from "next/link"
import type { Metadata } from "next"
import { AuthAwarePaketCta } from "@/components/auth-aware-paket-cta"

export const metadata: Metadata = {
  title: "NEST76 | Studio Sistem Digital",
  description: "Membangun infrastruktur digital yang presisi.",
}

export default function Home() {
  return (
    <main className="bg-[#0A0A0A] text-[#EDEDED] min-h-screen selection:bg-[#EDEDED] selection:text-[#0A0A0A] font-sans relative overflow-hidden">
      
      {/* BACKGROUND GRADIENT */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(30,30,30,1)_0%,rgba(10,10,10,1)_70%)]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20 md:py-32 relative z-10">
        
        {/* HEADER SECTION - EXACTLY LIKE SCREENSHOT */}
        <header className="mb-32">
          <div className="flex items-center gap-2 mb-12">
            <div className="h-1.5 w-1.5 rounded-full bg-[#40C057] shadow-[0_0_10px_rgba(64,192,87,0.5)]" />
            <div className="text-[10px] tracking-[0.5em] uppercase opacity-40 font-mono">
              Systems Online / Jakarta, ID
            </div>
          </div>
          
          <h1 className="text-7xl md:text-[120px] font-light tracking-[-0.08em] leading-none mb-12 flex items-baseline">
            NEST<span className="text-[#1A1A1A] ml-1">76</span>
          </h1>

          <p className="text-xl md:text-[28px] font-extralight text-[#888] max-w-2xl leading-[1.4] tracking-tight">
            Membangun <strong className="text-white font-light underline underline-offset-8 decoration-white/10">infrastruktur digital</strong> yang presisi. Kami menyederhanakan alur kerja yang rumit menjadi sistem yang reliabel.
          </p>
        </header>

        {/* SOLUSI DIGITAL SECTION */}
        <section className="mb-48">
          <div className="text-[10px] tracking-[0.5em] uppercase opacity-20 mb-16 font-mono">Solusi Digital</div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            {/* BIG CARD LEFT */}
            <div className="md:col-span-7 group">
              <AuthAwarePaketCta
                loggedInHref="/paket"
                guestHref="/choose-type?redirect=/paket"
                className="block cursor-pointer"
              >
                <div className="aspect-[16/10] bg-[#0F0F0F] border border-white/5 rounded-sm flex items-center justify-center relative transition-all duration-700 group-hover:border-white/20 shadow-2xl">
                   <div className="text-[10px] tracking-[0.5em] uppercase opacity-20 group-hover:opacity-100 transition-opacity font-mono">Nest Paket / System Live</div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-2xl font-light flex items-center gap-3">
                    NEST Paket
                    <span className="text-[9px] tracking-widest font-bold bg-white text-black px-1.5 py-0.5 rounded-sm">AKTIF</span>
                  </h3>
                  <p className="mt-4 text-[#666] font-extralight leading-relaxed max-w-md">
                    Manajemen serah terima paket dan logistik. Verifikasi lokasi <span className="text-white italic">real-time</span> dengan antarmuka yang ramah untuk siapa saja.
                  </p>
                </div>
              </AuthAwarePaketCta>
            </div>

            {/* LIST RIGHT */}
            <div className="md:col-span-5 space-y-20 pt-4">
              <div className="opacity-30">
                <h4 className="text-xl font-light mb-2 italic">NEST Factory</h4>
                <p className="text-sm text-[#888] font-extralight leading-relaxed">Sistem pemantauan lini produksi dan sinkronisasi stok untuk efisiensi manufaktur.</p>
              </div>
              <div className="opacity-30">
                <h4 className="text-xl font-light mb-2 italic">NEST School</h4>
                <p className="text-sm text-[#888] font-extralight leading-relaxed">Kerangka kerja operasional institusi pendidikan. Mengelola administrasi tanpa repot.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PHILOSOPHY SECTION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-20 py-32 border-t border-white/5">
          <div>
            <div className="text-[10px] tracking-[0.5em] uppercase opacity-20 mb-8 font-mono font-bold">Filosofi</div>
            <p className="text-lg text-[#888] font-extralight leading-relaxed max-w-sm">
              NEST76 adalah muara dari perjalanan panjang personal sejak 1976. Kami membangun alat yang membantu manusia, bukan menggantikannya.
            </p>
          </div>
          
          <div className="space-y-12">
            {[
              { id: '01', title: 'UI Sederhana, Engine Canggih.', desc: 'Didesain agar orang paling "gaptek" pun bisa mengoperasikannya dalam hitungan menit.' },
              { id: '02', title: 'Fokus pada Kejelasan.', desc: 'Menghilangkan kebisingan fitur yang tidak perlu agar Anda bisa fokus bekerja.' },
              { id: '03', title: 'Integritas Data.', desc: 'Setiap koordinat, detik, dan input data adalah amanah yang kami jaga keakuratannya.' }
            ].map((item) => (
              <div key={item.id} className="flex gap-6 items-start">
                <span className="text-xl font-mono opacity-10">{item.id}</span>
                <div>
                  <h5 className="text-white font-light mb-2">{item.title}</h5>
                  <p className="text-sm text-[#666] font-extralight leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-20 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] tracking-[0.3em] uppercase opacity-20 font-mono font-bold">
          <div>© 2026 NEST76 STUDIO · BORN IN '76, BUILT FOR THE FUTURE.</div>
          <div className="flex gap-8">
            <span className="hover:opacity-100 cursor-pointer">Instagram</span>
            <span className="hover:opacity-100 cursor-pointer">Github</span>
            <span className="hover:opacity-100 cursor-pointer">Hubungi Kami</span>
          </div>
        </footer>
      </div>
    </main>
  )
}