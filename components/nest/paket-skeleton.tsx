"use client"

/**
 * Skeleton layout mirrors the handover mode cards (Lite dashed / Pro solid)
 * while the Paket hub loads auth state.
 */
export function PaketHubSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-screen max-w-lg flex-col px-8 pb-12 pt-16 text-center"
      aria-busy
      aria-label="Memuat"
    >
      <div className="nest-shimmer mx-auto mb-6 h-24 w-44 rounded-sm" />

      <div className="nest-shimmer mx-auto mb-3 h-3 w-28 rounded-full opacity-80" />

      <div className="nest-shimmer mx-auto mb-8 mt-8 h-7 max-w-md rounded-sm" />

      <div className="nest-shimmer mx-auto mb-4 h-4 max-w-lg rounded-sm opacity-70" />
      <div className="nest-shimmer mx-auto mb-12 h-4 max-w-sm rounded-sm opacity-60" />

      <div className="mx-auto w-full max-w-xs space-y-4">
        <div className="nest-border-drawing-dashed nest-shimmer h-14 rounded-sm bg-white/50" />
        <div className="nest-border-drawing nest-shimmer h-14 rounded-sm bg-white/70" />
      </div>

      <div className="mx-auto mt-10 space-y-3">
        <div className="nest-shimmer mx-auto h-3 w-16 rounded-full" />
        <div className="nest-shimmer mx-auto h-3 w-36 rounded-full opacity-70" />
      </div>
    </div>
  )
}
