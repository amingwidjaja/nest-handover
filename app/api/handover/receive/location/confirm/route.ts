import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

// 🔥 TARGET LOKASI (sementara hardcode)
const TARGET = {
  lat: -6.2000,
  lng: 106.8166
}

const MAX_RADIUS = 100 // meter

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3
  const φ1 = lat1 * (Math.PI / 180)
  const φ2 = lat2 * (Math.PI / 180)
  const Δφ = (lat2 - lat1) * (Math.PI / 180)
  const Δλ = (lon2 - lon1) * (Math.PI / 180)

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { lat, lng, accuracy, handover_id } = body

    // FIX 1: Gunakan pengecekan null/undefined agar koordinat 0 tidak dianggap error
    if (lat === undefined || lng === undefined || !handover_id) {
      return NextResponse.json({ error: "Data koordinat atau ID tidak lengkap" }, { status: 400 })
    }

    // 🔥 Reverse Geocode (Mapbox)
    let address = ""
    try {
      const geo = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      )
      const geoData = await geo.json()
      address = geoData.features?.[0]?.place_name || "Alamat tidak ditemukan"
    } catch {
      address = "Gagal mengambil alamat"
    }

    // 🔥 Hitung jarak
    const distance = getDistance(lat, lng, TARGET.lat, TARGET.lng)
    const isValid = distance <= MAX_RADIUS

    // 🔥 FIX 2: Sesuaikan nama kolom dengan Migration 002 (gps_lat, gps_lng)
    // Jika Supabase kamu pakai nama lama (latitude), ganti lagi ke latitude ya!
    const { error } = await supabase
      .from("receive_event")
      .insert({
        handover_id,
        gps_lat: lat, 
        gps_lng: lng,
        gps_accuracy: accuracy || 0,
        address,
        distance_m: Math.round(distance),
        is_valid: isValid
      })

    if (error) {
        console.error("Supabase Error detail:", error);
        throw new Error(`Database Error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      address,
      distance: Math.round(distance),
      isValid
    })

  } catch (err: any) {
    console.error("Server Error detail:", err);
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}