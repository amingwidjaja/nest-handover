/** Session source of truth for Lite vs Pro handover flow (localStorage). */
export const HANDOVER_MODE_KEY = "handover_mode" as const

export type HandoverMode = "lite" | "pro"

export function readHandoverMode(): HandoverMode | null {
  if (typeof window === "undefined") return null
  try {
    const v = localStorage.getItem(HANDOVER_MODE_KEY)
    if (v === "lite" || v === "pro") return v
  } catch {
    /* ignore */
  }
  return null
}
