import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "NEST76",
  description: "A small studio building simple systems for complex work."
}

export default function Home() {
  return (

<main className="bg-[#FAF9F6] text-[#3E2723] min-h-screen p-8 md:p-16 max-w-4xl mx-auto font-sans">

  {/* HERO */}

  <header className="py-24">

    <div className="text-[10px] tracking-[0.35em] uppercase opacity-40 mb-6">
      SYSTEMS · TOOLS · ORDER
    </div>

    <div className="text-xs tracking-[0.2em] uppercase opacity-60 mb-4">
      NEST76
    </div>

    <h1 className="text-3xl font-light leading-tight">
      A small studio building<br/>
      simple systems<br/>
      for complex work.
    </h1>

  </header>


  {/* TOOLS */}

  <section className="py-12 border-t border-[#E0DED7]">

    <h2 className="text-xs uppercase tracking-[0.2em] mb-12 opacity-40">
      Tools
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

      <Link
        href="/paket"
        className="group block py-6 border-b border-[#E0DED7] hover:border-[#3E2723] transition-colors"
      >
        <h3 className="text-lg font-medium mb-2">NEST Paket</h3>
        <p className="text-sm opacity-60">
          Serah terima barang.
        </p>
      </Link>

      <div className="block py-6 border-b border-[#E0DED7] opacity-50">
        <h3 className="text-lg font-medium mb-2">NEST Factory</h3>
        <p className="text-sm">
          Production system.
        </p>
      </div>

      <div className="block py-6 border-b border-[#E0DED7] opacity-50">
        <h3 className="text-lg font-medium mb-2">NEST School</h3>
        <p className="text-sm">
          School operations system.
        </p>
      </div>

    </div>

  </section>


  {/* PHILOSOPHY */}

  <section className="py-24 grid md:grid-cols-2 gap-16">

    <div>

      <h2 className="text-xs uppercase tracking-[0.2em] mb-8 opacity-40">
        Philosophy
      </h2>

      <p className="text-lg leading-relaxed font-light">

        For many years I have been observing how work happens.

        Most chaos does not come from people,
        but from the absence of good systems.

        Systems should serve people,
        not the other way around.

        NEST is my attempt to build
        small, calm systems
        that help work flow better.

        76 marks the year I was born.

        Nest represents the digital twin
        of the systems I want to see in the world.

      </p>

    </div>


    {/* PRINCIPLES */}

    <div>

      <h2 className="text-xs uppercase tracking-[0.2em] mb-8 opacity-40">
        Principles
      </h2>

      <ul className="space-y-4 text-sm font-medium">

        <li>— Systems should serve people</li>

        <li>— Clarity over complexity</li>

        <li>— Quiet tools enable real work</li>

      </ul>

    </div>

  </section>


  {/* FOOTER */}

  <footer className="pt-24 pb-8 text-[10px] uppercase tracking-[0.1em] opacity-40">
    NEST76
  </footer>

</main>

  )
}