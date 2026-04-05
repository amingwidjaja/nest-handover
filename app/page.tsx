import type { Metadata } from "next"
import { AuthAwarePaketCta } from "@/components/auth-aware-paket-cta"

export const metadata: Metadata = {
  title: "NEST76 | Smart Manufacturing & Retail OS",
  description:
    "Sistem operasional bisnis real-time — Factory OS, AI Accounting, POS, School Management. Integrasi AI Gemini & Claude.",
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
    name: "NEST Paket",
    tagline: "Serah Terima Digital",
    desc: "Tanda terima digital dengan verifikasi GPS real-time. Bukti kirim jelas, tanpa kertas. 100% GRATIS.",
    href: "https://paket.nest76.com",
    badge: "AKTIF",
    badgeColor: "bg-[#EDEDED] text-[#0A0A0A]",
    features: ["GPS Lock", "WhatsApp Notifikasi", "PDF Otomatis"],
  },
  {
    name: "NEST Factory",
    tagline: "Factory Operating System",
    desc: "Sistem operasi pabrik garmen. Design loop, sample tracking, film maker, pattern — semua node terkoneksi.",
    href: "https://pabrik.nest76.com",
    badge: "AKTIF",
    badgeColor: "bg-[#EDEDED] text-[#0A0A0A]",
    features: ["Multi-Node", "Cross-Org", "Queue System"],
  },
  {
    name: "NEST Accounting",
    tagline: "AI-Powered Accounting",
    desc: "Foto nota, AI buat jurnal. Hutang, piutang, aset, cash flow — semua otomatis. Boss tinggal baca laporan.",
    href: "https://akunting.nest76.com",
    badge: "AKTIF",
    badgeColor: "bg-[#EDEDED] text-[#0A0A0A]",
    features: ["Photo AI", "Cash Flow AI", "Rekonsiliasi Bank"],
  },
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
              3 Systems Online / Jakarta, ID
            </div>
          </div>

          <p className="text-[10px] tracking-[0.35em] uppercase opacity-50 font-mono mb-6 text-white">
            NEST<span className="text-[#555]">76</span> STUDIO
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-tighter leading-[1.05] mb-10 text-white max-w-4xl">
            Operating System untuk Bisnis Indonesia.
          </h1>

          <p className="text-xl md:text-2xl font-light text-[#A0A0A0] max-w-2xl leading-relaxed">
            Serah terima, pabrik, akuntansi — <span className="text-white">3 produk, 1 ekosistem, 0 kertas.</span>
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <AuthAwarePaketCta
              loggedInHref="/paket"
              guestHref="/login"
              loggedInLabel="MASUK NEST PAKET"
              guestLabel="Coba NEST Paket — Gratis"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#EDEDED] text-[#0A0A0A] text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-white transition-colors"
            />
            <a href="mailto:ming@nest76.com"
              className="inline-flex items-center justify-center px-8 py-4 border border-[#333] text-[#888] text-xs font-bold uppercase tracking-widest rounded-sm hover:border-[#EDEDED] hover:text-white transition-colors">
              Hubungi Kami
            </a>
          </div>
        </header>

        {/* PRODUCTS — 3 Column Grid */}
        <section className="mb-32 md:mb-40">
          <div className="flex items-center gap-5 mb-16">
            <h2 className="text-xs uppercase tracking-[0.4em] opacity-40 whitespace-nowrap font-mono text-white">Ekosistem</h2>
            <div className="h-[1px] w-full bg-[#1A1A1A]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRODUCTS.map((product) => (
              <a
                key={product.name}
                href={product.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-[#111] border border-[#1A1A1A] rounded-xl p-8 hover:border-[#EDEDED] transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-xl font-light text-white">{product.name}</h3>
                    <span className={`text-[9px] tracking-[0.15em] font-mono font-bold px-2 py-0.5 rounded ${product.badgeColor}`}>
                      {product.badge}
                    </span>
                  </div>

                  <p className="text-[11px] tracking-[0.2em] uppercase text-[#555] font-mono mb-4">
                    {product.tagline}
                  </p>

                  <p className="text-[15px] text-[#888] font-light leading-relaxed mb-6">
                    {product.desc}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {product.features.map((f) => (
                      <span key={f} className="text-[10px] font-mono text-[#555] border border-[#2A2A2A] px-2 py-1 rounded group-hover:border-[#555] group-hover:text-[#888] transition-colors">
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="h-[2px] w-12 bg-[#2A2A2A] group-hover:w-full group-hover:bg-[#EDEDED] transition-all duration-500 rounded" />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* PHILOSOPHY */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 py-24 border-t border-[#1A1A1A]">
          <div>
            <h2 className="text-xs uppercase tracking-[0.4em] opacity-40 mb-5 font-mono text-white">Filosofi</h2>
            <p className="text-xl text-[#A0A0A0] font-light max-w-md leading-relaxed">
              NEST76 lahir dari perjalanan panjang sejak 1976. Kami membangun alat yang membantu manusia bekerja, bukan menambah beban mereka.
            </p>
          </div>

          <div className="space-y-12 font-light text-lg text-[#888]">
            <div className="flex gap-6 items-start group">
              <span className="text-2xl font-mono text-[#333] group-hover:text-white transition-colors">01</span>
              <p className="leading-relaxed">
                <strong className="text-white font-normal">Daging, Bukan Lemak.</strong> Setiap fitur ada karena dibutuhkan, bukan karena &ldquo;software lain punya&rdquo;.
              </p>
            </div>
            <div className="flex gap-6 items-start group">
              <span className="text-2xl font-mono text-[#333] group-hover:text-white transition-colors">02</span>
              <p className="leading-relaxed">
                <strong className="text-white font-normal">AI Kerja, Manusia Konfirmasi.</strong> Sistem yang paham konteks Indonesia — dari nota warung sampai invoice pabrik.
              </p>
            </div>
            <div className="flex gap-6 items-start group">
              <span className="text-2xl font-mono text-[#333] group-hover:text-white transition-colors">03</span>
              <p className="leading-relaxed">
                <strong className="text-white font-normal">User Nggak Kerja untuk Sistem.</strong> Tukang jahit scan bundle untuk hitung gajinya sendiri — sistem dapat bonus data produksi.
              </p>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="py-24 border-t border-[#1A1A1A] text-center">
          <h2 className="text-xs uppercase tracking-[0.4em] opacity-40 mb-8 font-mono text-white">Kontak</h2>
          <p className="text-2xl md:text-3xl font-extralight text-white mb-4">Tertarik? Mari ngobrol.</p>
          <p className="text-lg text-[#888] font-light mb-8">Kami senang diskusi tentang bagaimana teknologi bisa bantu bisnis Anda.</p>
          <a href="mailto:ming@nest76.com"
            className="inline-flex items-center justify-center px-10 py-4 bg-[#EDEDED] text-[#0A0A0A] text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-white transition-colors">
            ming@nest76.com
          </a>
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
