export const HANDOVER_ACTIVE_LIMITS = {
  personal: 50,
  umkm: 100
} as const

export type UserTypeKey = keyof typeof HANDOVER_ACTIVE_LIMITS
