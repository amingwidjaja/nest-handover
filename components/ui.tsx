'use client'

import React from 'react'

type CardProps = {
  children: React.ReactNode
  className?: string
}

export const Card = ({ children, className = "" }: CardProps) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline"
}

export const Button = ({ 
  children, 
  variant = "primary", 
  className = "", 
  ...props 
}: ButtonProps) => {

  const variants = {
    primary: "bg-indigo-600 text-white active:bg-indigo-700",
    secondary: "bg-slate-100 text-slate-900 active:bg-slate-200",
    outline: "border-2 border-slate-200 text-slate-600"
  }

  return (
    <button
      className={`w-full py-4 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

type BadgeProps = {
  status: string
}

export const Badge = ({ status }: BadgeProps) => {

  const isPending = status === "created"

  return (
    <span
      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
        isPending
          ? "bg-amber-100 text-amber-700"
          : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {isPending ? "⏳ Pending" : "✅ Selesai"}
    </span>
  )
}