"use client"

import { useEffect, useRef } from "react"
import * as atlas from "azure-maps-control"
import "azure-maps-control/dist/atlas.min.css"

export type Coords = {
  lat: number
  lng: number
  accuracy?: number
}

const TOKEN = process.env.NEXT_PUBLIC_AZURE_MAPS_KEY

export default function ValidationMap({ coords }: { coords: Coords }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef      = useRef<atlas.Map | null>(null)
  const markerRef   = useRef<atlas.HtmlMarker | null>(null)
  const lastKey     = useRef<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || !TOKEN) return

    const map = new atlas.Map(containerRef.current, {
      center: [coords.lng, coords.lat],
      zoom: 15,
      language: "id-ID",
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: TOKEN,
      },
      style: "road",
    })

    const marker = new atlas.HtmlMarker({
      position: [coords.lng, coords.lat],
      htmlContent: `<div style="width:20px;height:20px;background:#3E2723;border-radius:50%;border:2px solid #FAF9F6;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
    })

    map.events.add("ready", () => {
      map.markers.add(marker)
    })

    mapRef.current  = map
    markerRef.current = marker
    lastKey.current = `${coords.lat.toFixed(6)}_${coords.lng.toFixed(6)}`

    return () => map.dispose()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update camera + marker on GPS tick (no remount)
  useEffect(() => {
    const map    = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return

    const key = `${coords.lat.toFixed(6)}_${coords.lng.toFixed(6)}`
    if (lastKey.current === key) return
    lastKey.current = key

    marker.setOptions({ position: [coords.lng, coords.lat] })
    map.setCamera({
      center: [coords.lng, coords.lat],
      zoom: 15,
      type: "ease",
      duration: 450,
    })
  }, [coords.lat, coords.lng])

  if (!TOKEN) return (
    <div className="flex h-full items-center justify-center bg-[var(--paper)] px-10 text-center text-[10px] font-bold font-mono uppercase tracking-widest text-red-800">
      SISTEM: TOKEN TIDAK AKTIF
    </div>
  )

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
}
