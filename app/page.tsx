'use client'

import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

const EGGS = [
  {
    name: "Indomorph",
    tagline: "Reptile & Exotic Pet Marketplace",
    desc: "Marketplace khusus reptil & exotic pet pertama di Indonesia. Keeper tools, digital certificate, lelang, escrow — ekosistem lengkap untuk komunitas.",
    status: "live",
    url: "https://www.indomorph.id",
  },
  {
    name: "NEST POS",
    tagline: "Point of Sale + Accounting",
    desc: "POS kasir yang langsung nyambung ke pembukuan. Foto nota → jurnal otomatis. Cash flow real-time, laporan yang boss bisa baca dari HP.",
    status: "live",
  },
  {
    name: "NEST School",
    tagline: "School Management System",
    desc: "Data murid, SPP, absensi, nilai, gaji guru — satu sistem. Portal orang tua cek SPP dari HP. Pembukuan sekolah otomatis.",
    status: "live",
  },
  {
    name: "NEST Factory",
    tagline: "Factory Operating System",
    desc: "Sistem operasi pabrik — dari design sampai packing. Multi-node, material tracking, quality control. Setiap departemen terkoneksi real-time.",
    status: "hatching",
  },
]

const PRINCIPLES = [
  {
    title: "Built from experience",
    desc: "Setiap produk lahir dari masalah yang pernah kami hadapi sendiri di lapangan. Bukan riset pasar — tapi pengalaman 25+ tahun lintas industri.",
  },
  {
    title: "Indonesia-native",
    desc: "SAK EMKM, PB1, faktur pajak, rekonsiliasi bank lokal. Bukan software luar yang diterjemahkan.",
  },
  {
    title: "AI as workflow",
    desc: "Foto nota → jurnal. Scan KTP → data terisi. AI bukan fitur tambahan — AI adalah cara kerja utama.",
  },
  {
    title: "Connected ecosystem",
    desc: "Setiap produk bisa berdiri sendiri. Tapi saat digunakan bersama — datanya nyambung otomatis, tanpa copy-paste.",
  },
]

const STATUS_LABEL: Record<string, { label: string; style: string }> = {
  live: { label: "Live", style: "bg-stone-800 text-white" },
  hatching: { label: "Hatching", style: "bg-stone-200 text-stone-600" },
}

export default function Home() {
  return (
    <main className="min-h-screen">

      {/* ═══ PAGE 1 — Hero ═══ */}
      <section className="min-h-screen bg-[#FAFAF7] relative z-10 flex flex-col">
        <nav className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-lg font-bold text-stone-800 tracking-tight">
            NEST76
          </motion.span>
          <motion.a
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            href="https://wa.me/62811181197" target="_blank" rel="noopener noreferrer"
            className="text-sm font-medium text-stone-500 hover:text-stone-800 transition">
            Contact →
          </motion.a>
        </nav>

        <div className="flex-1 flex items-center">
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="max-w-3xl">
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-stone-800 leading-[1.05] tracking-tight mb-8">
                Where ideas
                <span className="block font-semibold text-stone-900">hatch.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-lg md:text-xl text-stone-400 leading-relaxed max-w-xl">
                Kami membangun teknologi dari pengalaman nyata di lapangan.
                Setiap produk adalah telur yang menetas dari masalah yang pernah kami hadapi sendiri.
              </motion.p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="text-center pb-10">
          <div className="inline-flex flex-col items-center gap-2 text-stone-300">
            <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
            <motion.svg
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </motion.svg>
          </div>
        </motion.div>
      </section>

      {/* ═══ PAGE 2 — The Nest ═══ */}
      <section className="bg-[#F3F2EE] relative">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="mb-14">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-[0.3em] mb-4">The Nest</h2>
            <p className="text-2xl md:text-3xl font-light text-stone-700">
              Setiap telur punya cerita.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {EGGS.map(egg => {
              const st = STATUS_LABEL[egg.status] || STATUS_LABEL.hatching
              return (
                <motion.div key={egg.name} variants={fadeUp}
                  className="group bg-white/70 backdrop-blur-sm border border-stone-200 rounded-2xl p-7 hover:bg-white hover:shadow-md hover:border-stone-300 transition-all duration-300">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3 className="text-xl font-semibold text-stone-800 mb-0.5">{egg.name}</h3>
                      <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">{egg.tagline}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${st.style}`}>
                      {st.label}
                    </span>
                  </div>

                  <p className="text-sm text-stone-500 leading-relaxed mb-5">{egg.desc}</p>

                  {egg.url && (
                    <a href={egg.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-700 hover:text-stone-900 transition group-hover:underline">
                      Kunjungi
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══ PAGE 3 — Philosophy + Story ═══ */}
      <section className="bg-[#FAFAF7]">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="mb-14">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-[0.3em] mb-4">Philosophy</h2>
            <p className="text-2xl md:text-3xl font-light text-stone-700">
              Cara kami berpikir.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
            {PRINCIPLES.map((p, i) => (
              <motion.div key={i} variants={fadeUp} className="flex gap-5">
                <div className="text-3xl font-extralight text-stone-300 shrink-0 w-10 text-right leading-none pt-1">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-stone-800 mb-2">{p.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="max-w-2xl mx-auto text-center border-t border-stone-200 pt-16">
            <p className="text-lg md:text-xl font-light text-stone-600 leading-relaxed mb-4">
              25+ tahun lintas industri — hardware, distribusi, retail, manufaktur, keuangan.
            </p>
            <p className="text-sm text-stone-400 leading-relaxed">
              Bukan dari ruang meeting atau slide deck, tapi dari lantai pabrik, meja kasir, dan gudang jam 6 pagi.
              Solusi terbaik datang dari orang yang pernah frustrasi lalu memutuskan:
              <span className="text-stone-600 font-medium italic"> &ldquo;ini harus lebih baik.&rdquo;</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ PAGE 4 — CTA + Footer ═══ */}
      <section className="bg-stone-800">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="max-w-6xl mx-auto px-6 py-20 md:py-24 text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
            Punya masalah bisnis yang belum ada solusinya?
          </h2>
          <p className="text-stone-400 text-sm mb-8 max-w-md mx-auto">
            Kami senang bicara tentang masalah nyata.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/62811181197" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 bg-white text-stone-800 text-sm font-semibold rounded-full hover:bg-stone-100 transition">
              WhatsApp
            </a>
            <a href="mailto:ming@nest76.com"
              className="inline-flex items-center gap-2 px-7 py-3 border border-stone-600 text-stone-400 text-sm font-medium rounded-full hover:border-stone-400 hover:text-white transition">
              ming@nest76.com
            </a>
          </div>
        </motion.div>

        <div className="border-t border-stone-700">
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left flex items-center gap-4">
              <img src="/logo-tdk-white.png" alt="TDK" className="h-8 opacity-60" />
              <div>
                <p className="text-xs font-semibold text-stone-400 tracking-wide">PT Technology Digital Kreasi</p>
                <p className="text-[11px] text-stone-500 mt-0.5">&copy; 2026 NEST76 &middot; Jakarta, Indonesia</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-stone-500">
              <a href="https://www.indomorph.id" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Indomorph</a>
              <a href="mailto:ming@nest76.com" className="hover:text-white transition">Email</a>
              <a href="https://wa.me/62811181197" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">WhatsApp</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
