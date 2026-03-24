"use client"

import { useEffect, useRef } from "react"
import Map, { Marker, type MapRef } from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export type Coords = {
  lat: number
  lng: number
  accuracy?: number
}

/**
 * No remount on GPS ticks — camera moves via `easeTo` only when coords meaningfully change.
 */
export default function ValidationMap({ coords }: { coords: Coords }) {
  const mapRef = useRef<MapRef>(null)
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    const key = `${coords.lat.toFixed(6)}_${coords.lng.toFixed(6)}`
    if (lastKey.current === key) return
    lastKey.current = key

    map.easeTo({
      center: [coords.lng, coords.lat],
      zoom: 16,
      duration: 450
    })
  }, [coords.lat, coords.lng])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-full text-[10px] font-mono text-red-800 uppercase tracking-widest px-10 text-center font-bold bg-[var(--paper)]">
        SISTEM: TOKEN TIDAK AKTIF
      </div>
    )
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: coords.lng,
        latitude: coords.lat,
        zoom: 16
      }}
      onLoad={() => {
        const map = mapRef.current?.getMap()
        if (!map) return
        const key = `${coords.lat.toFixed(6)}_${coords.lng.toFixed(6)}`
        lastKey.current = key
        map.jumpTo({ center: [coords.lng, coords.lat], zoom: 16 })
      }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: "100%", height: "100%" }}
    >
      <Marker longitude={coords.lng} latitude={coords.lat} anchor="center">
        <div className="relative flex items-center justify-center">
          <div className="w-5 h-5 bg-[#3E2723] rounded-full border-2 border-[var(--paper)] shadow-xl z-10" />
        </div>
      </Marker>
    </Map>
  )
}
