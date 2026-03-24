"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

type Props = {
  /** e.g. /paket */
  loggedInHref: string
  /** e.g. /choose-type?redirect=/paket */
  guestHref: string
  className?: string
  children: ReactNode
}

export function AuthAwarePaketCta({
  loggedInHref,
  guestHref,
  className,
  children
}: Props) {
  const [href, setHref] = useState(guestHref)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!cancelled) {
        setHref(session ? loggedInHref : guestHref)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [guestHref, loggedInHref])

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
