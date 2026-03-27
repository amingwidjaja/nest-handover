"use client"

import { useEffect, useRef } from "react"
import Map, { Marker, type MapRef } from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"

export type Coords = {
  lat: number
  lng: number
  accuracy?: number
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export default function ValidationMap({ coords }: { coords: Coords }) {
  const mapRef = useRef<MapRef>(null)
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const key = `${coords.lat.toFixed(6)}_${coords.lng.toFixed(6)}`
    if (lastKey.current === key) return
    lastKey.current = key
    map.easeTo({ center: [coords.lng, coords.lat], zoom: 16, duration: 450 })
  }, [coords.lat, coords.lng])

  if (!TOKEN) return (
    <div className="flex h-full items-center justify-center bg-[var(--paper)] px-10 text-center text-[10px] font-bold font-mono uppercase tracking-widest text-red-800">
      SISTEM: TOKEN TIDAK AKTIF
    </div>
  )

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={TOKEN}
      initialViewState={{ longitude: coords.lng, latitude: coords.lat, zoom: 16 }}
      onLoad={() => {
        const map = mapRef.current?.getMap()
        if (!map) return
        lastKey.current = `${coords.lat.toFixed(6)}_${coords.lng.toFixed(6)}`
        map.jumpTo({ center: [coords.lng, coords.lat], zoom: 16 })
      }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: "100%", height: "100%" }}
    >
      <Marker longitude={coords.lng} latitude={coords.lat} anchor="center">
        <div className="relative z-10 h-5 w-5 rounded-full border-2 border-[var(--paper)] bg-[#3E2723] shadow-xl" />
      </Marker>
    </Map>
  )
}
