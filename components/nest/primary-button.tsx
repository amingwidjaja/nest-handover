"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import type { ReactNode } from "react"

const tapHover = {
  whileTap: { scale: 0.95 },
  whileHover: { y: -2 },
  transition: { type: "spring" as const, stiffness: 460, damping: 32 }
}

type NestPrimaryLinkProps = {
  href: string
  className?: string
  children: ReactNode
  prefetch?: boolean
}

/** Primary CTA — spring tap + lift; Link wrapped to avoid motion/React DOM prop clashes */
export function NestPrimaryLink({
  href,
  className = "",
  children,
  prefetch
}: NestPrimaryLinkProps) {
  return (
    <motion.div className="w-full" {...tapHover}>
      <Link
        href={href}
        prefetch={prefetch}
        className={`block w-full text-center ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  )
}

type NestPrimaryButtonProps = {
  className?: string
  children: ReactNode
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  form?: string
}

export function NestPrimaryButton({
  className = "",
  children,
  type = "button",
  disabled,
  loading = false,
  onClick,
  form
}: NestPrimaryButtonProps) {
  const busy = Boolean(loading)
  return (
    <motion.button
      type={type}
      form={form}
      disabled={disabled || busy}
      onClick={onClick}
      className={className}
      aria-busy={busy}
      {...tapHover}
    >
      {busy ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>Memproses…</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}
