"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

/** Matches root --primary-color for consistency (no #) */
const PRIMARY_QR_HEX = "3E2723"

export default function HomePage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulasi loading sebentar biar kerasa premium
    setTimeout(() => setLoading(false), 800)
  }, [])

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-[#FAF9F6]"
        style={{ ["--primary-color" as string]: "#3E2723" }}
      >
        <div className="text-center space-y-2">
          <p className="text-sm text-[#9A8F88] animate-pulse italic">Menyiapkan Home Page NEST76...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-[#FAF9F6] selection:bg-[#3E2723]/10" 
      style={{ "--primary-color": "#3E2723" } as any}
    >
      <main className="max-w-7xl mx-auto w-full p-8 md:p-16 lg:p-20 space-y-32 text-[var(--primary-color)] font-sans">
        
        {/* --- 1. Status Line (Sesuai Vibes NEST76) --- */}
        <div className="flex justify-end text-[10px] font-black uppercase tracking-[0.2em] text-[#9A8F88]">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>SYSTEMS ONLINE / JAKARTA, ID</span>
          </span>
        </div>

        {/* --- 2. HERO SECTION --- */}
        <section className="space-y-6">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
            NEST<span className="opacity-20">76</span>
          </h1>
          <p className="text-2xl md:text-3xl max-w-4xl leading-tight font-medium">
            Membangun <span className="font-bold underline underline-offset-4 decoration-[var(--primary-color)]/20">infrastruktur digital</span> yang presisi. Kami menyederhanakan alur kerja yang rumit menjadi sistem yang reliabel.
          </p>
        </section>

        {/* --- Divider Tipis --- */}
        <div className="h-px bg-gradient-to-r from-[#3E2723]/20 via-[#3E2723]/5 to-transparent" />

        {/* --- 3. DIGITAL SOLUTIONS Section --- */}
        <section className="space-y-16">
          <div className="space-y-1">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#9A8F88]">Solusi Digital</h2>
            <div className="border-b-2 border-[var(--primary-color)] w-12 rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Left Side: Solution Placeholder/Highlight */}
            <div className="space-y-10">
               {/* Placeholder Box */}
              <div className="aspect-[16/10] bg-[#3E2723] rounded-3xl flex items-center justify-center p-6 text-center border-4 border-white shadow-xl shadow-[#3E2723]/10">
                <span className="text-xs uppercase tracking-[0.2em] font-black text-white">NEST HUB / PLATFORM LIVE</span>
              </div>

              {/* Solusi Utama Highlight */}
              <div className="space-y-3 p-8 bg-[#3E2723]/5 border border-[#3E2723]/5 rounded-2xl relative overflow-hidden shadow-inner">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#3E2723]/5 rounded-full -mr-16 -mt-16" />
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold uppercase tracking-tight">Authorized Provider</h3>
                  <span className="px-3 py-1 bg-[#3E2723]/10 text-[var(--primary-color)] text-[10px] uppercase font-bold rounded-full tracking-wider">Aktif</span>
                </div>
                <p className="text-sm leading-relaxed font-medium">
                  Manajemen sistem perusahaan terpadu dengan validasi data real-time,Geo-tagging, dan infrastruktur aman.
                </p>
              </div>
            </div>

            {/* Right Side: Solution List (Sleek & Clean) */}
            <div className="space-y-16">
              {/* Solution 1 */}
              <div className="space-y-2 group">
                <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-[var(--primary-color)]/80 transition-colors">NEST Factory</h3>
                <p className="text-sm leading-relaxed opacity-80 font-medium">
                  Sistem pemantauan lini produksi dan sinkronisasi stok untuk efisiensi manufaktur kelas industri.
                </p>
                <div className="border-b border-[#3E2723]/5 pt-4"></div>
              </div>
              {/* Solution 2 */}
              <div className="space-y-2 group">
                <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-[var(--primary-color)]/80 transition-colors">NEST School</h3>
                <p className="text-sm leading-relaxed opacity-80 font-medium">
                  Kerangka kerja operasional institusi pendidikan. Mengelola administrasi tanpa repot dan sinkronisasi data siswa.
                </p>
                <div className="border-b border-[#3E2723]/5 pt-4"></div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Divider Tipis --- */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#3E2723]/5 to-[#3E2723]/20" />

        {/* --- 4. PHILOSOPHY Section --- */}
        <section className="space-y-16">
          <div className="space-y-1">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#9A8F88]">Filosofi</h2>
            <div className="border-b-2 border-[var(--primary-color)] w-12 rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Left Side: Statement */}
            <div className="p-8 bg-white border border-[#3E2723]/5 rounded-2xl shadow-xl shadow-[#3E2723]/5">
              <p className="text-base leading-relaxed font-bold">
                NEST76 adalah muara dari perjalanan panjang personal sejak 1976. Kami membangun alat yang membantu manusia, bukan menggantikannya.
              </p>
            </div>

            {/* Right Side: Numbered List (Vibes Home Page) */}
            <div className="space-y-12">
              {/* Item 1 */}
              <div className="flex gap-6 group">
                <span className="text-3xl font-black text-[#9A8F88] opacity-30 tracking-tight group-hover:opacity-100 transition-opacity">01</span>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold uppercase tracking-tight">UI Sederhana, Engine Canggih</h3>
                  <p className="text-sm leading-relaxed font-medium opacity-80">
                    Didesain agar orang paling "gaptek" pun bisa mengoperasikannya dalam hitungan menit tanpa pelatihan rumit.
                  </p>
                </div>
              </div>
               {/* Item 2 */}
              <div className="flex gap-6 group">
                <span className="text-3xl font-black text-[#9A8F88] opacity-30 tracking-tight group-hover:opacity-100 transition-opacity">02</span>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold uppercase tracking-tight">Fokus pada Kejelasan</h3>
                  <p className="text-sm leading-relaxed font-medium opacity-80">
                    Menghilangkan kebisingan fitur yang tidak perlu agar Anda bisa fokus bekerja dan mengambil keputusan tepat.
                  </p>
                </div>
              </div>
               {/* Item 3 */}
              <div className="flex gap-6 group">
                <span className="text-3xl font-black text-[#9A8F88] opacity-30 tracking-tight group-hover:opacity-100 transition-opacity">03</span>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold uppercase tracking-tight">Integritas Data</h3>
                  <p className="text-sm leading-relaxed font-medium opacity-80">
                    Setiap koordinat, detik, dan input data adalah amanah yang kami jaga keakuratannya melalui enkripsi berlapis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* --- Footer (Clean & Sesuai Vibes Home Page) --- */}
      <footer className="border-t border-[#3E2723]/5 mt-20 bg-white">
        <div className="max-w-7xl mx-auto p-10 md:p-16 lg:px-20 py-12 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase font-bold tracking-[0.2em] text-[#9A8F88]">
          <span className="text-center md:text-left leading-relaxed">
            © 2026 NEST76 STUDIO • BORN IN '76, BUILT FOR THE FUTURE.
          </span>
          <div className="flex gap-3 items-center flex-wrap justify-center">
            <a href="#" className="hover:text-[var(--primary-color)] transition-colors">Instagram</a>
            <span>•</span>
            <a href="#" className="hover:text-[var(--primary-color)] transition-colors">Github</a>
            <span>•</span>
            <a href="#" className="hover:text-[var(--primary-color)] transition-colors border-b border-[#3E2723]/20 pb-0.5">Hubungi Kami</a>
          </div>
        </div>
      </footer>
    </div>
  )
}