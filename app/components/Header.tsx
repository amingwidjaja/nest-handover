'use client'

import Link from "next/link"
import { Home } from "lucide-react"

type Props = {
  title: string
}

export default function Header({ title }: Props){

  return(

    <header className="px-6 py-6 flex items-center justify-between shrink-0">

      <h1 className="text-xl font-medium tracking-tight text-[#3E2723]">
        {title}
      </h1>

      <Link
        href="/"
        className="opacity-60 hover:opacity-100 transition-opacity"
      >
        <Home size={18} strokeWidth={1.5}/>
      </Link>

    </header>

  )

}