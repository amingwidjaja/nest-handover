import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "NEST76",
  description: "A small studio building simple systems for complex work."
}

export default function Home() {
  return (

<main className="bg-[#111111] text-[#EDEDED] min-h-screen flex items-center">

<div className="w-full max-w-4xl mx-auto px-8">

{/* HERO */}

<header className="mb-14">

<div className="text-[10px] tracking-[0.35em] uppercase opacity-40 mb-5">
SYSTEMS · TOOLS · ORDER
</div>

<h1 className="text-3xl font-light leading-tight mb-4">
NEST76
</h1>

<p className="text-base opacity-70 max-w-md">
A small studio building simple systems for complex work.
</p>

</header>


{/* TOOLS */}

<section className="mb-14">

<h2 className="text-xs uppercase tracking-[0.2em] opacity-40 mb-6">
Tools
</h2>

<div className="grid grid-cols-1 md:grid-cols-3 gap-8">

<Link
href="/paket"
className="block border-b border-[#2A2A2A] pb-3 hover:border-[#EDEDED] transition-colors"
>
<h3 className="text-lg mb-1">NEST Paket</h3>
<p className="text-sm opacity-60">
Serah terima barang.
</p>
</Link>

<div className="border-b border-[#2A2A2A] pb-3 opacity-50">
<h3 className="text-lg mb-1">NEST Factory</h3>
<p className="text-sm">
Production system.
</p>
</div>

<div className="border-b border-[#2A2A2A] pb-3 opacity-50">
<h3 className="text-lg mb-1">NEST School</h3>
<p className="text-sm">
School operations system.
</p>
</div>

</div>

</section>


{/* PRINCIPLES */}

<section>

<h2 className="text-xs uppercase tracking-[0.2em] opacity-40 mb-6">
Principles
</h2>

<ul className="space-y-2 text-sm">

<li>— Systems should serve people</li>
<li>— Clarity over complexity</li>
<li>— Quiet tools enable real work</li>

</ul>

</section>


{/* FOOTER */}

<footer className="mt-14 text-[10px] uppercase tracking-[0.1em] opacity-30">
NEST76
</footer>

</div>

</main>

  )
}