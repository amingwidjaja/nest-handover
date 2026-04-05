import type { Metadata } from "next"
import { AuthAwarePaketCta } from "@/components/auth-aware-paket-cta"

export const metadata: Metadata = {
  title: "NEST76 | Smart Manufacturing & Retail OS",
  description: "Sistem operasional bisnis real-time — Factory OS, AI Accounting, POS, School Management. Integrasi AI Gemini & Claude.",
  keywords: "ERP Indonesia, Factory OS, AI Accounting, POS system, School Management, Garment ERP, UMKM software",
  openGraph: {
    title: "NEST76 — Smart Manufacturing & Retail OS",
    description: "Sistem operasional bisnis real-time dengan integrasi Akunting dan AI. Pabrik, Toko, Sekolah — semua terkoneksi.",
    url: "https://nest76.com",
    siteName: "NEST76 Studio",
    images: [{ url: "/og-image-nest76.jpg", width: 1200, height: 630 }],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEST76 — Smart Manufacturing & Retail OS",
    description: "Sistem operasional bisnis real-time dengan integrasi AI.",
    images: ["/og-image-nest76.jpg"],
  },
}

const PRODUCTS = [
  {
    name: "NEST Factory",
    tagline: "Factory Operating System",
    desc: "Sistem operasi pabrik — dari design sampai packing. Setiap departemen punya node sendiri, semua terkoneksi real-time. Material tracking dari gudang sampai produk jadi.",
    badge: "AKTIF",
    features: ["Multi-Node", "Material Tracking", "Cross-Org", "Queue System", "Sample Management"],
    icon: "🏭",
  },
  {
    name: "NEST Accounting",
    tagline: "AI-Powered Accounting + POS",
    desc: "Foto nota, AI buat jurnal. POS kasir yang auto-masuk ke pembukuan. Hutang, piutang, aset, cash flow — boss baca laporan, AI yang kerjain sisanya.",
    badge: "AKTIF",
    features: ["Photo AI", "POS Kasir", "Cash Flow AI", "Rekonsiliasi Bank", "Budget Control"],
    icon: "💰",
  },
  {
    name: "NEST School",
    tagline: "School Management System",
    desc: "Dari data murid sampai SPP, absensi, nilai, gaji guru — semua dalam satu sistem. Portal orang tua bisa cek SPP lewat HP. Pembukuan sekolah otomatis.",
    badge: "AKTIF",
    features: ["SPP Tracking", "Absensi", "HRD Gaji", "Portal Ortu", "Connected Accounting"],
    icon: "🎓",
  },
]

const PROBLEMS = [
  { icon: "📋", title: "Data di mana-mana", desc: "Excel, buku tulis, WhatsApp, kertas — setiap orang punya versi berbeda." },
  { icon: "⏰", title: "Laporan telat", desc: "Boss minta laporan, staff perlu 3 hari compile dari berbagai sumber." },
  { icon: "💸", title: "Uang bocor", desc: "Nggak tau HPP per produk, nggak tau margin per customer, nggak tau siapa yang nunggak." },
  { icon: "😰", title: "Software ribet", desc: "ERP mahal, setup berbulan-bulan, training berhari-hari, menu dropdown ratusan — akhirnya balik ke Excel." },
]

const WHYNEST = [
  {
    num: "01", title: "AI-First, Bukan Afterthought",
    desc: "Foto nota → jurnal otomatis. Scan KTP → data terisi. Upload bank statement → rekonsiliasi otomatis. AI bukan fitur tambahan — AI adalah cara kerja utama.",
  },
  {
    num: "02", title: "5 Menit Setup, Bukan 5 Bulan",
    desc: "Daftar hari ini, jalan besok. Nggak perlu konsultan, nggak perlu training seminggu. Kalau bisa pakai WhatsApp, bisa pakai NEST.",
  },
  {
    num: "03", title: "Indonesia-Native",
    desc: "SAK EMKM, PB1, SPP, NIS, BPJS — semua pakai standar dan istilah Indonesia. Bukan software luar yang diterjemahkan.",
  },
  {
    num: "04", title: "Connected Ecosystem",
    desc: "POS jual roti → jurnal accounting otomatis → laporan laba rugi update. Pabrik kirim barang → gudang update → HPP terhitung. Semua nyambung, tanpa copy-paste.",
  },
  {
    num: "05", title: "Boss Tau Semua dari HP",
    desc: "Real-time dashboard. Nggak perlu minta report ke staff. Buka HP, tau omzet hari ini, siapa yang nunggak, stok apa yang menipis.",
  },
]

const SECURITY = [
  { icon: "🔒", title: "Data Terpisah 100%", desc: "Setiap client punya database terpisah. Data Anda tidak pernah tercampur dengan client lain." },
  { icon: "🛡️", title: "Row Level Security", desc: "Setiap user hanya bisa akses data yang relevan. Guru lihat kelasnya sendiri, kasir lihat transaksinya sendiri." },
  { icon: "☁️", title: "Cloud Backup", desc: "Data di-backup otomatis setiap hari. Laptop rusak? HP hilang? Data aman di cloud." },
  { icon: "🔐", title: "Enkripsi", desc: "Semua data terenkripsi saat transit dan saat disimpan. Standar keamanan setara perbankan." },
]

export default function Home() {
  return (
    <main className="bg-[#0A0A0A] text-[#EDEDED] min-h-screen selection:bg-[#EDEDED] selection:text-[#0A0A0A] font-sans relative overflow-hidden">

      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(30,30,30,1)_0%,rgba(10,10,10,1)_70%)]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20 md:py-32 relative z-10">

        {/* HERO */}
        <header className="mb-28 md:mb-36">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 font-mono">
              4 Systems Online / Jakarta, ID
            </div>
          </div>

          <img src="/logo-nest76.png" alt="NEST76" className="h-16 mb-6 object-contain" style={{ mixBlendMode: 'lighten' }} />

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-tighter leading-[1.05] mb-10 text-white max-w-4xl">
            Sistem yang kerja untuk kamu, bukan sebaliknya.
          </h1>

          <p className="text-xl md:text-2xl font-light text-[#A0A0A0] max-w-2xl leading-relaxed">
            Pabrik, toko, sekolah — <span className="text-white">1 ekosistem, AI-powered, siap hari ini.</span>
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a href="mailto:ming@nest76.com"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#EDEDED] text-[#0A0A0A] text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-white transition-colors">
              Minta Demo Gratis
            </a>
            <a href="#produk"
              className="inline-flex items-center justify-center px-8 py-4 border border-[#333] text-[#888] text-xs font-bold uppercase tracking-widest rounded-sm hover:border-[#EDEDED] hover:text-white transition-colors">
              Lihat Produk
            </a>
          </div>
        </header>

        {/* MASALAH */}
        <section className="mb-32 md:mb-40">
          <div className="flex items-center gap-5 mb-16">
            <h2 className="text-xs uppercase tracking-[0.4em] opacity-40 whitespace-nowrap font-mono text-white">Masalah</h2>
            <div className="h-[1px] w-full bg-[#1A1A1A]" />
          </div>

          <p className="text-2xl md:text-3xl font-extralight text-white mb-12 max-w-3xl">
            Bisnis kamu masih begini?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROBLEMS.map(p => (
              <div key={p.title} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6">
                <span className="text-2xl mb-3 block">{p.icon}</span>
                <h3 className="text-lg font-light text-white mb-2">{p.title}</h3>
                <p className="text-[15px] text-[#888] font-light leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRODUK */}
        <section id="produk" className="mb-32 md:mb-40">
          <div className="flex items-center gap-5 mb-16">
            <h2 className="text-xs uppercase tracking-[0.4em] opacity-40 whitespace-nowrap font-mono text-white">Solusi</h2>
            <div className="h-[1px] w-full bg-[#1A1A1A]" />
          </div>

          <p className="text-2xl md:text-3xl font-extralight text-white mb-4 max-w-3xl">
            Satu ekosistem untuk semua kebutuhan bisnis.
          </p>
          <p className="text-lg text-[#666] font-light mb-12 max-w-2xl">
            Setiap produk bisa berdiri sendiri, tapi saat digunakan bersama — datanya nyambung otomatis.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRODUCTS.map(product => (
              <div key={product.name}
                className="group bg-[#111] border border-[#1A1A1A] rounded-xl p-8 hover:border-[#EDEDED] transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <span className="text-3xl mb-4 block">{product.icon}</span>

                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-light text-white">{product.name}</h3>
                    <span className="text-[9px] tracking-[0.15em] font-mono font-bold bg-[#EDEDED] text-[#0A0A0A] px-2 py-0.5 rounded">
                      {product.badge}
                    </span>
                  </div>

                  <p className="text-[11px] tracking-[0.2em] uppercase text-[#555] font-mono mb-4">
                    {product.tagline}
                  </p>

                  <p className="text-[15px] text-[#888] font-light leading-relaxed mb-6">
                    {product.desc}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {product.features.map(f => (
                      <span key={f} className="text-[10px] font-mono text-[#555] border border-[#2A2A2A] px-2 py-1 rounded group-hover:border-[#555] group-hover:text-[#888] transition-colors">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* KENAPA NEST76 */}
        <section className="mb-32 md:mb-40 py-24 border-t border-[#1A1A1A]">
          <div className="flex items-center gap-5 mb-16">
            <h2 className="text-xs uppercase tracking-[0.4em] opacity-40 whitespace-nowrap font-mono text-white">Kenapa NEST76</h2>
            <div className="h-[1px] w-full bg-[#1A1A1A]" />
          </div>

          <p className="text-2xl md:text-3xl font-extralight text-white mb-12 max-w-3xl">
            Bukan ERP biasa. Bukan software luar yang diterjemahkan.
          </p>

          <div className="space-y-10">
            {WHYNEST.map(w => (
              <div key={w.num} className="flex gap-6 items-start group">
                <span className="text-2xl font-mono text-[#333] group-hover:text-white transition-colors shrink-0">{w.num}</span>
                <div>
                  <h3 className="text-lg font-light text-white mb-2">{w.title}</h3>
                  <p className="text-[15px] text-[#888] font-light leading-relaxed max-w-2xl">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECURITY */}
        <section className="mb-32 md:mb-40 py-24 border-t border-[#1A1A1A]">
          <div className="flex items-center gap-5 mb-16">
            <h2 className="text-xs uppercase tracking-[0.4em] opacity-40 whitespace-nowrap font-mono text-white">Keamanan Data</h2>
            <div className="h-[1px] w-full bg-[#1A1A1A]" />
          </div>

          <p className="text-2xl md:text-3xl font-extralight text-white mb-12 max-w-3xl">
            Data bisnis Anda adalah amanah kami.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SECURITY.map(s => (
              <div key={s.title} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6">
                <span className="text-2xl mb-3 block">{s.icon}</span>
                <h3 className="text-lg font-light text-white mb-2">{s.title}</h3>
                <p className="text-[15px] text-[#888] font-light leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 border-t border-[#1A1A1A] text-center">
          <p className="text-3xl md:text-4xl font-extralight text-white mb-4">Siap mencoba?</p>
          <p className="text-lg text-[#888] font-light mb-8 max-w-lg mx-auto">
            Demo gratis, tanpa komitmen. Kami tunjukkan bagaimana NEST76 bisa bantu bisnis Anda dalam 30 menit.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:ming@nest76.com"
              className="inline-flex items-center justify-center px-10 py-4 bg-[#EDEDED] text-[#0A0A0A] text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-white transition-colors">
              Minta Demo Gratis
            </a>
            <a href="https://wa.me/62811181197"
              className="inline-flex items-center justify-center px-10 py-4 border border-[#333] text-[#888] text-xs font-bold uppercase tracking-widest rounded-sm hover:border-[#EDEDED] hover:text-white transition-colors">
              WhatsApp
            </a>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-16 flex flex-col md:flex-row justify-between items-center gap-10 border-t border-[#1A1A1A] pt-16 text-[#666]">
          <div className="text-[11px] tracking-[0.3em] uppercase font-mono text-center md:text-left">
            &copy; 2026 NEST76 STUDIO &middot; Born in &apos;76, Built for the Future.
          </div>
          <div className="flex gap-10 text-[11px] tracking-[0.3em] uppercase font-mono">
            <a href="mailto:ming@nest76.com" className="hover:text-white transition-colors">Email</a>
            <a href="https://github.com/amingwidjaja" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Github</a>
          </div>
        </footer>
      </div>
    </main>
  )
}
