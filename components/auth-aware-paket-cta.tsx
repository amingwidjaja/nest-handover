"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

type Props = {
  /** e.g. /paket */
  loggedInHref: string
  /** e.g. /login */
  guestHref: string
  className?: string
  children?: ReactNode
  /** When set with guestLabel, overrides children for the hero CTA text */
  loggedInLabel?: string
  guestLabel?: string
}

export function AuthAwarePaketCta({
  loggedInHref,
  guestHref,
  className,
  children,
  loggedInLabel,
  guestLabel
}: Props) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { session: s }
      } = await supabase.auth.getSession()
      if (cancelled) return
      setSession(!!s)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const useLabels = Boolean(loggedInLabel && guestLabel)

  if (!ready) {
    return (
      <div
        className={`${className ?? ""} pointer-events-none select-none opacity-60`}
        aria-busy="true"
      >
        {useLabels ? guestLabel : children}
      </div>
    )
  }

  const href = session ? loggedInHref : guestHref

  return (
    <Link href={href} className={className}>
      {useLabels ? (session ? loggedInLabel : guestLabel) : children}
    </Link>
  )
}
